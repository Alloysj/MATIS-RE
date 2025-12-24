import {
  Prisma,
  PrismaClient,
  UserStatus,
  UserType,
  VehicleStatus,
  InsuranceStatus,
  RegistrationStatus,
  PaymentStatus,
  PaymentCategory,
  TransactionType,
  LoanStatus,
  LoanType
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'ADMIN:CRUD_ALL',
  'ADMIN:RBAC',
  'MEMBERS:READ',
  'MEMBERS:READ_SELF',
  'MEMBERS:CREATE',
  'MEMBERS:UPDATE',
  'MEMBERS:UPDATE_SELF',
  'MEMBERS:APPROVE',
  'MEMBERS:DELETE',
  'MEMBERS:RESET_PASSWORD',
  'VEHICLES:READ',
  'VEHICLES:READ_SELF',
  'VEHICLES:WRITE',
  'VEHICLES:WRITE_SELF',
  'VEHICLES:APPROVE',
  'VEHICLES:ASSIGN_DRIVER',
  'VEHICLES:ROUTES_WRITE',
  'FINANCE:VIEW',
  'FINANCE:VIEW_SELF',
  'FINANCE:COLLECT',
  'FINANCE:APPROVE',
  'LOANS:APPLY',
  'LOANS:VIEW',
  'LOANS:APPROVE',
  'LOANS:DISBURSE',
  'INSURANCE:VIEW',
  'INSURANCE:WRITE',
  'STAFF:READ',
  'STAFF:WRITE',
  'PAYROLL:READ',
  'PAYROLL:WRITE',
  'PAYROLL:APPROVE',
  'EXPENSES:READ',
  'EXPENSES:WRITE',
  'SUPPORT:TICKET_CREATE'
] as const;

const ROLES: Record<string, string[]> = {
  ADMIN: [...PERMISSIONS],
  FLEET_STAFF: [
    'VEHICLES:READ',
    'VEHICLES:WRITE',
    'VEHICLES:APPROVE',
    'VEHICLES:ASSIGN_DRIVER',
    'VEHICLES:ROUTES_WRITE',
    'INSURANCE:VIEW',
    'INSURANCE:WRITE'
  ],
  FINANCE_STAFF: [
    'FINANCE:VIEW',
    'FINANCE:COLLECT',
    'EXPENSES:READ',
    'EXPENSES:WRITE',
    'INSURANCE:VIEW',
    'PAYROLL:READ'
  ],
  LOANS_STAFF: [
    'LOANS:APPLY',
    'LOANS:VIEW',
    'LOANS:APPROVE',
    'FINANCE:VIEW'
  ],
  SUPPORT: [
    'MEMBERS:READ',
    'SUPPORT:TICKET_CREATE'
  ],
  VEHICLE_OWNER: [
    'VEHICLES:READ_SELF',
    'VEHICLES:WRITE_SELF',
    'FINANCE:VIEW_SELF',
    'FINANCE:COLLECT',
    'LOANS:APPLY',
    'LOANS:VIEW',
    'MEMBERS:READ_SELF',
    'MEMBERS:UPDATE_SELF',
    'SUPPORT:TICKET_CREATE'
  ]
};

const STAFF_PROFILES: Array<{
  name: string;
  roleNames: string[];
}> = [
  { name: 'Chairperson', roleNames: ['ADMIN'] },
  { name: 'Secretary', roleNames: ['SUPPORT'] },
  { name: 'Treasurer', roleNames: ['FINANCE_STAFF'] },
  { name: 'Chief Whip', roleNames: ['FLEET_STAFF'] }
];

const USERS: Array<{
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  primaryRole: string;
}> = [
  { email: 'admin@matis.local', firstName: 'James', lastName: 'Mwangi', userType: 'ADMIN', primaryRole: 'ADMIN' },
  { email: 'chairperson@matis.local', firstName: 'Daniel', lastName: 'Kariuki', userType: 'STAFF', primaryRole: 'ADMIN' },
  { email: 'secretary@matis.local', firstName: 'Brian', lastName: 'Odhiambo', userType: 'STAFF', primaryRole: 'SUPPORT' },
  { email: 'treasurer@matis.local', firstName: 'Kevin', lastName: 'Wanjiru', userType: 'STAFF', primaryRole: 'FINANCE_STAFF' },
  { email: 'chiefwhip@matis.local', firstName: 'Peter', lastName: 'Kiptoo', userType: 'STAFF', primaryRole: 'FLEET_STAFF' },
  { email: 'grace.njeri@matis.local', firstName: 'Grace', lastName: 'Njeri', userType: 'USER', primaryRole: 'VEHICLE_OWNER' },
  { email: 'michael.otieno@matis.local', firstName: 'Michael', lastName: 'Otieno', userType: 'USER', primaryRole: 'VEHICLE_OWNER' },
  { email: 'emily.chebet@matis.local', firstName: 'Emily', lastName: 'Chebet', userType: 'USER', primaryRole: 'VEHICLE_OWNER' },
  { email: 'john.kamau@matis.local', firstName: 'John', lastName: 'Kamau', userType: 'USER', primaryRole: 'VEHICLE_OWNER' },
  { email: 'sarah.achieng@matis.local', firstName: 'Sarah', lastName: 'Achieng', userType: 'USER', primaryRole: 'VEHICLE_OWNER' }
];

const DAILY_REMITTANCE_CENTS = 25000;
const DAILY_INSURANCE_CENTS = 25000;
const PAYMENT_MIN_CENTS = 100000;
const PAYMENT_MAX_CENTS = 200000;
const MONTHS_TO_SEED = 5;
const DAYS_PER_MONTH = 26;
const SEED_PREFIX = 'SEED';

const decimalFromCents = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));

const hashString = (input: string) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let result = t;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const randomInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildMonthDays = (year: number, monthIndex: number) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const selected: number[] = [];
  const skipped: number[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const index = day - 1;
    if ((index + 1) % 7 === 0) {
      skipped.push(day);
    } else {
      selected.push(day);
    }
  }

  while (selected.length < DAYS_PER_MONTH && skipped.length > 0) {
    selected.push(skipped.shift() as number);
  }

  return selected.slice(0, DAYS_PER_MONTH).map((day) => new Date(year, monthIndex, day, 12, 0, 0));
};

const generatePlateNumber = (seed: string, existing: Set<string>) => {
  const alphabet = 'ABCDEFGHJKL';
  const hash = hashString(seed);
  const letter1 = alphabet[hash % alphabet.length];
  const letter2 = alphabet[(hash >> 3) % alphabet.length];
  const letter3 = alphabet[(hash >> 6) % alphabet.length];
  const digits = String(1000 + (hash % 9000));
  let plate = `K${letter1}${letter2}${digits}${letter3}`;
  let suffix = 0;
  while (existing.has(plate)) {
    suffix += 1;
    plate = `K${letter1}${letter2}${digits}${alphabet[(hash + suffix) % alphabet.length]}`;
  }
  existing.add(plate);
  return plate;
};

async function main() {
  const permissionRecords = new Map<string, { id: string }>();

  for (const name of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, category: name.split(':')[0] }
    });
    permissionRecords.set(name, permission);
  }

  for (const [roleName, permissions] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });

    for (const permissionName of permissions) {
      const permission = permissionRecords.get(permissionName);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
  }

  const roleRecords = await prisma.role.findMany({
    where: { name: { in: Object.keys(ROLES) } }
  });
  const roleIdByName = new Map(roleRecords.map(role => [role.name, role.id]));

  for (const profile of STAFF_PROFILES) {
    const created = await prisma.staffProfile.upsert({
      where: { name: profile.name },
      update: { description: null, isActive: true },
      create: { name: profile.name, description: null, isActive: true }
    });

    for (const roleName of profile.roleNames) {
      const roleId = roleIdByName.get(roleName);
      if (!roleId) {
        throw new Error(`Missing role for staff profile ${profile.name}: ${roleName}`);
      }
      await prisma.staffProfileRole.upsert({
        where: { staffProfileId_roleId: { staffProfileId: created.id, roleId } },
        update: {},
        create: { staffProfileId: created.id, roleId }
      });
    }
  }

  const passwordHash = await bcrypt.hash('Users@123', 10);

  for (const userSeed of USERS) {
    const roleId = roleIdByName.get(userSeed.primaryRole);
    if (!roleId) {
      throw new Error(`Missing role for user ${userSeed.email}: ${userSeed.primaryRole}`);
    }

    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        firstName: userSeed.firstName,
        lastName: userSeed.lastName,
        passwordHash,
        userType: userSeed.userType,
        roleId
      },
      create: {
        email: userSeed.email,
        firstName: userSeed.firstName,
        lastName: userSeed.lastName,
        passwordHash,
        userType: userSeed.userType,
        roleId
      }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId }
    });
  }

  const vehicleOwners = await prisma.user.findMany({
    where: {
      userType: UserType.USER,
      OR: [
        { role: { name: 'VEHICLE_OWNER' } },
        { roles: { some: { role: { name: 'VEHICLE_OWNER' } } } }
      ]
    },
    select: { id: true, email: true }
  });

  if (vehicleOwners.length === 0) {
    return;
  }

  const ownerIds = vehicleOwners.map((owner) => owner.id);
  const existingVehicles = await prisma.vehicle.findMany({
    where: { ownerId: { in: ownerIds } },
    orderBy: { dateAdded: 'asc' }
  });
  const vehiclesByOwner = new Map<string, typeof existingVehicles[number]>();
  existingVehicles.forEach((vehicle) => {
    if (!vehiclesByOwner.has(vehicle.ownerId)) {
      vehiclesByOwner.set(vehicle.ownerId, vehicle);
    }
  });

  const existingAccounts = await prisma.savingsAccount.findMany({
    where: { userId: { in: ownerIds } }
  });
  const accountByOwner = new Map<string, typeof existingAccounts[number]>();
  existingAccounts.forEach((account) => {
    if (!accountByOwner.has(account.userId)) {
      accountByOwner.set(account.userId, account);
    }
  });

  const existingLoans = await prisma.loan.findMany({
    where: {
      applicantId: { in: ownerIds },
      purpose: { contains: SEED_PREFIX }
    },
    orderBy: { applicationDate: 'desc' }
  });
  const loanByOwner = new Map<string, typeof existingLoans[number]>();
  existingLoans.forEach((loan) => {
    if (!loanByOwner.has(loan.applicantId)) {
      loanByOwner.set(loan.applicantId, loan);
    }
  });

  const existingPayments = await prisma.payment.findMany({
    where: {
      userId: { in: ownerIds },
      mpesaReference: { startsWith: `${SEED_PREFIX}:` }
    },
    select: { userId: true, mpesaReference: true }
  });
  const paymentRefsByOwner = new Map<string, Set<string>>();
  existingPayments.forEach((payment) => {
    if (!payment.userId || !payment.mpesaReference) return;
    const set = paymentRefsByOwner.get(payment.userId) ?? new Set<string>();
    set.add(payment.mpesaReference);
    paymentRefsByOwner.set(payment.userId, set);
  });

  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId: { in: ownerIds },
      description: { startsWith: `${SEED_PREFIX}:` }
    },
    select: { userId: true, description: true }
  });
  const transactionKeysByOwner = new Map<string, Set<string>>();
  existingTransactions.forEach((transaction) => {
    if (!transaction.userId || !transaction.description) return;
    const set = transactionKeysByOwner.get(transaction.userId) ?? new Set<string>();
    set.add(transaction.description);
    transactionKeysByOwner.set(transaction.userId, set);
  });

  const existingPlates = new Set(existingVehicles.map((vehicle) => vehicle.plateNumber));
  const now = new Date();
  const months: Array<{ year: number; monthIndex: number; days: Date[]; key: string }> = [];
  for (let offset = MONTHS_TO_SEED - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    months.push({
      year,
      monthIndex,
      days: buildMonthDays(year, monthIndex),
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`
    });
  }

  for (const owner of vehicleOwners) {
    const rng = createRng(hashString(owner.id));

    let vehicle = vehiclesByOwner.get(owner.id);
    if (!vehicle) {
      const plateNumber = generatePlateNumber(owner.email, existingPlates);
      vehicle = await prisma.vehicle.create({
        data: {
          ownerId: owner.id,
          plateNumber,
          model: 'Nissan NV350',
          vehicleType: 'Matatu',
          capacity: 14,
          yearOfManufacture: 2017,
          status: VehicleStatus.ACTIVE,
          registrationStatus: RegistrationStatus.VALID,
          insuranceStatus: InsuranceStatus.ACTIVE
        }
      });
      vehiclesByOwner.set(owner.id, vehicle);
    } else {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: VehicleStatus.ACTIVE,
          registrationStatus: RegistrationStatus.VALID,
          insuranceStatus: InsuranceStatus.ACTIVE
        }
      });
    }

    let account = accountByOwner.get(owner.id);
    if (!account) {
      account = await prisma.savingsAccount.create({
        data: {
          userId: owner.id,
          vehicleId: vehicle.id,
          accountType: 'VEHICLE',
          balance: decimalFromCents(0),
          createdAt: months[0]?.days[0] ?? new Date()
        }
      });
      accountByOwner.set(owner.id, account);
    } else if (!account.vehicleId) {
      account = await prisma.savingsAccount.update({
        where: { id: account.id },
        data: { vehicleId: vehicle.id }
      });
      accountByOwner.set(owner.id, account);
    }

    let loan = loanByOwner.get(owner.id);
    const shouldHaveLoan = hashString(owner.id) % 2 === 0;
    if (!loan && shouldHaveLoan) {
      const loanAmountCents = randomInt(rng, 2000000, 6000000);
      loan = await prisma.loan.create({
        data: {
          applicantId: owner.id,
          vehicleId: vehicle.id,
          type: LoanType.NORMAL,
          amount: decimalFromCents(loanAmountCents),
          purpose: `${SEED_PREFIX}:Loan`,
          status: LoanStatus.DISBURSED,
          applicationDate: months[0]?.days[0] ?? new Date(),
          approvedAt: months[0]?.days[0] ?? new Date(),
          existingLoans: decimalFromCents(loanAmountCents)
        }
      });
      loanByOwner.set(owner.id, loan);
    }

    const loanAmountCents = loan ? Math.round(Number(loan.amount) * 100) : 0;
    let remainingLoanCents = loan ? Math.round(loanAmountCents) : 0;
    let savingsBalanceCents = 0;
    let lastDepositDate: Date | null = null;

    const allocationsToCreate: Prisma.PaymentAllocationCreateManyInput[] = [];
    const transactionsToCreate: Prisma.TransactionCreateManyInput[] = [];
    const existingRefs = paymentRefsByOwner.get(owner.id) ?? new Set<string>();
    const existingTxKeys = transactionKeysByOwner.get(owner.id) ?? new Set<string>();

    for (const month of months) {
      let insuranceMonthCents = 0;
      const lastSeededDay = month.days[month.days.length - 1];

      for (const day of month.days) {
        const dateKey = formatDateKey(day);
        const reference = `${SEED_PREFIX}:${owner.id}:${dateKey}`;
        const paymentCents = randomInt(rng, PAYMENT_MIN_CENTS, PAYMENT_MAX_CENTS);
        let remainder = paymentCents;
        const operationsCents = Math.min(DAILY_REMITTANCE_CENTS, remainder);
        remainder -= operationsCents;
        const insuranceCents = Math.min(DAILY_INSURANCE_CENTS, remainder);
        remainder -= insuranceCents;

        let loanPaymentCents = 0;
        if (remainingLoanCents > 0 && remainder > 0) {
          loanPaymentCents = Math.min(remainder, remainingLoanCents);
          remainder -= loanPaymentCents;
          remainingLoanCents -= loanPaymentCents;
        }

        const savingsCents = remainder;
        insuranceMonthCents += insuranceCents;
        savingsBalanceCents += savingsCents;
        if (savingsCents > 0) {
          lastDepositDate = day;
        }

        if (!existingRefs.has(reference)) {
          const payment = await prisma.payment.create({
            data: {
              userId: owner.id,
              vehicleId: vehicle.id,
              paymentDate: day,
              totalAmount: decimalFromCents(paymentCents),
              mpesaReference: reference,
              status: PaymentStatus.COMPLETED
            }
          });

          const allocationEntries: Array<{ category: PaymentCategory; amountCents: number }> = [
            { category: PaymentCategory.OPERATIONS, amountCents: operationsCents },
            { category: PaymentCategory.INSURANCE, amountCents: insuranceCents },
            { category: PaymentCategory.LOAN_REPAYMENT, amountCents: loanPaymentCents },
            { category: PaymentCategory.SAVINGS, amountCents: savingsCents }
          ].filter((entry) => entry.amountCents > 0);

          allocationEntries.forEach((entry) => {
            allocationsToCreate.push({
              paymentId: payment.id,
              category: entry.category,
              amount: decimalFromCents(entry.amountCents)
            });
          });

          allocationEntries.forEach((entry) => {
            let type = TransactionType.DEPOSIT;
            if (entry.category === PaymentCategory.OPERATIONS) {
              type = TransactionType.OPERATIONS_FEE;
            } else if (entry.category === PaymentCategory.INSURANCE) {
              type = TransactionType.INSURANCE_PAYMENT;
            } else if (entry.category === PaymentCategory.LOAN_REPAYMENT) {
              type = TransactionType.LOAN_REPAYMENT;
            }

            const description = `${SEED_PREFIX}:${owner.id}:${dateKey}:${type}`;
            if (existingTxKeys.has(description)) {
              return;
            }
            existingTxKeys.add(description);

            let balanceAfter: Prisma.Decimal | null = null;
            if (type === TransactionType.DEPOSIT) {
              balanceAfter = decimalFromCents(savingsBalanceCents);
            }

            transactionsToCreate.push({
              accountId: account.id,
              userId: owner.id,
              vehicleId: vehicle.id,
              paymentId: payment.id,
              date: day,
              type,
              amount: decimalFromCents(entry.amountCents),
              balanceAfter,
              description
            });
          });
        }
      }

      if (insuranceMonthCents > 0 && lastSeededDay) {
        const insuranceResetKey = `${SEED_PREFIX}:${owner.id}:${month.key}:INSURANCE_RESET`;
        if (!existingTxKeys.has(insuranceResetKey)) {
          existingTxKeys.add(insuranceResetKey);
          transactionsToCreate.push({
            accountId: account.id,
            userId: owner.id,
            vehicleId: vehicle.id,
            date: lastSeededDay,
            type: TransactionType.INSURANCE_PAYMENT,
            amount: decimalFromCents(-insuranceMonthCents),
            balanceAfter: null,
            description: insuranceResetKey
          });
        }
      }
    }

    if (allocationsToCreate.length > 0) {
      await prisma.paymentAllocation.createMany({ data: allocationsToCreate, skipDuplicates: true });
    }
    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({ data: transactionsToCreate, skipDuplicates: true });
    }

    await prisma.user.update({
      where: { id: owner.id },
      data: {
        status: UserStatus.ACTIVE,
        hasCompletedCapitalPayment: true,
        savingsBalance: decimalFromCents(savingsBalanceCents),
        loanBalance: decimalFromCents(Math.max(remainingLoanCents, 0))
      }
    });

    await prisma.savingsAccount.update({
      where: { id: account.id },
      data: {
        balance: decimalFromCents(savingsBalanceCents),
        lastDeposit: lastDepositDate ?? account.lastDeposit
      }
    });

    if (loan) {
      await prisma.loan.update({
        where: { id: loan.id },
        data: {
          existingLoans: decimalFromCents(Math.max(remainingLoanCents, 0)),
          status: remainingLoanCents <= 0 ? LoanStatus.REPAID : loan.status
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
