import { Router } from 'express';
import {
  Prisma,
  UserStatus,
  VehicleStatus,
  RegistrationStatus,
  LoanStatus,
  LoanType,
  InsuranceStatus,
  PaymentStatus,
  PaymentCategory,
  ExpenseStatus,
  TransactionType
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../prismaClient';
const router = Router();

const LOAN_STATUS_VALUES = Object.values(LoanStatus) as LoanStatus[];
const DEFAULT_DISBURSED_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.APPROVED,
  LoanStatus.DISBURSED,
  LoanStatus.REPAID,
  LoanStatus.DEFAULTED
];
const LOAN_TYPE_VALUES = Object.values(LoanType) as LoanType[];
const EXPENSE_STATUS_VALUES = Object.values(ExpenseStatus) as ExpenseStatus[];
const PAYMENT_CATEGORY_LABELS: Record<PaymentCategory, string> = {
  [PaymentCategory.SAVINGS]: 'Savings',
  [PaymentCategory.LOAN_REPAYMENT]: 'Loan Repayment',
  [PaymentCategory.INSURANCE]: 'Insurance',
  [PaymentCategory.OPERATIONS]: 'Operations'
};
const PAYMENT_CATEGORY_ORDER: PaymentCategory[] = [
  PaymentCategory.OPERATIONS,
  PaymentCategory.INSURANCE,
  PaymentCategory.LOAN_REPAYMENT,
  PaymentCategory.SAVINGS
];
const MS_IN_DAY = 24 * 60 * 60 * 1000;

const userSummaryInclude = {
  role: {
    select: {
      id: true,
      name: true,
      description: true,
      rolePermissions: {
        select: {
          permission: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      }
    }
  },
  vehicles: {
    select: {
      id: true,
      plateNumber: true,
      status: true,
      model: true,
      vehicleType: true,
      yearOfManufacture: true,
      route: {
        select: {
          id: true,
          name: true,
          startPoint: true,
          endPoint: true
        }
      }
    }
  },
  driverAssignments: {
    select: {
      id: true,
      plateNumber: true,
      status: true,
      model: true,
      vehicleType: true,
      yearOfManufacture: true
    }
  },
  vehicleDriverAssignments: {
    where: { releasedAt: null },
    select: {
      id: true,
      assignedAt: true,
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          status: true,
          model: true,
          vehicleType: true,
          yearOfManufacture: true
        }
      }
    }
  }
} satisfies Prisma.UserInclude;

const userDetailInclude = {
  ...userSummaryInclude,
  savingsAccounts: {
    select: {
      id: true,
      balance: true,
      accountType: true,
      vehicleId: true,
      createdAt: true
    }
  },
  loansApplied: {
    select: {
      id: true,
      amount: true,
      status: true,
      applicationDate: true,
      type: true
    }
  },
  capitalPayments: {
    select: {
      id: true,
      amount: true,
      paymentDate: true,
      status: true
    }
  },
  salaryAdvances: {
    select: {
      id: true,
      amount: true,
      status: true,
      applicationDate: true
    }
  }
} satisfies Prisma.UserInclude;

type UserWithSummaryRelations = Prisma.UserGetPayload<{
  include: typeof userSummaryInclude;
}>;

type UserWithDetailRelations = Prisma.UserGetPayload<{
  include: typeof userDetailInclude;
}>;

const vehicleSummaryInclude = {
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true
    }
  },
  driver: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true
    }
  },
  route: {
    select: {
      id: true,
      name: true,
      startPoint: true,
      endPoint: true
    }
  },
  savingsAccounts: {
    select: {
      id: true,
      balance: true,
      accountType: true
    }
  },
  loans: {
    select: {
      id: true,
      amount: true,
      status: true,
      type: true
    }
  },
  payments: {
    orderBy: { paymentDate: 'desc' },
    take: 1,
    select: {
      id: true,
      paymentDate: true,
      totalAmount: true
    }
  }
} satisfies Prisma.VehicleInclude;

const loanSummaryInclude = {
  applicant: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true
    }
  },
  vehicle: {
    select: {
      id: true,
      plateNumber: true
    }
  },
  guarantors: {
    include: {
      guarantor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      }
    }
  },
  approvedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  }
} satisfies Prisma.LoanInclude;

const insuranceSummaryInclude = {
  vehicle: {
    select: {
      id: true,
      plateNumber: true,
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      }
    }
  }
} satisfies Prisma.InsurancePolicyInclude;

const savingsAccountSummaryInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true
    }
  },
  vehicle: {
    select: {
      id: true,
      plateNumber: true
    }
  }
} satisfies Prisma.SavingsAccountInclude;

type VehicleWithSummaryRelations = Prisma.VehicleGetPayload<{
  include: typeof vehicleSummaryInclude;
}>;

type LoanWithSummaryRelations = Prisma.LoanGetPayload<{
  include: typeof loanSummaryInclude;
}>;

type InsuranceWithSummaryRelations = Prisma.InsurancePolicyGetPayload<{
  include: typeof insuranceSummaryInclude;
}>;

type SavingsAccountWithSummaryRelations = Prisma.SavingsAccountGetPayload<{
  include: typeof savingsAccountSummaryInclude;
}>;

const decimalToNumber = (value: Prisma.Decimal | null | undefined): number | null => {
  if (value == null) return null;
  return Number(value);
};

const toStringOrNull = (value: unknown): string | null => {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const startOfDay = (date: Date): Date => {
  const instance = new Date(date);
  instance.setHours(0, 0, 0, 0);
  return instance;
};

const endOfDay = (date: Date): Date => {
  const instance = new Date(date);
  instance.setHours(23, 59, 59, 999);
  return instance;
};

const parseMonthRange = (value: unknown): { start: Date; end: Date } | null => {
  const str = toStringOrNull(value);
  if (!str) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(str.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

const parseDateFromUnknown = (value: unknown): Date | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const resolveDateRange = (
  inputs: { start?: unknown; end?: unknown; month?: unknown }
): { start: Date; end: Date } => {
  const endDateInput = parseDateFromUnknown(inputs.end);
  const monthRange = parseMonthRange(inputs.month);
  let end = endDateInput ?? monthRange?.end ?? new Date();
  let start =
    parseDateFromUnknown(inputs.start) ??
    monthRange?.start ??
    new Date(end.getTime() - 30 * MS_IN_DAY);

  start = startOfDay(start);
  end = endOfDay(end);

  if (start.getTime() > end.getTime()) {
    const previousStart = start;
    start = startOfDay(end);
    end = endOfDay(previousStart);
  }

  return { start, end };
};

const parseEnumList = <T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): T[] | undefined => {
  const str = toStringOrNull(value);
  if (!str) return undefined;
  const normalized = str
    .split(',')
    .map(token => token.trim())
    .filter(Boolean);
  if (!normalized.length) return undefined;

  const byValue = new Map<string, T>();
  allowedValues.forEach(v => {
    byValue.set(v, v);
    byValue.set(v.toUpperCase(), v);
  });

  const result: T[] = [];
  normalized.forEach(raw => {
    const key = raw.toUpperCase();
    const match = byValue.get(raw as T) ?? byValue.get(key);
    if (match && !result.includes(match)) {
      result.push(match);
    }
  });

  return result.length ? result : undefined;
};

const normalizeUserStatus = (value: unknown): UserStatus | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(UserStatus) as string[]).includes(normalized)
    ? (normalized as UserStatus)
    : null;
};

const normalizeVehicleStatus = (value: unknown): VehicleStatus | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(VehicleStatus) as string[]).includes(normalized)
    ? (normalized as VehicleStatus)
    : null;
};

const normalizeRegistrationStatus = (value: unknown): RegistrationStatus | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(RegistrationStatus) as string[]).includes(normalized)
    ? (normalized as RegistrationStatus)
    : null;
};

const normalizeInsuranceStatus = (value: unknown): InsuranceStatus | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(InsuranceStatus) as string[]).includes(normalized)
    ? (normalized as InsuranceStatus)
    : null;
};

const normalizeLoanStatus = (value: unknown): LoanStatus | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(LoanStatus) as string[]).includes(normalized) ? (normalized as LoanStatus) : null;
};

const normalizeLoanType = (value: unknown): LoanType | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(LoanType) as string[]).includes(normalized) ? (normalized as LoanType) : null;
};

const formatEnumLabel = (value: string | null | undefined): string | null => {
  if (!value) return null;
  return value
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

const formatUserStatus = (status: UserStatus): string => {
  return formatEnumLabel(status) ?? status;
};

const buildPersonName = (firstName?: string | null, lastName?: string | null): string | null => {
  const parts = [firstName, lastName]
    .map(part => (part ?? '').trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  return parts.join(' ');
};

const summarizePerson = <T extends { id: string; firstName: string | null; lastName: string | null; email?: string | null; phone?: string | null }>(
  person: T | null | undefined
) => {
  if (!person) {
    return null;
  }
  return {
    id: person.id,
    firstName: person.firstName ?? null,
    lastName: person.lastName ?? null,
    name: buildPersonName(person.firstName, person.lastName),
    email: person.email ?? null,
    phone: person.phone ?? null
  };
};

const extractAggregateCount = (
  value: number | { _all?: number } | true | null | undefined
): number => {
  if (value == null) return 0;
  if (value === true) return 0;
  if (typeof value === 'number') return value;
  if (typeof value._all === 'number') return value._all;
  return 0;
};

const mapAllocationGroups = (
  groups: Array<{
    category: PaymentCategory;
    _sum?: { amount?: Prisma.Decimal | null } | null;
    _count?: number | { _all?: number } | true | null;
  }>
) => {
  const result = new Map<PaymentCategory, { amount: number; count: number }>();
  groups.forEach(group => {
    const amount = decimalToNumber(group._sum?.amount) ?? 0;
    const count = extractAggregateCount(group._count);
    result.set(group.category, { amount, count });
  });
  return result;
};

const splitFullName = (fullName: string) => {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  const [firstName, ...rest] = normalized.split(' ');
  return {
    firstName,
    lastName: rest.length ? rest.join(' ') : firstName
  };
};

const generateTemporaryPassword = (length = 10): string => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
};

const toDecimalValue = (value: unknown): Prisma.Decimal | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return new Prisma.Decimal(numeric);
};

const toDecimalUpdateValue = (value: unknown): Prisma.Decimal | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return new Prisma.Decimal(numeric);
};

const toNullableStringUpdate = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  return toStringOrNull(value);
};

const toIntValue = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toIntUpdateValue = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const resolvePagination = (
  params: Record<string, unknown>,
  defaultSize = 50,
  maxSize = 500
): { page: number; pageSize: number; skip: number } => {
  const rawPage = toIntValue(params.page);
  const limitSource = params.pageSize ?? params.limit;
  const rawSize = toIntValue(limitSource);
  const pageSize = clampNumber(rawSize ?? defaultSize, 1, maxSize);
  const page = clampNumber(rawPage ?? 1, 1, 1_000_000);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
};

const parseDateValue = (value: unknown): Date | undefined => {
  const str = toStringOrNull(value);
  if (!str) return undefined;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const parseDateUpdateValue = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const date = parseDateValue(value);
  return date ?? undefined;
};

const requireMembersRead = requirePermission('MEMBERS:READ');
const requireMembersCreate = requirePermission('MEMBERS:CREATE');
const requireMembersUpdate = requirePermission('MEMBERS:UPDATE');
const requireMembersApprove = requirePermission('MEMBERS:APPROVE');
const requireVehiclesRead = requirePermission('VEHICLES:READ');
const requireVehiclesWrite = requirePermission('VEHICLES:WRITE');
const requireVehiclesAssign = requirePermission('VEHICLES:ASSIGN_DRIVER');
const requireInsuranceWrite = requirePermission('INSURANCE:WRITE');
const requireInsuranceRead = requirePermission('INSURANCE:VIEW');
const requireLoansView = requirePermission('LOANS:VIEW');
const requireLoansApprove = requirePermission('LOANS:APPROVE');
const requireFinanceView = requirePermission('FINANCE:VIEW');

const buildUserName = (user: { firstName: string; lastName: string }): string => {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
};

const pickActiveAssignment = (user: UserWithSummaryRelations) => {
  const assignment = user.vehicleDriverAssignments[0];
  if (assignment?.vehicle) {
    const vehicle = assignment.vehicle;
    return {
      assignmentId: assignment.id,
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      model: vehicle.model ?? null,
      vehicleType: vehicle.vehicleType ?? null,
      statusCode: vehicle.status,
      status: formatEnumLabel(vehicle.status),
      assignedAt: assignment.assignedAt ?? null
    };
  }

  const directVehicle = user.driverAssignments[0];
  if (directVehicle) {
    return {
      assignmentId: null,
      vehicleId: directVehicle.id,
      plateNumber: directVehicle.plateNumber,
      model: directVehicle.model ?? null,
      vehicleType: directVehicle.vehicleType ?? null,
      statusCode: directVehicle.status,
      status: formatEnumLabel(directVehicle.status),
      assignedAt: null
    };
  }

  return null;
};
const mapUserToSummary = (user: UserWithSummaryRelations) => {
  const statusCode = user.status;
  const rolePermissions = user.role?.rolePermissions ?? [];
  const vehicles = user.vehicles.map(vehicle => ({
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    model: vehicle.model ?? null,
    vehicleType: vehicle.vehicleType ?? null,
    year: vehicle.yearOfManufacture ?? null,
    statusCode: vehicle.status,
    status: formatEnumLabel(vehicle.status),
    routeId: vehicle.route?.id ?? null,
    routeName: vehicle.route?.name ?? null,
    route: vehicle.route
      ? {
          id: vehicle.route.id,
          name: vehicle.route.name,
          startPoint: vehicle.route.startPoint,
          endPoint: vehicle.route.endPoint
        }
      : null
  }));
  const shareCapital = decimalToNumber(user.shareCapital);
  const savingsBalance = decimalToNumber(user.savingsBalance);
  const loanBalance = decimalToNumber(user.loanBalance);
  const totalDeposits = decimalToNumber(user.totalDeposits);

  return {
    id: user.id,
    memberNumber: user.memberNumber != null ? String(user.memberNumber) : null,
    firstName: user.firstName,
    lastName: user.lastName,
    name: buildUserName(user),
    email: user.email,
    phone: user.phone ?? null,
    idNumber: user.idNumber ?? null,
    statusCode,
    status: formatUserStatus(statusCode),
    registrationDate: user.registrationDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ?? null,
    lastLogin: user.lastLogin ?? null,
    membershipType: user.membershipType ?? null,
    profileCategory: user.profileCategory ?? null,
    shareCapital,
    savingsBalance,
    loanBalance,
    totalDeposits,
    metrics: {
      shareCapital,
      savingsBalance,
      loanBalance,
      totalDeposits
    },
    vehicles,
    vehiclesOwned: {
      count: vehicles.length,
      items: vehicles
    },
    activeDriverAssignment: pickActiveAssignment(user),
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description ?? null
        }
      : null,
    roleId: user.role?.id ?? null,
    permissions: rolePermissions.map(rp => rp.permission.name),
    profileCategoryLabel: formatEnumLabel(user.profileCategory ?? null),
    membershipTypeLabel: formatEnumLabel(user.membershipType ?? null)
  };
};
const mapUserToDetails = (user: UserWithDetailRelations) => {
  const summary = mapUserToSummary(user);
  return {
    ...summary,
    address: user.address ?? null,
    county: user.county ?? null,
    town: user.town ?? null,
    occupation: user.occupation ?? null,
    nextOfKin: user.nextOfKin ?? null,
    nextOfKinPhone: user.nextOfKinPhone ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    savingsAccounts: user.savingsAccounts.map(account => ({
      id: account.id,
      balance: decimalToNumber(account.balance),
      accountType: account.accountType ?? null,
      vehicleId: account.vehicleId,
      createdAt: account.createdAt
    })),
    loans: user.loansApplied.map(loan => ({
      id: loan.id,
      amount: decimalToNumber(loan.amount),
      statusCode: loan.status,
      status: formatEnumLabel(loan.status),
      typeCode: loan.type,
      type: formatEnumLabel(loan.type),
      applicationDate: loan.applicationDate
    })),
    capitalPayments: user.capitalPayments.map(payment => ({
      id: payment.id,
      amount: decimalToNumber(payment.amount),
      statusCode: payment.status,
      status: formatEnumLabel(payment.status),
      paymentDate: payment.paymentDate
    })),
    salaryAdvances: user.salaryAdvances.map(advance => ({
      id: advance.id,
      amount: decimalToNumber(advance.amount),
      statusCode: advance.status,
      status: formatEnumLabel(advance.status),
      applicationDate: advance.applicationDate
    }))
  };
};

const mapVehicleToSummary = (vehicle: VehicleWithSummaryRelations) => {
  const savingsTotal = vehicle.savingsAccounts.reduce((sum, account) => sum + (decimalToNumber(account.balance) ?? 0), 0);
  const activeLoans = vehicle.loans.filter(
    loan => loan.status !== LoanStatus.REPAID && loan.status !== LoanStatus.REJECTED
  );
  const outstandingLoanAmount = activeLoans.reduce(
    (sum, loan) => sum + (decimalToNumber(loan.amount) ?? 0),
    0
  );

  const lastPayment = vehicle.payments[0];

  return {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    model: vehicle.model ?? null,
    vehicleType: vehicle.vehicleType ?? null,
    yearOfManufacture: vehicle.yearOfManufacture ?? null,
    statusCode: vehicle.status,
    status: formatEnumLabel(vehicle.status) ?? vehicle.status,
    registrationStatusCode: vehicle.registrationStatus,
    registrationStatus: formatEnumLabel(vehicle.registrationStatus) ?? vehicle.registrationStatus,
    insuranceStatusCode: vehicle.insuranceStatus,
    insuranceStatus: formatEnumLabel(vehicle.insuranceStatus) ?? vehicle.insuranceStatus,
    owner: vehicle.owner
      ? {
          id: vehicle.owner.id,
          name: buildUserName(vehicle.owner),
          phone: vehicle.owner.phone ?? null
        }
      : null,
    driver: vehicle.driver
      ? {
          id: vehicle.driver.id,
          name: buildUserName(vehicle.driver),
          phone: vehicle.driver.phone ?? null
        }
      : null,
    route: vehicle.route
      ? {
          id: vehicle.route.id,
          name: vehicle.route.name,
          startPoint: vehicle.route.startPoint,
          endPoint: vehicle.route.endPoint
        }
      : null,
    metrics: {
      savingsBalance: savingsTotal,
      outstandingLoanAmount,
      activeLoanCount: activeLoans.length
    },
    registrationDate: vehicle.dateAdded.toISOString(),
    registrationExpiry: vehicle.registrationExpiry ? vehicle.registrationExpiry.toISOString() : null,
    insuranceProvider: vehicle.insuranceProvider ?? null,
    policyType: vehicle.policyType ?? null,
    insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.toISOString() : null,
    premium: decimalToNumber(vehicle.premium),
    capacity: vehicle.capacity ?? null,
    chassisNumber: vehicle.chassisNumber ?? null,
    engineNumber: vehicle.engineNumber ?? null,
    savingsAccounts: vehicle.savingsAccounts.map((account) => ({
      id: account.id,
      accountType: account.accountType ?? null,
      balance: decimalToNumber(account.balance)
    })),
    loans: vehicle.loans.map((loan) => ({
      id: loan.id,
      amount: decimalToNumber(loan.amount),
      statusCode: loan.status,
      status: formatEnumLabel(loan.status) ?? loan.status,
      typeCode: loan.type,
      type: formatEnumLabel(loan.type) ?? loan.type
    })),
    lastPayment: lastPayment
      ? {
          id: lastPayment.id,
          date: lastPayment.paymentDate.toISOString(),
          amount: decimalToNumber(lastPayment.totalAmount)
        }
      : null
  };
};

const mapLoanToSummary = (loan: LoanWithSummaryRelations) => {
  const amount = decimalToNumber(loan.amount);
  const savingsAtApplication = decimalToNumber(loan.savingsAtApplication);
  const monthlyIncome = decimalToNumber(loan.monthlyIncome);
  const existingLoans = decimalToNumber(loan.existingLoans);

  return {
    id: loan.id,
    applicantId: loan.applicantId,
    vehicleId: loan.vehicleId,
    amount,
    purpose: loan.purpose ?? null,
    savingsAtApplication,
    creditScore: loan.creditScore ?? null,
    monthlyIncome,
    existingLoans,
    urgency: loan.urgency ?? null,
    expectedRepaymentDate: loan.expectedRepaymentDate ?? null,
    statusCode: loan.status,
    status: formatEnumLabel(loan.status) ?? loan.status,
    typeCode: loan.type,
    type: formatEnumLabel(loan.type) ?? loan.type,
    applicationDate: loan.applicationDate,
    approvedAt: loan.approvedAt ?? null,
    approvedBy: loan.approvedBy
      ? {
          id: loan.approvedBy.id,
          name: buildUserName(loan.approvedBy)
        }
      : null,
    applicant: loan.applicant
      ? {
          id: loan.applicant.id,
          name: buildUserName(loan.applicant),
          phone: loan.applicant.phone ?? null
        }
      : null,
    vehicle: loan.vehicle
      ? {
          id: loan.vehicle.id,
          plateNumber: loan.vehicle.plateNumber
        }
      : null,
    guarantors: loan.guarantors.map(guarantor => ({
      id: guarantor.guarantor.id,
      name: buildUserName(guarantor.guarantor),
      phone: guarantor.guarantor.phone ?? null
    }))
  };
};

const mapInsurancePolicyToSummary = (policy: InsuranceWithSummaryRelations) => {
  const premiumAmount = decimalToNumber(policy.premiumAmount);
  let daysToExpiry: number | null = null;
  if (policy.expiryDate) {
    const diffMs = policy.expiryDate.getTime() - Date.now();
    daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    id: policy.id,
    vehicleId: policy.vehicleId,
    statusCode: policy.status,
    status: formatEnumLabel(policy.status) ?? policy.status,
    premiumAmount,
    policyType: policy.policyType ?? null,
    provider: policy.provider ?? null,
    startDate: policy.startDate ?? null,
    expiryDate: policy.expiryDate ?? null,
    daysToExpiry,
    vehicle: policy.vehicle
      ? {
          id: policy.vehicle.id,
          plateNumber: policy.vehicle.plateNumber,
          owner: policy.vehicle.owner
            ? {
                id: policy.vehicle.owner.id,
                name: buildUserName(policy.vehicle.owner),
                phone: policy.vehicle.owner.phone ?? null
              }
            : null
        }
      : null
  };
};

const mapSavingsAccountToSummary = (account: SavingsAccountWithSummaryRelations) => {
  const balance = decimalToNumber(account.balance);
  const monthlyTarget = decimalToNumber(account.monthlyTarget);

  return {
    id: account.id,
    userId: account.userId,
    vehicleId: account.vehicleId ?? null,
    accountType: account.accountType ?? null,
    balance,
    monthlyTarget,
    lastDeposit: account.lastDeposit ?? null,
    createdAt: account.createdAt,
    user: account.user
      ? {
          id: account.user.id,
          name: buildUserName(account.user),
          phone: account.user.phone ?? null
        }
      : null,
    vehicle: account.vehicle
      ? {
          id: account.vehicle.id,
          plateNumber: account.vehicle.plateNumber
        }
      : null
  };
};

const listUsers = async (where: Prisma.UserWhereInput) => {
  const records = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: userSummaryInclude
  });

  return records.map(mapUserToSummary);
};

router.use(authenticate);

router.get('/users', requireMembersRead, async (req, res) => {
  try {
    const status = normalizeUserStatus(req.query.status);
    const searchTerm = toStringOrNull(req.query.search);
    const roleId = toStringOrNull(req.query.roleId);

    const where: Prisma.UserWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (roleId) {
      where.roleId = roleId;
    }
    if (searchTerm) {
      const searchConditions: Prisma.UserWhereInput[] = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } }
      ];

      if (/^\d+$/.test(searchTerm)) {
        try {
          const memberNumber = BigInt(searchTerm);
          searchConditions.push({ memberNumber });
        } catch {
          // Ignore non-numeric member numbers
        }
      }

      where.OR = searchConditions;
    }

    const items = await listUsers(where);
    res.json({
      items,
      total: items.length,
      appliedFilters: {
        status: status ?? null,
        roleId: roleId ?? null,
        search: searchTerm ?? null
      }
    });
  } catch (error) {
    console.error('Failed to list admin users', error);
    res.status(500).json({ message: 'Failed to list users' });
  }
});

router.get('/users/:userId', requireMembersRead, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: userDetailInclude
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(mapUserToDetails(user));
  } catch (error) {
    console.error('Failed to fetch user details', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

router.post('/users', requireMembersCreate, async (req, res) => {
  try {
    const body = req.body ?? {};
    const explicitFirstName = toStringOrNull(body.firstName);
    const explicitLastName = toStringOrNull(body.lastName);
    const combinedName = toStringOrNull(body.name) ?? toStringOrNull(body.fullName);

    let firstName = explicitFirstName;
    let lastName = explicitLastName;

    if ((!firstName || !lastName) && combinedName) {
      const split = splitFullName(combinedName);
      firstName = firstName ?? split.firstName;
      lastName = lastName ?? split.lastName;
    }

    const email = toStringOrNull(body.email);
    const passwordInput = toStringOrNull(body.password);

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'firstName/lastName (or name) and email are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const passwordToUse = passwordInput ?? generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);
    const statusValue = normalizeUserStatus(body.status) ?? UserStatus.PENDING;
    const roleId = toStringOrNull(body.roleId);

    const data: Prisma.UserCreateInput = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      phone: toStringOrNull(body.phone),
      status: statusValue,
      membershipType: toStringOrNull(body.membershipType),
      profileCategory: toStringOrNull(body.profileCategory),
      idNumber: toStringOrNull(body.idNumber),
      address: toStringOrNull(body.address),
      county: toStringOrNull(body.county),
      town: toStringOrNull(body.town),
      occupation: toStringOrNull(body.occupation),
      nextOfKin: toStringOrNull(body.nextOfKin),
      nextOfKinPhone: toStringOrNull(body.nextOfKinPhone)
    };

    const dateOfBirth = parseDateValue(body.dateOfBirth);
    if (dateOfBirth) {
      data.dateOfBirth = dateOfBirth;
    }

    const shareCapitalDecimal = toDecimalValue(body.shareCapital);
    if (shareCapitalDecimal) {
      data.shareCapital = shareCapitalDecimal;
    }

    const savingsBalanceDecimal = toDecimalValue(body.savingsBalance);
    if (savingsBalanceDecimal) {
      data.savingsBalance = savingsBalanceDecimal;
    }

    const loanBalanceDecimal = toDecimalValue(body.loanBalance);
    if (loanBalanceDecimal) {
      data.loanBalance = loanBalanceDecimal;
    }

    const totalDepositsDecimal = toDecimalValue(body.totalDeposits);
    if (totalDepositsDecimal) {
      data.totalDeposits = totalDepositsDecimal;
    }

    if (roleId) {
      data.role = { connect: { id: roleId } };
    }

    const created = await prisma.user.create({
      data,
      include: userSummaryInclude
    });

    const responsePayload: Record<string, unknown> = {
      user: mapUserToSummary(created)
    };

    if (!passwordInput) {
      responsePayload.temporaryPassword = passwordToUse;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error('Failed to create user', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});
router.patch('/users/:userId', requireMembersUpdate, async (req, res) => {
  try {
    const body = req.body ?? {};
    const data: Prisma.UserUpdateInput = {};

    const statusValue = normalizeUserStatus(body.status);
    if (statusValue) {
      data.status = statusValue;
    } else if (body.status !== undefined) {
      return res.status(400).json({ message: 'Invalid user status' });
    }

    const simpleFields: Array<keyof Prisma.UserUpdateInput> = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'membershipType',
      'profileCategory',
      'idNumber',
      'address',
      'county',
      'town',
      'occupation',
      'nextOfKin',
      'nextOfKinPhone'
    ];

    simpleFields.forEach(field => {
      if (body[field] !== undefined) {
        (data as any)[field] = toStringOrNull(body[field]);
      }
    });

    if (body.email !== undefined) {
      const email = toStringOrNull(body.email);
      if (!email) {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }
      data.email = email.toLowerCase();
    }

    const roleId = toStringOrNull(body.roleId);
    if (body.roleId !== undefined) {
      data.role = roleId ? { connect: { id: roleId } } : { disconnect: true };
    }

    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data,
      include: userSummaryInclude
    });

    res.json(mapUserToSummary(updated));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Failed to update user', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

const approveUserWithRole = async (userId: string, roleId: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true }
  });

  if (!role) {
    const error = new Error('Role not found');
    (error as any).statusCode = 404;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId }
    });

    return tx.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        updatedAt: new Date(),
        role: { connect: { id: roleId } }
      },
      include: userSummaryInclude
    });
  });

  return mapUserToSummary(updated);
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      updatedAt: new Date()
    },
    include: userSummaryInclude
  });

  return mapUserToSummary(updated);
};

router.post('/users/:userId/approve', requireMembersApprove, async (req, res) => {
  try {
    const roleId = toStringOrNull(req.body?.roleId);
    if (!roleId) {
      return res.status(400).json({ message: 'roleId is required to approve a user' });
    }

    const summary = await approveUserWithRole(req.params.userId, roleId);
    res.json(summary);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: error.message ?? 'Role not found' });
    }
    console.error('Failed to approve user', error);
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

router.post('/users/:userId/reject', requireMembersApprove, async (req, res) => {
  try {
    const targetStatus = normalizeUserStatus(req.body?.status) ?? UserStatus.SUSPENDED;
    const summary = await updateUserStatus(req.params.userId, targetStatus);
    res.json(summary);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Failed to reject user', error);
    res.status(500).json({ message: 'Failed to reject user' });
  }
});

router.get('/users-approved', requireMembersRead, async (_req, res) => {
  try {
    res.json(await listUsers({ status: UserStatus.ACTIVE }));
  } catch (error) {
    console.error('Failed to list approved users', error);
    res.status(500).json({ message: 'Failed to list approved users' });
  }
});

router.get('/users-pending-approval', requireMembersRead, async (_req, res) => {
  try {
    res.json(await listUsers({ status: UserStatus.PENDING }));
  } catch (error) {
    console.error('Failed to list pending users', error);
    res.status(500).json({ message: 'Failed to list pending users' });
  }
});

router.post('/approve-user', requireMembersApprove, async (req, res) => {
  try {
    const userId = toStringOrNull(req.body?.userId);
    const roleId = toStringOrNull(req.body?.roleId);
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    if (!roleId) {
      return res.status(400).json({ message: 'roleId is required' });
    }

    const summary = await approveUserWithRole(userId, roleId);
    res.json(summary);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error?.statusCode === 404) {
      return res.status(404).json({ message: error.message ?? 'Role not found' });
    }
    console.error('Failed to approve user', error);
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

router.post('/disapprove-user', requireMembersApprove, async (req, res) => {
  try {
    const userId = toStringOrNull(req.body?.userId);
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const targetStatus = normalizeUserStatus(req.body?.status) ?? UserStatus.SUSPENDED;
    const summary = await updateUserStatus(userId, targetStatus);
    res.json(summary);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Failed to disapprove user', error);
    res.status(500).json({ message: 'Failed to disapprove user' });
  }
});

// -------- Fleet management (admin) --------
router.get('/fleet/vehicles', requireVehiclesRead, async (req, res) => {
  try {
    const status = normalizeVehicleStatus(req.query.status);
    const registrationStatus = normalizeRegistrationStatus(req.query.registrationStatus);
    const insuranceStatus = normalizeInsuranceStatus(req.query.insuranceStatus);
    const ownerId = toStringOrNull(req.query.ownerId);
    const driverId = toStringOrNull(req.query.driverId);
    const routeId = toStringOrNull(req.query.routeId);
    const searchTerm = toStringOrNull(req.query.search);

    const where: Prisma.VehicleWhereInput = {};
    if (status) where.status = status;
    if (registrationStatus) where.registrationStatus = registrationStatus;
    if (insuranceStatus) where.insuranceStatus = insuranceStatus;
    if (ownerId) where.ownerId = ownerId;
    if (driverId) where.driverId = driverId;
    if (routeId) where.routeId = routeId;

    if (searchTerm) {
      where.OR = [
        { plateNumber: { contains: searchTerm, mode: 'insensitive' } },
        { model: { contains: searchTerm, mode: 'insensitive' } },
        { vehicleType: { contains: searchTerm, mode: 'insensitive' } },
        { owner: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { owner: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { driver: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { driver: { lastName: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { dateAdded: 'desc' },
      include: vehicleSummaryInclude
    });
    const items = vehicles.map(mapVehicleToSummary);

    res.json({
      items,
      total: items.length,
      appliedFilters: {
        status: status ?? null,
        registrationStatus: registrationStatus ?? null,
        insuranceStatus: insuranceStatus ?? null,
        ownerId: ownerId ?? null,
        driverId: driverId ?? null,
        routeId: routeId ?? null,
        search: searchTerm ?? null
      }
    });
  } catch (error) {
    console.error('Failed to list fleet vehicles', error);
    res.status(500).json({ message: 'Failed to list vehicles' });
  }
});

router.get('/fleet/vehicles/:vehicleId', requireVehiclesRead, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.vehicleId },
      include: vehicleSummaryInclude
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(mapVehicleToSummary(vehicle));
  } catch (error) {
    console.error('Failed to fetch vehicle', error);
    res.status(500).json({ message: 'Failed to fetch vehicle details' });
  }
});

router.post('/fleet/vehicles', requireVehiclesWrite, async (req, res) => {
  try {
    const body = req.body ?? {};
    const ownerId = toStringOrNull(body.ownerId);
    const plateNumber = toStringOrNull(body.plateNumber);

    if (!ownerId) {
      return res.status(400).json({ message: 'ownerId is required' });
    }
    if (!plateNumber) {
      return res.status(400).json({ message: 'plateNumber is required' });
    }

    const [owner, route, driver] = await Promise.all([
      prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } }),
      toStringOrNull(body.routeId)
        ? prisma.route.findUnique({
            where: { id: toStringOrNull(body.routeId)! },
            select: { id: true }
          })
        : Promise.resolve(null),
      toStringOrNull(body.driverId)
        ? prisma.user.findUnique({
            where: { id: toStringOrNull(body.driverId)! },
            select: { id: true }
          })
        : Promise.resolve(null)
    ]);

    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }
    if (toStringOrNull(body.routeId) && !route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    if (toStringOrNull(body.driverId) && !driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const status = normalizeVehicleStatus(body.status) ?? VehicleStatus.INACTIVE;
    const registrationStatus = normalizeRegistrationStatus(body.registrationStatus) ?? RegistrationStatus.PENDING;
    const insuranceStatus = normalizeInsuranceStatus(body.insuranceStatus) ?? InsuranceStatus.PENDING;
    const routeId = toStringOrNull(body.routeId);
    const driverId = toStringOrNull(body.driverId);
    const capacity = toIntValue(body.capacity);
    const yearOfManufacture = toIntValue(body.yearOfManufacture);
    const premium = toDecimalValue(body.premium);
    const insuranceExpiry = parseDateValue(body.insuranceExpiry);
    const registrationExpiry = parseDateValue(body.registrationExpiry);

    const model = toStringOrNull(body.model);
    const vehicleType = toStringOrNull(body.vehicleType);
    const chassisNumber = toStringOrNull(body.chassisNumber);
    const engineNumber = toStringOrNull(body.engineNumber);
    const insuranceProvider = toStringOrNull(body.insuranceProvider);
    const policyType = toStringOrNull(body.policyType);

    const now = new Date();
    const vehicle = await prisma.$transaction(async (tx) => {
      if (driverId) {
        await tx.vehicleDriverAssignment.updateMany({
          where: { driverId, releasedAt: null },
          data: { releasedAt: now }
        });
      }

      const created = await tx.vehicle.create({
        data: {
          ownerId,
          plateNumber,
          model: model ?? undefined,
          vehicleType: vehicleType ?? undefined,
          capacity: capacity ?? undefined,
          chassisNumber: chassisNumber ?? undefined,
          engineNumber: engineNumber ?? undefined,
          yearOfManufacture: yearOfManufacture ?? undefined,
          routeId: routeId ?? undefined,
          status,
          driverId: driverId ?? undefined,
          insuranceStatus,
          insuranceProvider: insuranceProvider ?? undefined,
          policyType: policyType ?? undefined,
          premium: premium ?? undefined,
          insuranceExpiry: insuranceExpiry ?? undefined,
          registrationStatus,
          registrationExpiry: registrationExpiry ?? undefined
        },
        include: vehicleSummaryInclude
      });

      if (driverId) {
        await tx.vehicleDriverAssignment.create({
          data: { vehicleId: created.id, driverId, assignedAt: now }
        });
      }

      return created;
    });

    res.status(201).json(mapVehicleToSummary(vehicle));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'Vehicle with this plate number already exists' });
    }
    console.error('Failed to create vehicle', error);
    res.status(500).json({ message: 'Failed to create vehicle' });
  }
});

router.patch('/fleet/vehicles/:vehicleId', requireVehiclesWrite, async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const existing = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, driverId: true }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const body = req.body ?? {};
    const updateData: Prisma.VehicleUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(body, 'plateNumber')) {
      const plateNumber = toStringOrNull(body.plateNumber);
      if (!plateNumber) {
        return res.status(400).json({ message: 'plateNumber must be a non-empty string' });
      }
      updateData.plateNumber = plateNumber;
    }

    const modelUpdate = toNullableStringUpdate(body.model);
    if (modelUpdate !== undefined) {
      updateData.model = modelUpdate;
    }

    const typeUpdate = toNullableStringUpdate(body.vehicleType);
    if (typeUpdate !== undefined) {
      updateData.vehicleType = typeUpdate;
    }

    const chassisUpdate = toNullableStringUpdate(body.chassisNumber);
    if (chassisUpdate !== undefined) {
      updateData.chassisNumber = chassisUpdate;
    }

    const engineUpdate = toNullableStringUpdate(body.engineNumber);
    if (engineUpdate !== undefined) {
      updateData.engineNumber = engineUpdate;
    }

    const capacityUpdate = toIntUpdateValue(body.capacity);
    if (capacityUpdate !== undefined) {
      updateData.capacity = capacityUpdate;
    }

    const yearUpdate = toIntUpdateValue(body.yearOfManufacture);
    if (yearUpdate !== undefined) {
      updateData.yearOfManufacture = yearUpdate;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      const status = normalizeVehicleStatus(body.status);
      if (!status) {
        return res.status(400).json({ message: 'Invalid vehicle status' });
      }
      updateData.status = status;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'registrationStatus')) {
      const registrationStatus = normalizeRegistrationStatus(body.registrationStatus);
      if (!registrationStatus) {
        return res.status(400).json({ message: 'Invalid registration status' });
      }
      updateData.registrationStatus = registrationStatus;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'insuranceStatus')) {
      const insuranceStatus = normalizeInsuranceStatus(body.insuranceStatus);
      if (!insuranceStatus) {
        return res.status(400).json({ message: 'Invalid insurance status' });
      }
      updateData.insuranceStatus = insuranceStatus;
    }

    const insuranceExpiryUpdate = parseDateUpdateValue(body.insuranceExpiry);
    if (insuranceExpiryUpdate !== undefined) {
      updateData.insuranceExpiry = insuranceExpiryUpdate;
    }

    const registrationExpiryUpdate = parseDateUpdateValue(body.registrationExpiry);
    if (registrationExpiryUpdate !== undefined) {
      updateData.registrationExpiry = registrationExpiryUpdate;
    }

    const insuranceProviderUpdate = toNullableStringUpdate(body.insuranceProvider);
    if (insuranceProviderUpdate !== undefined) {
      updateData.insuranceProvider = insuranceProviderUpdate;
    }

    const policyTypeUpdate = toNullableStringUpdate(body.policyType);
    if (policyTypeUpdate !== undefined) {
      updateData.policyType = policyTypeUpdate;
    }

    const premiumUpdate = toDecimalUpdateValue(body.premium);
    if (premiumUpdate !== undefined) {
      updateData.premium = premiumUpdate;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'ownerId')) {
      const ownerId = toStringOrNull(body.ownerId);
      if (!ownerId) {
        return res.status(400).json({ message: 'ownerId must be a non-empty string' });
      }
      const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } });
      if (!owner) {
        return res.status(404).json({ message: 'Owner not found' });
      }
      updateData.owner = { connect: { id: ownerId } };
    }

    let routeIdUpdate: string | null | undefined;
    if (Object.prototype.hasOwnProperty.call(body, 'routeId')) {
      if (body.routeId === null) {
        routeIdUpdate = null;
      } else {
        routeIdUpdate = toStringOrNull(body.routeId);
        if (!routeIdUpdate) {
          return res.status(400).json({ message: 'routeId must be a non-empty string or null' });
        }
        const route = await prisma.route.findUnique({ where: { id: routeIdUpdate }, select: { id: true } });
        if (!route) {
          return res.status(404).json({ message: 'Route not found' });
        }
      }
      if (routeIdUpdate === null) {
        updateData.route = { disconnect: true };
      } else {
        updateData.route = { connect: { id: routeIdUpdate } };
      }
    }

    let driverIdUpdate: string | null | undefined;
    const driverFieldProvided = Object.prototype.hasOwnProperty.call(body, 'driverId');
    if (driverFieldProvided) {
      if (body.driverId === null) {
        driverIdUpdate = null;
      } else {
        driverIdUpdate = toStringOrNull(body.driverId);
        if (!driverIdUpdate) {
          return res.status(400).json({ message: 'driverId must be a non-empty string or null' });
        }
        const driver = await prisma.user.findUnique({ where: { id: driverIdUpdate }, select: { id: true } });
        if (!driver) {
          return res.status(404).json({ message: 'Driver not found' });
        }
      }
      if (driverIdUpdate === null) {
        updateData.driver = { disconnect: true };
      } else {
        updateData.driver = { connect: { id: driverIdUpdate } };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No updatable fields were provided' });
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      if (driverFieldProvided && driverIdUpdate !== existing.driverId) {
        await tx.vehicleDriverAssignment.updateMany({
          where: { vehicleId, releasedAt: null },
          data: { releasedAt: now }
        });

        if (driverIdUpdate) {
          await tx.vehicleDriverAssignment.updateMany({
            where: { driverId: driverIdUpdate, releasedAt: null },
            data: { releasedAt: now }
          });
        }
      }

      const result = await tx.vehicle.update({
        where: { id: vehicleId },
        data: updateData,
        include: vehicleSummaryInclude
      });

      if (driverFieldProvided && driverIdUpdate && driverIdUpdate !== existing.driverId) {
        await tx.vehicleDriverAssignment.create({
          data: { vehicleId, driverId: driverIdUpdate, assignedAt: now }
        });
      }

      return result;
    });

    res.json(mapVehicleToSummary(updated));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'Vehicle with this plate number already exists' });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    console.error('Failed to update vehicle', error);
    res.status(500).json({ message: 'Failed to update vehicle' });
  }
});

router.delete('/fleet/vehicles/:vehicleId', requireVehiclesWrite, async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const [loans, payments, savings, transactions] = await prisma.$transaction([
      prisma.loan.count({ where: { vehicleId } }),
      prisma.payment.count({ where: { vehicleId } }),
      prisma.savingsAccount.count({ where: { vehicleId } }),
      prisma.transaction.count({ where: { vehicleId } })
    ]);

    if (loans || payments || savings || transactions) {
      return res.status(409).json({
        message: 'Cannot delete vehicle with existing financial records',
        details: {
          loans,
          payments,
          savingsAccounts: savings,
          transactions
        }
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.vehicleDriverAssignment.deleteMany({ where: { vehicleId } });
      await tx.insurancePolicy.deleteMany({ where: { vehicleId } });
      await tx.vehicle.delete({ where: { id: vehicleId } });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete vehicle', error);
    res.status(500).json({ message: 'Failed to delete vehicle' });
  }
});

router.post('/fleet/vehicles/:vehicleId/assign-driver', requireVehiclesAssign, async (req, res) => {
  const { vehicleId } = req.params;
  const driverId = toStringOrNull(req.body?.driverId);
  const assignedAtInput = req.body?.assignedAt;

  if (!driverId) {
    return res.status(400).json({ message: 'driverId is required' });
  }

  try {
    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, driverId: true }
      }),
      prisma.user.findUnique({
        where: { id: driverId },
        select: { id: true }
      })
    ]);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const parsedAssignedAt = parseDateValue(assignedAtInput);
    const assignedAt = parsedAssignedAt ?? new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.vehicleDriverAssignment.updateMany({
        where: { vehicleId, releasedAt: null },
        data: { releasedAt: assignedAt }
      });

      await tx.vehicleDriverAssignment.updateMany({
        where: { driverId, releasedAt: null },
        data: { releasedAt: assignedAt }
      });

      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: { driverId },
        include: vehicleSummaryInclude
      });

      const assignment = await tx.vehicleDriverAssignment.create({
        data: { vehicleId, driverId, assignedAt }
      });

      return { updatedVehicle, assignment };
    });

    res.status(201).json({
      vehicle: mapVehicleToSummary(result.updatedVehicle),
      assignment: {
        id: result.assignment.id,
        vehicleId,
        driverId,
        assignedAt: result.assignment.assignedAt
      }
    });
  } catch (error) {
    console.error('Failed to assign driver', error);
    res.status(500).json({ message: 'Failed to assign driver' });
  }
});

router.post('/fleet/vehicles/:vehicleId/insurance/pay', requireInsuranceWrite, async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, ownerId: true }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const amountDecimal = toDecimalValue(req.body?.amount);
    const amountNumber = amountDecimal ? Number(amountDecimal) : null;

    if (!amountDecimal || !amountNumber || amountNumber <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    const paymentDate = parseDateValue(req.body?.paymentDate) ?? new Date();
    const startDate = parseDateValue(req.body?.startDate) ?? paymentDate;
    const expiryDate = parseDateValue(req.body?.expiryDate);
    const provider = toStringOrNull(req.body?.provider);
    const policyType = toStringOrNull(req.body?.policyType);
    const mpesaReference = toStringOrNull(req.body?.mpesaReference);

    const result = await prisma.$transaction(async (tx) => {
      await tx.insurancePolicy.updateMany({
        where: { vehicleId, status: InsuranceStatus.ACTIVE },
        data: { status: InsuranceStatus.EXPIRED }
      });

      const payment = await tx.payment.create({
        data: {
          userId: vehicle.ownerId,
          vehicleId,
          totalAmount: amountDecimal,
          status: PaymentStatus.COMPLETED,
          paymentDate,
          mpesaReference: mpesaReference ?? undefined
        }
      });

      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          category: PaymentCategory.INSURANCE,
          amount: amountDecimal
        }
      });

      const policy = await tx.insurancePolicy.create({
        data: {
          vehicleId,
          provider: provider ?? undefined,
          policyType: policyType ?? undefined,
          premiumAmount: amountDecimal,
          startDate,
          expiryDate: expiryDate ?? undefined,
          status: InsuranceStatus.ACTIVE
        }
      });

      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          insuranceStatus: InsuranceStatus.ACTIVE,
          insuranceProvider: provider ?? undefined,
          policyType: policyType ?? undefined,
          premium: amountDecimal,
          insuranceExpiry: expiryDate ?? undefined
        },
        include: vehicleSummaryInclude
      });

      return { payment, policy, updatedVehicle };
    });

    res.status(201).json({
      vehicle: mapVehicleToSummary(result.updatedVehicle),
      payment: {
        id: result.payment.id,
        paymentDate: result.payment.paymentDate,
        totalAmount: Number(result.payment.totalAmount),
        status: result.payment.status,
        mpesaReference: result.payment.mpesaReference ?? null
      },
      policy: {
        id: result.policy.id,
        provider: result.policy.provider ?? null,
        policyType: result.policy.policyType ?? null,
        premiumAmount: Number(result.policy.premiumAmount ?? 0),
        startDate: result.policy.startDate ?? null,
        expiryDate: result.policy.expiryDate ?? null,
        status: result.policy.status
      }
    });
  } catch (error) {
    console.error('Failed to record insurance payment', error);
    res.status(500).json({ message: 'Failed to record insurance payment' });
  }
});

router.get('/loans', requireLoansView, async (req, res) => {
  try {
    const status = normalizeLoanStatus(req.query.status);
    const type = normalizeLoanType(req.query.type);
    const search = toStringOrNull(req.query.search);

    const where: Prisma.LoanWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { purpose: { contains: search, mode: 'insensitive' } },
        {
          applicant: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          vehicle: {
            plateNumber: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    const loans = await prisma.loan.findMany({
      where,
      orderBy: { applicationDate: 'desc' },
      include: loanSummaryInclude
    });

    const statusCounts = Object.values(LoanStatus).reduce<Record<LoanStatus, number>>((acc, loanStatus) => {
      acc[loanStatus] = 0;
      return acc;
    }, {} as Record<LoanStatus, number>);

    const typeCounts = Object.values(LoanType).reduce<Record<LoanType, number>>((acc, loanType) => {
      acc[loanType] = 0;
      return acc;
    }, {} as Record<LoanType, number>);

    loans.forEach(loan => {
      statusCounts[loan.status] = (statusCounts[loan.status] ?? 0) + 1;
      typeCounts[loan.type] = (typeCounts[loan.type] ?? 0) + 1;
    });

    res.json({
      items: loans.map(mapLoanToSummary),
      totals: {
        total: loans.length,
        byStatus: statusCounts,
        byType: typeCounts
      }
    });
  } catch (error) {
    console.error('Failed to load admin loans', error);
    res.status(500).json({ message: 'Failed to load loans' });
  }
});

router.get('/loans/:loanId', requireLoansView, async (req, res) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.loanId },
      include: loanSummaryInclude
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json(mapLoanToSummary(loan));
  } catch (error) {
    console.error('Failed to load loan', error);
    res.status(500).json({ message: 'Failed to load loan' });
  }
});

router.patch('/loans/:loanId', requireLoansApprove, async (req: AuthRequest, res) => {
  try {
    const { loanId } = req.params;
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const body = req.body ?? {};
    const updateData: Prisma.LoanUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      const normalizedStatus = normalizeLoanStatus(body.status);
      if (!normalizedStatus) {
        return res.status(400).json({ message: 'Invalid loan status' });
      }
      updateData.status = normalizedStatus;

      if (normalizedStatus === LoanStatus.APPROVED || normalizedStatus === LoanStatus.DISBURSED) {
        updateData.approvedAt = new Date();
        if (req.user?.id) {
          updateData.approvedBy = { connect: { id: req.user.id } };
        }
      } else {
        updateData.approvedAt = null;
        updateData.approvedBy = { disconnect: true };
      }
    }

    const creditScoreUpdate = toIntUpdateValue(body.creditScore);
    if (creditScoreUpdate !== undefined) {
      updateData.creditScore = creditScoreUpdate;
    }

    const monthlyIncomeUpdate = toDecimalUpdateValue(body.monthlyIncome);
    if (monthlyIncomeUpdate !== undefined) {
      updateData.monthlyIncome = monthlyIncomeUpdate;
    }

    const existingLoansUpdate = toDecimalUpdateValue(body.existingLoans);
    if (existingLoansUpdate !== undefined) {
      updateData.existingLoans = existingLoansUpdate;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'urgency')) {
      updateData.urgency = toStringOrNull(body.urgency);
    }

    const expectedRepaymentUpdate = parseDateUpdateValue(body.expectedRepaymentDate);
    if (expectedRepaymentUpdate !== undefined) {
      updateData.expectedRepaymentDate = expectedRepaymentUpdate;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
      include: loanSummaryInclude
    });

    res.json(mapLoanToSummary(updatedLoan));
  } catch (error) {
    console.error('Failed to update loan', error);
    res.status(500).json({ message: 'Failed to update loan' });
  }
});

router.get('/dashboard/users', requireMembersRead, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: userSummaryInclude
    });
    const statusGroups = await prisma.user.groupBy({ by: ['status'], _count: { _all: true } });

    const items = users.map(mapUserToSummary);
    const statusCounts: Record<UserStatus, number> = {
      [UserStatus.ACTIVE]: 0,
      [UserStatus.PENDING]: 0,
      [UserStatus.SUSPENDED]: 0,
      [UserStatus.INACTIVE]: 0
    };

    statusGroups.forEach(group => {
      statusCounts[group.status] = group._count._all;
    });

    res.json({
      items,
      totals: {
        total: items.length,
        byStatus: statusCounts
      }
    });
  } catch (error) {
    console.error('Failed to load dashboard users', error);
    res.status(500).json({ message: 'Failed to load users data' });
  }
});

router.get('/dashboard/vehicles', requireVehiclesRead, async (_req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { dateAdded: 'desc' },
      include: vehicleSummaryInclude
    });
    const statusGroups = await prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } });
    const registrationGroups = await prisma.vehicle.groupBy({
      by: ['registrationStatus'],
      _count: { _all: true }
    });

    const items = vehicles.map(mapVehicleToSummary);

    const statusCounts: Record<VehicleStatus, number> = {
      [VehicleStatus.ACTIVE]: 0,
      [VehicleStatus.INACTIVE]: 0,
      [VehicleStatus.MAINTENANCE]: 0,
      [VehicleStatus.DECOMMISSIONED]: 0
    };
    statusGroups.forEach(group => {
      statusCounts[group.status] = group._count._all;
    });

    const registrationCounts: Record<RegistrationStatus, number> = {
      [RegistrationStatus.VALID]: 0,
      [RegistrationStatus.EXPIRED]: 0,
      [RegistrationStatus.PENDING]: 0
    };
    registrationGroups.forEach(group => {
      registrationCounts[group.registrationStatus] = group._count._all;
    });

    const aggregateMetrics = items.reduce(
      (acc, vehicle) => {
        acc.savingsBalance += vehicle.metrics.savingsBalance;
        acc.outstandingLoanAmount += vehicle.metrics.outstandingLoanAmount;
        acc.activeLoanCount += vehicle.metrics.activeLoanCount;
        return acc;
      },
      { savingsBalance: 0, outstandingLoanAmount: 0, activeLoanCount: 0 }
    );

    res.json({
      items,
      totals: {
        total: items.length,
        byStatus: statusCounts,
        byRegistrationStatus: registrationCounts,
        metrics: aggregateMetrics
      }
    });
  } catch (error) {
    console.error('Failed to load dashboard vehicles', error);
    res.status(500).json({ message: 'Failed to load vehicles data' });
  }
});

router.get('/dashboard/savings', requireFinanceView, async (_req, res) => {
  try {
    const accounts = await prisma.savingsAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: savingsAccountSummaryInclude
    });
    const totalsAggregate = await prisma.savingsAccount.aggregate({
      _sum: {
        balance: true,
        monthlyTarget: true
      }
    });
    const typeGroups = await prisma.savingsAccount.groupBy({
      by: ['accountType'],
      _count: { _all: true },
      _sum: { balance: true }
    });

    const items = accounts.map(mapSavingsAccountToSummary);

    const byType = typeGroups.reduce<Record<string, { count: number; balance: number }>>((acc, group) => {
      const key = group.accountType ?? 'UNSPECIFIED';
      acc[key] = {
        count: group._count._all,
        balance: decimalToNumber(group._sum.balance) ?? 0
      };
      return acc;
    }, {});

    const totalBalance = decimalToNumber(totalsAggregate._sum.balance) ?? 0;
    const totalMonthlyTarget = decimalToNumber(totalsAggregate._sum.monthlyTarget) ?? 0;

    const activeRecently = items.filter(account => {
      if (!account.lastDeposit) return false;
      const diffMs = Date.now() - account.lastDeposit.getTime();
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    }).length;

    res.json({
      items,
      totals: {
        total: items.length,
        sum: totalBalance,
        monthlyTarget: totalMonthlyTarget,
        activeRecently,
        byType
      }
    });
  } catch (error) {
    console.error('Failed to load savings data', error);
    res.status(500).json({ message: 'Failed to load savings data' });
  }
});

router.get('/dashboard/loans', requireLoansView, async (_req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      orderBy: { applicationDate: 'desc' },
      include: loanSummaryInclude
    });
    const statusGroups = await prisma.loan.groupBy({ by: ['status'], _count: { _all: true } });
    const totalAggregate = await prisma.loan.aggregate({ _sum: { amount: true } });
    const outstandingAggregate = await prisma.loan.aggregate({
      where: { status: { notIn: [LoanStatus.REPAID, LoanStatus.REJECTED] } },
      _sum: { amount: true }
    });

    const items = loans.map(mapLoanToSummary);

    const statusCounts: Record<LoanStatus, number> = {
      [LoanStatus.PENDING]: 0,
      [LoanStatus.APPROVED]: 0,
      [LoanStatus.REJECTED]: 0,
      [LoanStatus.DISBURSED]: 0,
      [LoanStatus.REPAID]: 0,
      [LoanStatus.DEFAULTED]: 0
    };
    statusGroups.forEach(group => {
      statusCounts[group.status] = group._count._all;
    });

    res.json({
      items,
      totals: {
        total: items.length,
        byStatus: statusCounts,
        sum: decimalToNumber(totalAggregate._sum.amount) ?? 0,
        outstanding: decimalToNumber(outstandingAggregate._sum.amount) ?? 0
      }
    });
  } catch (error) {
    console.error('Failed to load dashboard loans', error);
    res.status(500).json({ message: 'Failed to load loans data' });
  }
});

router.get('/dashboard/insurance', requireInsuranceRead, async (_req, res) => {
  try {
    const policies = await prisma.insurancePolicy.findMany({
      orderBy: { expiryDate: 'asc' },
      include: insuranceSummaryInclude
    });
    const statusGroups = await prisma.insurancePolicy.groupBy({ by: ['status'], _count: { _all: true } });

    const items = policies.map(mapInsurancePolicyToSummary);

    const statusCounts: Record<InsuranceStatus, number> = {
      [InsuranceStatus.ACTIVE]: 0,
      [InsuranceStatus.EXPIRED]: 0,
      [InsuranceStatus.PENDING]: 0
    };
    statusGroups.forEach(group => {
      statusCounts[group.status] = group._count._all;
    });

    const expiringSoon = items.filter(policy => typeof policy.daysToExpiry === 'number' && policy.daysToExpiry >= 0 && policy.daysToExpiry <= 30).length;

    res.json({
      items,
      totals: {
        total: items.length,
        byStatus: statusCounts,
        expiringSoon
      }
    });
  } catch (error) {
    console.error('Failed to load dashboard insurance policies', error);
    res.status(500).json({ message: 'Failed to load insurance data' });
  }
});

router.get('/reports/remittances', requireFinanceView, async (req: AuthRequest, res) => {
  try {
    const { start, end } = resolveDateRange({
      start: req.query.startDate,
      end: req.query.endDate,
      month: req.query.month
    });

    const { page, pageSize, skip } = resolvePagination(
      req.query as unknown as Record<string, unknown>,
      50,
      500
    );

    const userId = toStringOrNull(req.query.userId);
    const vehicleId = toStringOrNull(req.query.vehicleId);
    const routeId = toStringOrNull(req.query.routeId);
    const driverId = toStringOrNull(req.query.driverId);
    const accountId = toStringOrNull(req.query.accountId);

    const paymentFilter: Prisma.PaymentWhereInput = {
      status: PaymentStatus.COMPLETED,
      paymentDate: { gte: start, lte: end }
    };
    if (userId) paymentFilter.userId = userId;
    if (vehicleId) paymentFilter.vehicleId = vehicleId;
    if (routeId) paymentFilter.routeId = routeId;
    if (driverId) paymentFilter.driverId = driverId;
    if (accountId) {
      paymentFilter.transactions = { some: { accountId } };
    }

    const remittanceWhere: Prisma.PaymentAllocationWhereInput = {
      category: PaymentCategory.OPERATIONS,
      payment: paymentFilter
    };

    const [records, categoryGroups] = await prisma.$transaction([
      prisma.paymentAllocation.findMany({
        where: remittanceWhere,
        orderBy: { payment: { paymentDate: 'desc' } },
        skip,
        take: pageSize,
        include: {
          payment: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              },
              vehicle: { select: { id: true, plateNumber: true, model: true } },
              driver: {
                select: { id: true, firstName: true, lastName: true, phone: true }
              },
              route: { select: { id: true, name: true } },
              allocations: { select: { category: true, amount: true } }
            }
          }
        }
      }),
      prisma.paymentAllocation.groupBy({
        by: ['category'],
        where: { payment: paymentFilter },
        orderBy: { category: 'asc' },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ]);

    const allocationMap = mapAllocationGroups(categoryGroups);
    const operationsMetrics =
      allocationMap.get(PaymentCategory.OPERATIONS) ?? { amount: 0, count: 0 };
    const totalCount = operationsMetrics.count;
    const totalAmount = operationsMetrics.amount;

    const allocationSummary = PAYMENT_CATEGORY_ORDER.map(category => {
      const metrics = allocationMap.get(category) ?? { amount: 0, count: 0 };
      return {
        category,
        label: PAYMENT_CATEGORY_LABELS[category] ?? category,
        amount: metrics.amount,
        count: metrics.count
      };
    });

    const items = records.map(allocation => {
      const payment = allocation.payment;
      const breakdown = (payment.allocations ?? [])
        .map(alloc => ({
          category: alloc.category,
          label: PAYMENT_CATEGORY_LABELS[alloc.category] ?? alloc.category,
          amount: decimalToNumber(alloc.amount) ?? 0
        }))
        .sort(
          (a, b) =>
            PAYMENT_CATEGORY_ORDER.indexOf(a.category) - PAYMENT_CATEGORY_ORDER.indexOf(b.category)
        );

      return {
        allocationId: allocation.id,
        amount: decimalToNumber(allocation.amount) ?? 0,
        payment: {
          id: payment.id,
          mpesaReference: payment.mpesaReference ?? null,
          date: payment.paymentDate.toISOString(),
          status: payment.status,
          totalAmount: decimalToNumber(payment.totalAmount) ?? 0
        },
        user: summarizePerson(payment.user),
        driver: summarizePerson(payment.driver),
        vehicle: payment.vehicle
          ? {
              id: payment.vehicle.id,
              plateNumber: payment.vehicle.plateNumber,
              model: payment.vehicle.model ?? null
            }
          : null,
        route: payment.route ? { id: payment.route.id, name: payment.route.name ?? null } : null,
        allocations: breakdown
      };
    });

    res.json({
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      filters: {
        userId,
        vehicleId,
        routeId,
        driverId,
        accountId
      },
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0,
        hasNext: skip + items.length < totalCount
      },
      totals: {
        amount: totalAmount,
        paymentCount: totalCount
      },
      allocationSummary,
      items
    });
  } catch (error) {
    console.error('Failed to load remittance data', error);
    res.status(500).json({ message: 'Failed to load remittance data' });
  }
});

router.get('/reports/loan-repayments', requireFinanceView, async (req: AuthRequest, res) => {
  try {
    const { start, end } = resolveDateRange({
      start: req.query.startDate,
      end: req.query.endDate,
      month: req.query.month
    });

    const { page, pageSize, skip } = resolvePagination(
      req.query as unknown as Record<string, unknown>,
      50,
      500
    );

    const userId = toStringOrNull(req.query.userId);
    const vehicleId = toStringOrNull(req.query.vehicleId);
    const routeId = toStringOrNull(req.query.routeId);
    const driverId = toStringOrNull(req.query.driverId);
    const accountId = toStringOrNull(req.query.accountId);

    const paymentFilter: Prisma.PaymentWhereInput = {
      status: PaymentStatus.COMPLETED,
      paymentDate: { gte: start, lte: end }
    };
    if (userId) paymentFilter.userId = userId;
    if (vehicleId) paymentFilter.vehicleId = vehicleId;
    if (routeId) paymentFilter.routeId = routeId;
    if (driverId) paymentFilter.driverId = driverId;
    if (accountId) {
      paymentFilter.transactions = { some: { accountId } };
    }

    const repaymentWhere: Prisma.PaymentAllocationWhereInput = {
      category: PaymentCategory.LOAN_REPAYMENT,
      payment: paymentFilter
    };

    const [records, categoryGroups] = await prisma.$transaction([
      prisma.paymentAllocation.findMany({
        where: repaymentWhere,
        orderBy: { payment: { paymentDate: 'desc' } },
        skip,
        take: pageSize,
        include: {
          payment: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
              },
              vehicle: { select: { id: true, plateNumber: true, model: true } },
              driver: {
                select: { id: true, firstName: true, lastName: true, phone: true }
              },
              route: { select: { id: true, name: true } },
              allocations: { select: { category: true, amount: true } },
              transactions: {
                where: { type: TransactionType.LOAN_REPAYMENT },
                select: {
                  id: true,
                  date: true,
                  amount: true,
                  account: {
                    select: {
                      id: true,
                      accountType: true,
                      vehicle: { select: { id: true, plateNumber: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.paymentAllocation.groupBy({
        by: ['category'],
        where: { payment: paymentFilter },
        orderBy: { category: 'asc' },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ]);

    const allocationMap = mapAllocationGroups(categoryGroups);
    const repaymentMetrics =
      allocationMap.get(PaymentCategory.LOAN_REPAYMENT) ?? { amount: 0, count: 0 };
    const totalCount = repaymentMetrics.count;
    const totalAmount = repaymentMetrics.amount;

    const allocationSummary = PAYMENT_CATEGORY_ORDER.map(category => {
      const metrics = allocationMap.get(category) ?? { amount: 0, count: 0 };
      return {
        category,
        label: PAYMENT_CATEGORY_LABELS[category] ?? category,
        amount: metrics.amount,
        count: metrics.count
      };
    });

    const items = records.map(allocation => {
      const payment = allocation.payment;
      const breakdown = (payment.allocations ?? [])
        .map(alloc => ({
          category: alloc.category,
          label: PAYMENT_CATEGORY_LABELS[alloc.category] ?? alloc.category,
          amount: decimalToNumber(alloc.amount) ?? 0
        }))
        .sort(
          (a, b) =>
            PAYMENT_CATEGORY_ORDER.indexOf(a.category) - PAYMENT_CATEGORY_ORDER.indexOf(b.category)
        );

      const transactions = (payment.transactions ?? []).map(tx => ({
        id: tx.id,
        date: tx.date.toISOString(),
        amount: decimalToNumber(tx.amount) ?? 0,
        account: tx.account
          ? {
              id: tx.account.id,
              accountType: tx.account.accountType ?? null,
              vehicle: tx.account.vehicle
                ? {
                    id: tx.account.vehicle.id,
                    plateNumber: tx.account.vehicle.plateNumber
                  }
                : null
            }
          : null
      }));

      return {
        allocationId: allocation.id,
        amount: decimalToNumber(allocation.amount) ?? 0,
        payment: {
          id: payment.id,
          mpesaReference: payment.mpesaReference ?? null,
          date: payment.paymentDate.toISOString(),
          status: payment.status,
          totalAmount: decimalToNumber(payment.totalAmount) ?? 0
        },
        user: summarizePerson(payment.user),
        driver: summarizePerson(payment.driver),
        vehicle: payment.vehicle
          ? {
              id: payment.vehicle.id,
              plateNumber: payment.vehicle.plateNumber,
              model: payment.vehicle.model ?? null
            }
          : null,
        route: payment.route ? { id: payment.route.id, name: payment.route.name ?? null } : null,
        allocations: breakdown,
        transactions
      };
    });

    res.json({
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      filters: {
        userId,
        vehicleId,
        routeId,
        driverId,
        accountId
      },
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0,
        hasNext: skip + items.length < totalCount
      },
      totals: {
        amount: totalAmount,
        repaymentCount: totalCount
      },
      allocationSummary,
      items
    });
  } catch (error) {
    console.error('Failed to load loan repayment data', error);
    res.status(500).json({ message: 'Failed to load loan repayment data' });
  }
});

router.get('/reports/export/summary', requireFinanceView, async (req: AuthRequest, res) => {
  try {
    const { start, end } = resolveDateRange({
      start: req.query.startDate,
      end: req.query.endDate,
      month: req.query.month
    });

    const userId = toStringOrNull(req.query.userId);
    const vehicleId = toStringOrNull(req.query.vehicleId);
    const routeId = toStringOrNull(req.query.routeId);
    const driverId = toStringOrNull(req.query.driverId);
    const accountId = toStringOrNull(req.query.accountId);
    const loanStatuses =
      parseEnumList(req.query.loanStatus, LOAN_STATUS_VALUES) ?? DEFAULT_DISBURSED_LOAN_STATUSES;
    const loanTypes = parseEnumList(req.query.loanType, LOAN_TYPE_VALUES);
    const expenseStatuses = parseEnumList(req.query.expenseStatus, EXPENSE_STATUS_VALUES);
    const expenseCategory = toStringOrNull(req.query.expenseCategory);

    const paymentFilter: Prisma.PaymentWhereInput = {
      status: PaymentStatus.COMPLETED,
      paymentDate: { gte: start, lte: end }
    };
    if (userId) paymentFilter.userId = userId;
    if (vehicleId) paymentFilter.vehicleId = vehicleId;
    if (routeId) paymentFilter.routeId = routeId;
    if (driverId) paymentFilter.driverId = driverId;
    if (accountId) {
      paymentFilter.transactions = { some: { accountId } };
    }

    const loanWhere: Prisma.LoanWhereInput = {
      applicationDate: { gte: start, lte: end },
      status: { in: loanStatuses }
    };
    if (userId) loanWhere.applicantId = userId;
    if (vehicleId) loanWhere.vehicleId = vehicleId;
    if (loanTypes?.length) {
      loanWhere.type = { in: loanTypes };
    }

    const expenseWhere: Prisma.ExpenseWhereInput = {
      date: { gte: start, lte: end }
    };
    if (expenseStatuses?.length) {
      expenseWhere.status = { in: expenseStatuses };
    }
    if (expenseCategory) {
      expenseWhere.category = { equals: expenseCategory, mode: 'insensitive' };
    }

    const [allocationGroups, paymentAggregate, loanAggregate, expenseAggregate] =
      await prisma.$transaction([
        prisma.paymentAllocation.groupBy({
          by: ['category'],
          where: { payment: paymentFilter },
          orderBy: { category: 'asc' },
          _sum: { amount: true },
          _count: { _all: true }
        }),
        prisma.payment.aggregate({
          where: paymentFilter,
          _sum: { totalAmount: true },
          _count: { _all: true }
        }),
        prisma.loan.aggregate({
          where: loanWhere,
          _sum: { amount: true },
          _count: { _all: true }
        }),
        prisma.expense.aggregate({
          where: expenseWhere,
          _sum: { amount: true },
          _count: { _all: true }
        })
      ]);

    const allocationMap = mapAllocationGroups(allocationGroups);

    const allocationSummary = PAYMENT_CATEGORY_ORDER.map(category => {
      const metrics = allocationMap.get(category) ?? { amount: 0, count: 0 };
      return {
        category,
        label: PAYMENT_CATEGORY_LABELS[category] ?? category,
        amount: metrics.amount,
        count: metrics.count
      };
    });

    const summaryMap = new Map(allocationSummary.map(entry => [entry.category, entry]));

    res.json({
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      },
      filters: {
        userId,
        vehicleId,
        routeId,
        driverId,
        accountId,
        loanStatuses,
        loanTypes: loanTypes ?? null,
        expenseStatuses: expenseStatuses ?? null,
        expenseCategory
      },
      totals: {
        remittance: summaryMap.get(PaymentCategory.OPERATIONS)?.amount ?? 0,
        insurance: summaryMap.get(PaymentCategory.INSURANCE)?.amount ?? 0,
        loanRepayments: summaryMap.get(PaymentCategory.LOAN_REPAYMENT)?.amount ?? 0,
        savings: summaryMap.get(PaymentCategory.SAVINGS)?.amount ?? 0
      },
      allocationSummary,
      payments: {
        totalAmount: decimalToNumber(paymentAggregate._sum.totalAmount) ?? 0,
        count: paymentAggregate._count?._all ?? 0
      },
      loans: {
        totalAmount: decimalToNumber(loanAggregate._sum.amount) ?? 0,
        count: loanAggregate._count?._all ?? 0
      },
      expenses: {
        totalAmount: decimalToNumber(expenseAggregate._sum.amount) ?? 0,
        count: expenseAggregate._count?._all ?? 0
      }
    });
  } catch (error) {
    console.error('Failed to load export summary', error);
    res.status(500).json({ message: 'Failed to load export summary' });
  }
});

export default router;
