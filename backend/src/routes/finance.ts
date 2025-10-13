import { Router } from 'express';
import axios from 'axios';
import { PrismaClient, Prisma, PaymentStatus, PaymentCategory, TransactionType, LoanStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
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

router.get('/payments', async (_req, res) => {
  const payments = await prisma.payment.findMany();
  res.json(payments);
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

      const baseMetadata: Record<string, unknown> = typeof existing.metadata === 'object' && existing.metadata !== null
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};
      baseMetadata.callback = body;
      baseMetadata.phoneNumber = extractCallbackItem(items, 'PhoneNumber') ?? existing.phone;

      if (ResultCode !== MPESA_SUCCESS_CODE) {
        const statusLabel = ResultCode === MPESA_CANCELLED_CODE ? 'CANCELED' : 'FAILED';
        await tx.mpesaStkRequest.update({
          where: { id: existing.id },
          data: {
            status: statusLabel,
            resultCode: ResultCode,
            resultDesc: ResultDesc ?? null,
            mpesaReceiptNumber: extractCallbackItem(items, 'MpesaReceiptNumber')?.toString() ?? null,
            metadata: baseMetadata as Prisma.InputJsonValue
          }
        });
        return;
      }

      const amountValueRaw = extractCallbackItem(items, 'Amount');
      const receipt = extractCallbackItem(items, 'MpesaReceiptNumber');
      const amountDecimal = decimal(
        amountValueRaw !== null && amountValueRaw !== undefined ? Number(amountValueRaw) : existing.amount
      );

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

      const userId = existing.userId;
      let loanPayment = decimal(0);
      let savingsAmount = decimal(0);
      let savingsAccount = null;
      let userRecord = null;
      let activeLoan = null;

      if (userId) {
        userRecord = await tx.user.findUnique({ where: { id: userId } });
        if (userRecord) {
          savingsAccount = await tx.savingsAccount.findFirst({
            where: {
              userId,
              ...(existing.vehicleId ? { vehicleId: existing.vehicleId } : {})
            }
          });

          if (!savingsAccount) {
            savingsAccount = await tx.savingsAccount.create({
              data: {
                userId,
                vehicleId: existing.vehicleId,
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
      if (remainder.greaterThan(0) && currentLoanBalance.greaterThan(0)) {
        loanPayment = remainder.greaterThan(currentLoanBalance) ? currentLoanBalance : remainder;
        remainder = remainder.minus(loanPayment);
      }

      savingsAmount = remainder.greaterThan(0) ? remainder : decimal(0);

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
          userId: existing.userId,
          vehicleId: existing.vehicleId,
          totalAmount: amountDecimal,
          mpesaReference: receipt ? String(receipt) : existing.mpesaReceiptNumber,
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
              userId: existing.userId ?? undefined,
              vehicleId: existing.vehicleId ?? undefined,
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
              userId: existing.userId ?? undefined,
              vehicleId: existing.vehicleId ?? undefined,
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
              userId: existing.userId ?? undefined,
              vehicleId: existing.vehicleId ?? undefined,
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
              userId: existing.userId ?? undefined,
              vehicleId: existing.vehicleId ?? undefined,
              paymentId: payment.id,
              type: TransactionType.DEPOSIT,
              amount: savingsAmount,
              description: 'Savings top up from remittance'
            }
          });
        }
      }

      baseMetadata.paymentId = payment.id;
      baseMetadata.receiptNumber = receipt ?? existing.mpesaReceiptNumber;
      baseMetadata.merchantRequestId = MerchantRequestID;

      await tx.mpesaStkRequest.update({
        where: { id: existing.id },
        data: {
          status: 'SUCCESSFUL',
          resultCode: ResultCode,
          resultDesc: ResultDesc ?? null,
          mpesaReceiptNumber: receipt ? String(receipt) : existing.mpesaReceiptNumber,
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
