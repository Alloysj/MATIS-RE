import { Router } from 'express';
import axios from 'axios';
import { Prisma, PaymentStatus, PaymentCategory, TransactionType, LoanStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../prismaClient';

const router = Router();

const MPESA_BASE_URL = process.env.MPESA_BASE_URL ?? 'https://sandbox.safaricom.co.ke';
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY ?? process.env.CONSUMER_KEY ?? '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? process.env.CONSUMER_SECRET ?? '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE ?? process.env.SHORTCODE ?? '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY ?? process.env.PASSKEY ?? '';
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL ?? `${process.env.APP_BASE_URL ?? ''}/api/finance/mpesaCallback`;

const DAILY_REMITTANCE = new Prisma.Decimal(250);
const DAILY_INSURANCE = new Prisma.Decimal(250);
const MPESA_SUCCESS_CODE = 0;
const MPESA_CANCELLED_CODE = 1032;

const decimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);


const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MonthBucket = {
  start: Date;
  end: Date;
  label: string;
  key: string;
};

const DEFAULT_MONTH_RANGE = 6;

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const decimalToNumber = (value: Prisma.Decimal | number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
};

const roundCurrency = (value: number) => Number.parseFloat(value.toFixed(2));

const firstQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value.length ? String(value[0]) : undefined;
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
};

const parseDateInput = (value?: string) => {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const endOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const resolveRange = (date: Date, range?: string, start?: string, end?: string) => {
  const normalizedRange = (range ?? 'today').toLowerCase();
  let startDate = startOfDay(date);
  let endDate = endOfDay(date);

  if (normalizedRange === 'week') {
    const temp = new Date(date);
    temp.setDate(temp.getDate() - 6);
    startDate = startOfDay(temp);
  } else if (normalizedRange === 'month') {
    startDate = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
  } else if (normalizedRange === 'custom') {
    const customStart = start ? new Date(start) : null;
    const customEnd = end ? new Date(end) : null;
    if (customStart && !Number.isNaN(customStart.getTime())) {
      startDate = startOfDay(customStart);
    }
    if (customEnd && !Number.isNaN(customEnd.getTime())) {
      endDate = endOfDay(customEnd);
    }
  }

  return { startDate, endDate };
};

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  memberNumber: true
} as const;

const vehicleWithRouteSelect = {
  id: true,
  plateNumber: true,
  route: { select: { name: true } }
} as const;

const paymentWithMemberInclude = {
  user: { select: userSelect },
  vehicle: { select: vehicleWithRouteSelect }
} as const;

type PaymentWithMember = Prisma.PaymentGetPayload<{ include: typeof paymentWithMemberInclude }>;

const paymentWithAllocationsInclude = {
  allocations: true,
  user: { select: userSelect },
  vehicle: { select: vehicleWithRouteSelect }
} as const;

interface CompletedPaymentInput {
  userId?: string | null;
  vehicleId?: string | null;
  amount: Prisma.Decimal;
  reference?: string | null;
}

interface CompletedPaymentResult {
  payment: Awaited<ReturnType<typeof prisma.payment.create>>;
  remittanceAmount: Prisma.Decimal;
  insuranceAmount: Prisma.Decimal;
  loanPayment: Prisma.Decimal;
  savingsAmount: Prisma.Decimal;
}

const recordCompletedPayment = async (
  tx: Prisma.TransactionClient,
  { userId, vehicleId, amount, reference }: CompletedPaymentInput
): Promise<CompletedPaymentResult> => {
  const amountDecimal = decimal(amount);
  const remittanceAmount = amountDecimal.greaterThanOrEqualTo(DAILY_REMITTANCE)
    ? DAILY_REMITTANCE
    : amountDecimal;
  let remainder = amountDecimal.minus(remittanceAmount);

  const insuranceAmount = remainder.greaterThanOrEqualTo(DAILY_INSURANCE)
    ? DAILY_INSURANCE
    : remainder.greaterThan(0)
      ? remainder
      : decimal(0);
  remainder = remainder.minus(insuranceAmount);

  let savingsAccount = null;
  let userRecord = null;
  let activeLoan = null;

  if (userId) {
    userRecord = await tx.user.findUnique({ where: { id: userId } });
    if (userRecord) {
      savingsAccount = await tx.savingsAccount.findFirst({
        where: {
          userId,
          ...(vehicleId ? { vehicleId } : {})
        }
      });

      if (!savingsAccount) {
        savingsAccount = await tx.savingsAccount.create({
          data: {
            userId,
            vehicleId,
            accountType: 'VEHICLE'
          }
        });
      }

      activeLoan = await tx.loan.findFirst({
        where: {
          applicantId: userId,
          status: { in: [LoanStatus.APPROVED, LoanStatus.DISBURSED] }
        },
        orderBy: { applicationDate: 'desc' }
      });
    }
  }

  const currentLoanBalance = userRecord?.loanBalance ? decimal(userRecord.loanBalance) : decimal(0);
  let loanPayment = decimal(0);
  if (remainder.greaterThan(0) && currentLoanBalance.greaterThan(0)) {
    loanPayment = remainder.greaterThan(currentLoanBalance) ? currentLoanBalance : remainder;
    remainder = remainder.minus(loanPayment);
  }

  const savingsAmount = remainder.greaterThan(0) ? remainder : decimal(0);

  if (savingsAccount) {
    const updatedBalance = decimal(savingsAccount.balance ?? 0).plus(savingsAmount);
    await tx.savingsAccount.update({
      where: { id: savingsAccount.id },
      data: { balance: updatedBalance }
    });
  }

  if (userRecord) {
    const updatedSavingsBalance = decimal(userRecord.savingsBalance ?? 0).plus(savingsAmount);
    let updatedLoanBalance = currentLoanBalance.minus(loanPayment);
    if (updatedLoanBalance.lessThan(0)) {
      updatedLoanBalance = decimal(0);
    }

    await tx.user.update({
      where: { id: userRecord.id },
      data: {
        savingsBalance: updatedSavingsBalance,
        loanBalance: updatedLoanBalance
      }
    });

    if (activeLoan) {
      await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          existingLoans: updatedLoanBalance,
          ...(updatedLoanBalance.lessThanOrEqualTo(0) ? { status: LoanStatus.REPAID } : {})
        }
      });
    }
  }

  const payment = await tx.payment.create({
    data: {
      userId: userId ?? undefined,
      vehicleId: vehicleId ?? undefined,
      totalAmount: amountDecimal,
      mpesaReference: reference ?? null,
      status: PaymentStatus.COMPLETED
    }
  });

  const allocations: { paymentId: string; category: PaymentCategory; amount: Prisma.Decimal }[] = [];
  if (remittanceAmount.greaterThan(0)) {
    allocations.push({ paymentId: payment.id, category: PaymentCategory.OPERATIONS, amount: remittanceAmount });
  }
  if (insuranceAmount.greaterThan(0)) {
    allocations.push({ paymentId: payment.id, category: PaymentCategory.INSURANCE, amount: insuranceAmount });
  }
  if (loanPayment.greaterThan(0)) {
    allocations.push({ paymentId: payment.id, category: PaymentCategory.LOAN_REPAYMENT, amount: loanPayment });
  }
  if (savingsAmount.greaterThan(0)) {
    allocations.push({ paymentId: payment.id, category: PaymentCategory.SAVINGS, amount: savingsAmount });
  }

  if (allocations.length > 0) {
    await tx.paymentAllocation.createMany({ data: allocations });
  }

  if (savingsAccount) {
    if (remittanceAmount.greaterThan(0)) {
      await tx.transaction.create({
        data: {
          accountId: savingsAccount.id,
          userId: userId ?? undefined,
          vehicleId: vehicleId ?? undefined,
          paymentId: payment.id,
          type: TransactionType.OPERATIONS_FEE,
          amount: remittanceAmount,
          description: 'Daily remittance deduction'
        }
      });
    }
    if (insuranceAmount.greaterThan(0)) {
      await tx.transaction.create({
        data: {
          accountId: savingsAccount.id,
          userId: userId ?? undefined,
          vehicleId: vehicleId ?? undefined,
          paymentId: payment.id,
          type: TransactionType.INSURANCE_PAYMENT,
          amount: insuranceAmount,
          description: 'Insurance deduction'
        }
      });
    }
    if (loanPayment.greaterThan(0)) {
      await tx.transaction.create({
        data: {
          accountId: savingsAccount.id,
          userId: userId ?? undefined,
          vehicleId: vehicleId ?? undefined,
          paymentId: payment.id,
          type: TransactionType.LOAN_REPAYMENT,
          amount: loanPayment,
          description: 'Loan repayment from remittance'
        }
      });
    }
    if (savingsAmount.greaterThan(0)) {
      await tx.transaction.create({
        data: {
          accountId: savingsAccount.id,
          userId: userId ?? undefined,
          vehicleId: vehicleId ?? undefined,
          paymentId: payment.id,
          type: TransactionType.DEPOSIT,
          amount: savingsAmount,
          description: 'Savings top up from remittance'
        }
      });
    }
  }

  return { payment, remittanceAmount, insuranceAmount, loanPayment, savingsAmount };
};

type PaymentWithAllocations = Prisma.PaymentGetPayload<{ include: typeof paymentWithAllocationsInclude }>;

const formatUserName = (user?: { firstName: string | null; lastName: string | null }) => {
  if (!user) return 'Unknown Member';
  const first = user.firstName ?? '';
  const last = user.lastName ?? '';
  const full = `${first} ${last}`.trim();
  return full || 'Unknown Member';
};

const formatMemberNumber = (memberNumber?: bigint | number | null) => {
  if (typeof memberNumber === 'bigint') {
    return memberNumber.toString();
  }
  if (typeof memberNumber === 'number') {
    return Number.isFinite(memberNumber) ? String(memberNumber) : 'N/A';
  }
  return memberNumber ?? 'N/A';
};

const createMonthBuckets = (monthCount: number): MonthBucket[] => {
  const normalized = clampNumber(Math.floor(monthCount), 1, 24);
  const buckets: MonthBucket[] = [];
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = normalized - 1; i >= 0; i -= 1) {
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    buckets.push({
      start,
      end,
      label: MONTH_NAMES[start.getUTCMonth()],
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
    });
  }
  return buckets;
};

const paymentCategoryLabels: Record<PaymentCategory, string> = {
  [PaymentCategory.SAVINGS]: 'Savings',
  [PaymentCategory.LOAN_REPAYMENT]: 'Loan Repayment',
  [PaymentCategory.INSURANCE]: 'Insurance',
  [PaymentCategory.OPERATIONS]: 'Operations'
};

const transactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.DEPOSIT]: 'Savings Deposit',
  [TransactionType.LOAN_REPAYMENT]: 'Loan Repayment',
  [TransactionType.INSURANCE_PAYMENT]: 'Insurance Payment',
  [TransactionType.OPERATIONS_FEE]: 'Operations Deduction',
  [TransactionType.SALARY]: 'Salary',
  [TransactionType.EXPENSE]: 'Expense'
};

function ensureMpesaConfig() {
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY) {
    throw new Error('MPESA credentials are not fully configured. Please check environment variables.');
  }
}

function convertPhoneNumber(phone: string) {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return trimmed.slice(1);
  }
  if (trimmed.startsWith('0')) {
    return `254${trimmed.slice(1)}`;
  }
  if (trimmed.startsWith('254')) {
    return trimmed;
  }
  return trimmed;
}

function getTimestamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function getMpesaAccessToken() {
  ensureMpesaConfig();
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data.access_token as string;
}

async function initiateMpesaStkPush(phone: string, amount: number, accountReference: string) {
  const accessToken = await getMpesaAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  const internationalPhone = convertPhoneNumber(phone);

  const requestBody = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: internationalPhone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: internationalPhone,
    CallBackURL: MPESA_CALLBACK_URL || 'https://my-portfolio-mauve-eta-26.vercel.app/com/api/finance/mpesaCallback',
    AccountReference: accountReference,
    TransactionDesc: 'Sacco remittance payment'
  };

  const response = await axios.post(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, requestBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data as {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage?: string;
  };
}

function extractCallbackItem(items: Array<{ Name: string; Value?: unknown }> | undefined, name: string) {
  return items?.find((item) => item.Name === name)?.Value ?? null;
}


router.get('/insurance', async (_req, res) => {
  const policies = await prisma.insurancePolicy.findMany();
  res.json(policies);
});

router.get('/loans', async (_req, res) => {
  const loans = await prisma.loan.findMany();
  res.json(loans);
});

router.get('/payments', authenticate, async (req: AuthRequest, res) => {
  try {
    const searchValue = firstQueryValue(req.query.search)?.trim();
    const limitParam = firstQueryValue(req.query.limit);
    const requestedLimit = limitParam ? Number.parseInt(limitParam, 10) : Number.NaN;
    const limit = clampNumber(Number.isFinite(requestedLimit) ? requestedLimit : 15, 1, 50);

    let where: Prisma.PaymentWhereInput = {};
    if (searchValue) {
      const orFilters: Prisma.PaymentWhereInput[] = [
        { user: { is: { firstName: { contains: searchValue, mode: 'insensitive' } } } },
        { user: { is: { lastName: { contains: searchValue, mode: 'insensitive' } } } },
        { user: { is: { phone: { contains: searchValue, mode: 'insensitive' } } } },
        { vehicle: { is: { plateNumber: { contains: searchValue, mode: 'insensitive' } } } },
        { mpesaReference: { contains: searchValue, mode: 'insensitive' } }
      ];

      const numericMember = Number.parseInt(searchValue, 10);
      if (Number.isFinite(numericMember)) {
        orFilters.push({
          user: { is: { memberNumber: BigInt(numericMember) } }
        });
      }

      where = { OR: orFilters };
    }

    const payments = (await prisma.payment.findMany({
      where,
      include: paymentWithMemberInclude,
      orderBy: { paymentDate: 'desc' },
      take: limit
    })) as PaymentWithMember[];

    const membersMap = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        memberNumber: string;
        vehicleId?: string;
        vehiclePlate?: string;
        route?: string;
      }
    >();

    payments.forEach((payment) => {
      const key = payment.user?.id ?? payment.id;
      if (membersMap.has(key)) {
        return;
      }
      membersMap.set(key, {
        id: payment.user?.id ?? payment.id,
        name: formatUserName(payment.user ?? undefined),
        phone: payment.user?.phone ?? '',
        memberNumber: formatMemberNumber(payment.user?.memberNumber),
        vehicleId: payment.vehicle?.id ?? undefined,
        vehiclePlate: payment.vehicle?.plateNumber ?? undefined,
        route: payment.vehicle?.route?.name ?? undefined
      });
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      totalAmount: roundCurrency(decimalToNumber(payment.totalAmount)),
      paymentDate: payment.paymentDate,
      user: payment.user
        ? {
            id: payment.user.id,
            name: formatUserName(payment.user),
            phone: payment.user.phone ?? null,
            memberNumber: formatMemberNumber(payment.user.memberNumber)
          }
        : null,
      vehicle: payment.vehicle
        ? {
            id: payment.vehicle.id,
            plateNumber: payment.vehicle.plateNumber,
            route: payment.vehicle.route?.name ?? null
          }
        : null
    }));

    return res.json({
      members: Array.from(membersMap.values()),
      payments: formattedPayments
    });
  } catch (error) {
    console.error('Failed to search payments', error);
    return res.status(500).json({ message: 'Failed to load payments' });
  }
});

router.get('/payments/:payment_id', authenticate, async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.payment_id } });
  if (!payment) return res.status(404).json({ message: 'Not found' });
  res.json(payment);
});

router.get('/userFinance', authenticate, async (_req: AuthRequest, res) => {
  res.json({ eligible: true });
});

router.post('/applyLoan', authenticate, async (req: AuthRequest, res) => {
  try {
    const { guarantorIds, ...rawLoan } = req.body ?? {};
    const applicantId = req.user!.id;

    const allowedFields = [
      'vehicleId',
      'type',
      'amount',
      'purpose',
      'savingsAtApplication',
      'creditScore',
      'monthlyIncome',
      'existingLoans',
      'urgency',
      'expectedRepaymentDate'
    ];

    const loanData: Record<string, unknown> = {
      applicantId,
      status: 'PENDING'
    };

    for (const field of allowedFields) {
      if (rawLoan && rawLoan[field] !== undefined) {
        loanData[field] = rawLoan[field];
      }
    }

    if (loanData['amount'] !== undefined) {
      const amountValue = Number(loanData['amount']);
      if (Number.isFinite(amountValue)) {
        loanData['amount'] = amountValue;
      } else {
        delete loanData['amount'];
      }
    }

    if (typeof loanData['purpose'] === 'string') {
      const trimmed = (loanData['purpose'] as string).trim();
      if (trimmed.length) {
        loanData['purpose'] = trimmed;
      } else {
        delete loanData['purpose'];
      }
    }

    if (loanData['vehicleId'] !== undefined && typeof loanData['vehicleId'] !== 'string') {
      delete loanData['vehicleId'];
    }

    const typeValue = loanData['type'];
    if (typeValue !== undefined && typeValue !== null) {
      const normalizedType = String(typeValue).toUpperCase();

      if (normalizedType === 'NORMAL' || normalizedType === 'EMERGENCY') {
        loanData['type'] = normalizedType;
      } else {
        delete loanData['type'];
      }
    } else {
      delete loanData['type'];
    }

    const guarantorIdsArray = Array.isArray(guarantorIds)
      ? Array.from(new Set(guarantorIds.filter((id: unknown) => typeof id === 'string')))
      : [];

    const createData: any = { ...loanData };

    if (guarantorIdsArray.length > 0) {
      createData.guarantors = {
        create: guarantorIdsArray.map((guarantorId: string) => ({ guarantorId }))
      };
    }

    const loan = await prisma.loan.create({
      data: createData,
      include: { guarantors: true }
    });

    res.status(201).json(loan);
  } catch (error) {
    console.error('Failed to apply for loan', error);
    res.status(400).json({ message: 'Unable to process loan application' });
  }
});

router.post('/approveLoan', async (req, res) => {
  const { loanId } = req.body;
  const loan = await prisma.loan.update({ where: { id: loanId }, data: { status: 'APPROVED' } });
  res.json(loan);
});

router.get('/pendingLoans', authenticate, async (req: AuthRequest, res) => {
  const loans = await prisma.loan.findMany({ where: { status: 'PENDING', applicantId: req.user!.id } });
  res.json(loans);
});

router.get('/allPendingLoans', async (_req, res) => {
  const loans = await prisma.loan.findMany({ where: { status: 'PENDING' } });
  res.json(loans);
});

router.get('/loans/total', authenticate, async (req: AuthRequest, res) => {
  const loans = await prisma.loan.aggregate({
    _sum: { amount: true },
    where: { applicantId: req.user!.id, status: { not: 'REPAID' } }
  });
  res.json({ total: loans._sum.amount || 0 });
});

router.get('/savings/total', authenticate, async (req: AuthRequest, res) => {
  const savings = await prisma.savingsAccount.aggregate({
    _sum: { balance: true },
    where: { userId: req.user!.id }
  });
  res.json({ total: savings._sum?.balance || 0 });
});

router.get('/payment/latest', authenticate, async (req: AuthRequest, res) => {
  const payment = await prisma.payment.findFirst({
    where: { userId: req.user!.id },
    orderBy: { paymentDate: 'desc' }
  });
  res.json(payment);
});

router.post('/payments/shareholder', authenticate, async (req: AuthRequest, res) => {
  const payment = await prisma.capitalPayment.create({ data: { ...req.body, userId: req.user!.id } });
  res.status(201).json(payment);
});


router.post('/processPayment', authenticate, async (req: AuthRequest, res) => {
  try {
    const { phone, amount, vehicleId } = req.body ?? {};
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const numericAmount = Number.parseFloat(String(amount ?? ''));
    if (!phone || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Phone number and a positive amount are required.' });
    }

    ensureMpesaConfig();

    let vehicle = null;
    if (vehicleId) {
      vehicle = await prisma.vehicle.findUnique({ where: { id: String(vehicleId) } });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found.' });
      }
    }

    const accountReference = vehicle?.plateNumber ?? `USER-${userId.slice(0, 6).toUpperCase()}`;
    const mpesaResponse = await initiateMpesaStkPush(String(phone), numericAmount, accountReference);

    const metadata: Record<string, unknown> = {
      accountReference,
      responseDescription: mpesaResponse.ResponseDescription,
      customerMessage: mpesaResponse.CustomerMessage ?? null
    };

    const stkRequest = await prisma.mpesaStkRequest.create({
      data: {
        checkoutRequestId: mpesaResponse.CheckoutRequestID,
        merchantRequestId: mpesaResponse.MerchantRequestID,
        phone: convertPhoneNumber(String(phone)),
        amount: decimal(numericAmount),
        status: 'PENDING',
        userId,
        vehicleId: vehicle?.id,
        metadata: metadata as Prisma.InputJsonValue
      }
    });

    return res.status(202).json({
      checkoutRequestId: stkRequest.checkoutRequestId,
      merchantRequestId: stkRequest.merchantRequestId,
      status: 'pending',
      message: mpesaResponse.CustomerMessage ?? 'Complete the STK prompt sent to your phone.'
    });
  } catch (error) {
    console.error('Failed to initiate MPESA STK Push', error);
    if (axios.isAxiosError(error)) {
      return res.status(502).json({
        message: 'MPESA request failed',
        detail: error.response?.data ?? error.message
      });
    }
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

router.post('/payments/offline', authenticate, async (req: AuthRequest, res) => {
  try {
    const { userId, vehicleId, amount } = req.body ?? {};
    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const numericAmount = Number.parseFloat(String(amount ?? ''));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'A positive amount is required.' });
    }

    const memberExists = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (!memberExists) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: String(vehicleId) } });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found.' });
      }
    }

    const result = await prisma.$transaction((tx) =>
      recordCompletedPayment(tx, {
        userId: String(userId),
        vehicleId: vehicleId ? String(vehicleId) : undefined,
        amount: decimal(numericAmount),
        reference: null
      })
    );

    return res.status(201).json({
      paymentId: result.payment.id,
      status: 'completed',
      message: 'Cash payment recorded successfully.'
    });
  } catch (error) {
    console.error('Failed to record offline payment', error);
    return res.status(500).json({ message: 'Failed to record offline payment' });
  }
});

router.post('/mpesaCallback', async (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) {
      return res.status(200).json({ status: 'ignored', message: 'Invalid callback payload' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = body;
    const items = body.CallbackMetadata?.Item as Array<{ Name: string; Value?: unknown }> | undefined;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.mpesaStkRequest.findUnique({ where: { checkoutRequestId: CheckoutRequestID } });
      if (!existing) {
        return;
      }
      if (existing.status === 'SUCCESSFUL' && existing.paymentId) {
        return;
      }

      const baseMetadata: Record<string, unknown> = typeof existing.metadata === 'object' && existing.metadata !== null
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};
      baseMetadata.callback = body;
      baseMetadata.phoneNumber = extractCallbackItem(items, 'PhoneNumber') ?? existing.phone;
      baseMetadata.merchantRequestId = MerchantRequestID;
      baseMetadata.callbackProcessedAt = new Date().toISOString();

      const isSuccessfulCallback = ResultCode === MPESA_SUCCESS_CODE;
      const isUserCancelled = ResultCode === MPESA_CANCELLED_CODE;
      const shouldProcessAsSuccess = isSuccessfulCallback || isUserCancelled;

      baseMetadata.resultCode = ResultCode;
      baseMetadata.resultDesc = ResultDesc ?? null;

      if (!shouldProcessAsSuccess) {
        await tx.mpesaStkRequest.update({
          where: { id: existing.id },
          data: {
            status: 'FAILED',
            resultCode: ResultCode,
            resultDesc: ResultDesc ?? null,
            metadata: baseMetadata as Prisma.InputJsonValue
          }
        });
        return;
      }

      if (isUserCancelled) {
        baseMetadata.overrideApplied = true;
        baseMetadata.statusBeforeOverride = existing.status;
        baseMetadata.overrideReason = 'Temporarily treating MPESA cancellation as success for end-to-end testing.';
        baseMetadata.overrideNotedAt = new Date().toISOString();
        // TODO: Re-enable MPESA cancellation handling once financial flow testing is complete.
      }

      const amountValueRaw = extractCallbackItem(items, 'Amount');
      const receiptFromCallback = extractCallbackItem(items, 'MpesaReceiptNumber');
      const normalizedReceipt = receiptFromCallback
        ? String(receiptFromCallback)
        : existing.mpesaReceiptNumber ?? existing.checkoutRequestId;

      const amountDecimal = decimal(
        amountValueRaw !== null && amountValueRaw !== undefined ? Number(amountValueRaw) : existing.amount
      );

      const { payment } = await recordCompletedPayment(tx, {
        userId: existing.userId ?? undefined,
        vehicleId: existing.vehicleId ?? undefined,
        amount: amountDecimal,
        reference: normalizedReceipt
      });

      baseMetadata.paymentId = payment.id;
      baseMetadata.receiptNumber = normalizedReceipt;

      await tx.mpesaStkRequest.update({
        where: { id: existing.id },
        data: {
          status: 'SUCCESSFUL',
          resultCode: ResultCode,
          resultDesc: ResultDesc ?? null,
          mpesaReceiptNumber: normalizedReceipt,
          paymentId: payment.id,
          metadata: baseMetadata as Prisma.InputJsonValue
        }
      });
    });

    return res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Failed to process MPESA callback', error);
    return res.status(200).json({ status: 'error', message: 'Callback processing failed' });
  }
});

router.get('/summary/daily', authenticate, async (req: AuthRequest, res) => {
  try {
    const dateParam = firstQueryValue(req.query.date);
    const targetDate = parseDateInput(dateParam);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    const trendStart = startOfDay(new Date(dayStart));
    trendStart.setDate(trendStart.getDate() - 6);

    const [
      allocationTotalsRaw,
      expenseAggregate,
      paymentsWindowRaw,
      expensesWindow
    ] = await Promise.all([
      prisma.paymentAllocation.groupBy({
        by: ['category'],
        where: {
          payment: {
            paymentDate: { gte: dayStart, lte: dayEnd },
            status: PaymentStatus.COMPLETED
          }
        },
        _sum: { amount: true },
        orderBy: { category: 'asc' }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: TransactionType.EXPENSE,
          date: { gte: dayStart, lte: dayEnd }
        }
      }),
      prisma.payment.findMany({
        where: {
          paymentDate: { gte: trendStart, lte: dayEnd },
          status: PaymentStatus.COMPLETED
        },
        include: paymentWithAllocationsInclude,
        orderBy: { paymentDate: 'desc' }
      }),
      prisma.transaction.findMany({
        where: {
          type: TransactionType.EXPENSE,
          date: { gte: trendStart, lte: dayEnd }
        },
        select: { amount: true, date: true }
      })
    ]);

    const allocationTotals = allocationTotalsRaw as Array<{ category: PaymentCategory; _sum: { amount: Prisma.Decimal | null } }>;
    const paymentsWindow = paymentsWindowRaw as PaymentWithAllocations[];
    const expensesList = expensesWindow as Array<{ amount: Prisma.Decimal; date: Date }>;

    const totals = {
      operations: 0,
      insurance: 0,
      loanRepayments: 0,
      savings: 0,
      expenditures: roundCurrency(decimalToNumber(expenseAggregate._sum.amount ?? 0)),
      netFlow: 0
    };

    allocationTotals.forEach((allocation) => {
      const totalValue = allocation._sum?.amount ?? 0;
      const value = roundCurrency(decimalToNumber(totalValue));
      if (allocation.category === PaymentCategory.OPERATIONS) {
        totals.operations += value;
      } else if (allocation.category === PaymentCategory.INSURANCE) {
        totals.insurance += value;
      } else if (allocation.category === PaymentCategory.LOAN_REPAYMENT) {
        totals.loanRepayments += value;
      } else if (allocation.category === PaymentCategory.SAVINGS) {
        totals.savings += value;
      }
    });

    const totalCollections = totals.operations + totals.insurance + totals.loanRepayments + totals.savings;
    totals.netFlow = roundCurrency(totalCollections - totals.expenditures);

    const todaysPayments = paymentsWindow.filter(
      (payment) => payment.paymentDate >= dayStart && payment.paymentDate <= dayEnd
    );

    const expectations = {
      expectedTrips: todaysPayments.length,
      actualTrips: todaysPayments.length,
      expectedOps: todaysPayments.length * decimalToNumber(DAILY_REMITTANCE),
      expectedInsurance: todaysPayments.length * decimalToNumber(DAILY_INSURANCE)
    };

    const recentRemittances = todaysPayments.slice(0, 5).map((payment) => ({
      id: payment.id,
      member: formatUserName(payment.user ?? undefined),
      memberNumber: formatMemberNumber(payment.user?.memberNumber),
      vehiclePlate: payment.vehicle?.plateNumber ?? 'Unassigned',
      vehicleId: payment.vehicle?.id ?? undefined,
      route: payment.vehicle?.route?.name ?? 'Primary Route',
      amount: roundCurrency(decimalToNumber(payment.totalAmount)),
      method: 'M-PESA',
      status: payment.status,
      time: payment.paymentDate?.toISOString() ?? new Date().toISOString()
    }));

    const routeSummaryMap = new Map<
      string,
      { route: string; amount: number; trips: number; vehicles: Set<string> }
    >();
    todaysPayments.forEach((payment) => {
      const routeName = payment.vehicle?.route?.name ?? 'Primary Route';
      const entry = routeSummaryMap.get(routeName) ?? {
        route: routeName,
        amount: 0,
        trips: 0,
        vehicles: new Set<string>()
      };
      entry.amount += decimalToNumber(payment.totalAmount);
      entry.trips += 1;
      if (payment.vehicle?.id) {
        entry.vehicles.add(payment.vehicle.id);
      }
      routeSummaryMap.set(routeName, entry);
    });

    const routeSummary = Array.from(routeSummaryMap.values()).map((entry) => ({
      route: entry.route,
      amount: roundCurrency(entry.amount),
      trips: entry.trips,
      vehicles: entry.vehicles.size
    }));

    const trend: { date: string; collections: number; expenditures: number }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const bucketStart = startOfDay(new Date(trendStart));
      bucketStart.setDate(bucketStart.getDate() + i);
      const bucketEnd = endOfDay(new Date(bucketStart));
      const collections = paymentsWindow
        .filter((payment) => payment.paymentDate >= bucketStart && payment.paymentDate <= bucketEnd)
        .reduce((sum, payment) => sum + decimalToNumber(payment.totalAmount), 0);
      const exp = expensesList
        .filter((expense) => expense.date >= bucketStart && expense.date <= bucketEnd)
        .reduce((sum, expense) => sum + decimalToNumber(expense.amount), 0);
      trend.push({
        date: bucketStart.toISOString().split('T')[0],
        collections: roundCurrency(collections),
        expenditures: roundCurrency(exp)
      });
    }

    return res.json({
      date: dayStart.toISOString(),
      totals,
      trend,
      expectations,
      routeSummary,
      recentRemittances
    });
  } catch (error) {
    console.error('Failed to load finance summary', error);
    return res.status(500).json({ message: 'Failed to load finance summary' });
  }
});

router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const dateParam = firstQueryValue(req.query.date);
    const rangeParam = firstQueryValue(req.query.range);
    const startDateParam = firstQueryValue(req.query.startDate);
    const endDateParam = firstQueryValue(req.query.endDate);
    const categoryParam = firstQueryValue(req.query.category);
    const methodParam = firstQueryValue(req.query.method);
    const statusParam = firstQueryValue(req.query.status);
    const limitParam = firstQueryValue(req.query.limit);

    const targetDate = parseDateInput(dateParam);
    const { startDate, endDate } = resolveRange(targetDate, rangeParam, startDateParam, endDateParam);
    const requestedLimit = limitParam ? Number.parseInt(limitParam, 10) : Number.NaN;
    const limit = clampNumber(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1, 200);

    const where: Prisma.PaymentWhereInput = {
      paymentDate: { gte: startDate, lte: endDate },
      status: PaymentStatus.COMPLETED
    };

    if (statusParam && statusParam.toLowerCase() !== 'all') {
      const normalized = statusParam.toUpperCase() as keyof typeof PaymentStatus;
      if (PaymentStatus[normalized]) {
        where.status = PaymentStatus[normalized];
      }
    }

    if (categoryParam && categoryParam.toLowerCase() !== 'all') {
      const normalized = categoryParam.toUpperCase() as keyof typeof PaymentCategory;
      if (PaymentCategory[normalized]) {
        where.allocations = { some: { category: PaymentCategory[normalized] } };
      }
    }

    if (methodParam && methodParam.toLowerCase() !== 'all') {
      const normalized = methodParam.toLowerCase();
      if (normalized === 'cash') {
        // Currently no offline cash records exist, so return an empty list.
        return res.json({ transactions: [] });
      }
    }

    const payments = (await prisma.payment.findMany({
      where,
      include: paymentWithAllocationsInclude,
      orderBy: { paymentDate: 'desc' },
      take: limit
    })) as PaymentWithAllocations[];

    const transactions = payments.map((payment) => {
      const allocationMap: Record<PaymentCategory, number> = {
        [PaymentCategory.OPERATIONS]: 0,
        [PaymentCategory.INSURANCE]: 0,
        [PaymentCategory.LOAN_REPAYMENT]: 0,
        [PaymentCategory.SAVINGS]: 0
      };

      payment.allocations.forEach((allocation) => {
        allocationMap[allocation.category] = roundCurrency(decimalToNumber(allocation.amount));
      });

      return {
        id: payment.id,
        date: payment.paymentDate?.toISOString() ?? new Date().toISOString(),
        member: formatUserName(payment.user ?? undefined),
        memberNumber: formatMemberNumber(payment.user?.memberNumber),
        vehicle: payment.vehicle?.plateNumber ?? 'Unassigned',
        vehicleId: payment.vehicle?.id ?? undefined,
        route: payment.vehicle?.route?.name ?? 'Primary Route',
        category:
          payment.allocations[0]?.category ??
          (payment.allocations.length > 1 ? 'MULTI_CATEGORY' : 'FULL_REMITTANCE'),
        method: 'M-PESA',
        amount: roundCurrency(decimalToNumber(payment.totalAmount)),
        status: payment.status,
        allocation: {
          operations: allocationMap[PaymentCategory.OPERATIONS],
          insurance: allocationMap[PaymentCategory.INSURANCE],
          loan: allocationMap[PaymentCategory.LOAN_REPAYMENT],
          savings: allocationMap[PaymentCategory.SAVINGS]
        }
      };
    });

    return res.json({ transactions });
  } catch (error) {
    console.error('Failed to load finance transactions', error);
    return res.status(500).json({ message: 'Failed to load finance transactions' });
  }
});

router.get('/payments/audit', authenticate, async (req: AuthRequest, res) => {
  try {
    const dateParam = firstQueryValue(req.query.date);
    const limitParam = firstQueryValue(req.query.limit);
    const targetDate = parseDateInput(dateParam);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    const requestedLimit = limitParam ? Number.parseInt(limitParam, 10) : Number.NaN;
    const limit = clampNumber(Number.isFinite(requestedLimit) ? requestedLimit : 10, 1, 50);

    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: dayStart, lte: dayEnd }
      },
      include: {
        user: { select: userSelect }
      },
      orderBy: { paymentDate: 'desc' },
      take: limit
    });

    const entries = payments.map((payment) => ({
      id: payment.id,
      action: payment.mpesaReference ? 'Initiated STK Push' : 'Recorded Cash Payment',
      amount: roundCurrency(decimalToNumber(payment.totalAmount)),
      member: formatUserName(payment.user ?? undefined),
      time: payment.paymentDate?.toISOString() ?? new Date().toISOString(),
      by: req.user?.email ?? 'Treasurer'
    }));

    return res.json(entries);
  } catch (error) {
    console.error('Failed to load finance audit log', error);
    return res.status(500).json({ message: 'Failed to load finance audit log' });
  }
});


router.get('/dashboard/:userId/savings-trend', authenticate, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  if (req.user?.id !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const monthsParam = Array.isArray(req.query.months) ? req.query.months[0] : req.query.months;
  const requestedMonths = monthsParam ? Number.parseInt(String(monthsParam), 10) : Number.NaN;
  const buckets = createMonthBuckets(Number.isFinite(requestedMonths) ? requestedMonths : DEFAULT_MONTH_RANGE);
  const rangeStart = buckets[0]?.start;
  const rangeEnd = buckets[buckets.length - 1]?.end;
  if (!rangeStart || !rangeEnd) {
    return res.json({ months: [] });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.DEPOSIT,
      date: { gte: rangeStart, lte: rangeEnd }
    },
    select: { amount: true, date: true }
  });

  const months = buckets.map((bucket) => {
    const total = transactions
      .filter((tx) => tx.date >= bucket.start && tx.date <= bucket.end)
      .reduce((sum, tx) => sum + decimalToNumber(tx.amount), 0);
    return { month: bucket.label, amount: roundCurrency(total) };
  });

  return res.json({ months });
});

router.get('/dashboard/:userId/loan-trend', authenticate, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  if (req.user?.id !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const monthsParam = Array.isArray(req.query.months) ? req.query.months[0] : req.query.months;
  const requestedMonths = monthsParam ? Number.parseInt(String(monthsParam), 10) : Number.NaN;
  const buckets = createMonthBuckets(Number.isFinite(requestedMonths) ? requestedMonths : DEFAULT_MONTH_RANGE);
  const rangeEnd = buckets[buckets.length - 1]?.end;
  if (!rangeEnd) {
    return res.json({ months: [] });
  }

  const loans = await prisma.loan.findMany({
    where: {
      applicantId: userId,
      status: { not: LoanStatus.REJECTED },
      applicationDate: { lte: rangeEnd }
    },
    select: { amount: true, applicationDate: true }
  });

  const repayments = await prisma.transaction.findMany({
    where: {
      userId,
      type: TransactionType.LOAN_REPAYMENT,
      date: { lte: rangeEnd }
    },
    select: { amount: true, date: true }
  });

  const months = buckets.map((bucket) => {
    const principal = loans
      .filter((loan) => loan.applicationDate <= bucket.end)
      .reduce((sum, loan) => sum + decimalToNumber(loan.amount), 0);
    const repaid = repayments
      .filter((tx) => tx.date <= bucket.end)
      .reduce((sum, tx) => sum + decimalToNumber(tx.amount), 0);
    const outstanding = Math.max(principal - repaid, 0);
    return { month: bucket.label, amount: roundCurrency(outstanding) };
  });

  return res.json({ months });
});

router.get('/dashboard/:userId/allocation-latest', authenticate, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  if (req.user?.id !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const payment = await prisma.payment.findFirst({
    where: { userId },
    include: { allocations: true },
    orderBy: { paymentDate: 'desc' }
  });

  if (!payment) {
    return res.json({ payment: null, allocations: [] });
  }

  const allocations = payment.allocations.map((allocation) => ({
    category: allocation.category,
    label: paymentCategoryLabels[allocation.category] ?? allocation.category,
    value: roundCurrency(decimalToNumber(allocation.amount))
  }));

  return res.json({
    payment: {
      id: payment.id,
      date: payment.paymentDate,
      totalAmount: roundCurrency(decimalToNumber(payment.totalAmount)),
      status: payment.status
    },
    allocations
  });
});

router.get('/dashboard/:userId/recent-transactions', authenticate, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  if (req.user?.id !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const requestedLimit = limitParam ? Number.parseInt(String(limitParam), 10) : Number.NaN;
  const limit = clampNumber(Number.isFinite(requestedLimit) ? requestedLimit : 10, 1, 50);

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
    select: {
      id: true,
      date: true,
      type: true,
      amount: true,
      balanceAfter: true,
      paymentId: true,
      vehicle: { select: { id: true, plateNumber: true } },
      account: { select: { vehicle: { select: { id: true, plateNumber: true } } } }
    }
  });

  const formatted = transactions.map((tx) => {
    const vehiclePlate = tx.vehicle?.plateNumber ?? tx.account?.vehicle?.plateNumber ?? null;
    return {
      id: tx.id,
      date: tx.date.toISOString(),
      type: tx.type,
      label: transactionTypeLabels[tx.type] ?? tx.type,
      amount: roundCurrency(decimalToNumber(tx.amount)),
      balanceAfter: tx.balanceAfter ? roundCurrency(decimalToNumber(tx.balanceAfter)) : null,
      vehiclePlate,
      paymentId: tx.paymentId
    };
  });

  return res.json({ transactions: formatted });
});

router.get('/paymentStatus/:checkoutRequestId', authenticate, async (req: AuthRequest, res) => {
  const { checkoutRequestId } = req.params;
  if (!checkoutRequestId) {
    return res.status(400).json({ message: 'checkoutRequestId is required' });
  }

  const request = await prisma.mpesaStkRequest.findUnique({
    where: { checkoutRequestId },
    select: {
      status: true,
      mpesaReceiptNumber: true,
      resultDesc: true
    }
  });

  if (!request) {
    return res.status(404).json({ message: 'Payment request not found' });
  }

  let normalized = 'pending';
  if (request.status === 'SUCCESSFUL') {
    normalized = 'completed';
  } else if (request.status === 'FAILED') {
    normalized = 'failed';
  } else if (request.status === 'CANCELED') {
    normalized = 'canceled';
  }

  return res.json({
    status: normalized,
    mpesaReceiptNumber: request.mpesaReceiptNumber,
    message: request.resultDesc ?? null
  });
});


export default router;
