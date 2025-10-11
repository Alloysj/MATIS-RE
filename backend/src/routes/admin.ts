import { Router, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, UserStatus, VehicleStatus, RegistrationStatus, LoanStatus, InsuranceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const ADMIN_ROLE_NAMES = new Set(['ADMIN', 'SUPERADMIN', 'SUPER ADMIN']);

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
      balance: true
    }
  },
  loans: {
    select: {
      id: true,
      amount: true,
      status: true
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

type VehicleWithSummaryRelations = Prisma.VehicleGetPayload<{
  include: typeof vehicleSummaryInclude;
}>;

type LoanWithSummaryRelations = Prisma.LoanGetPayload<{
  include: typeof loanSummaryInclude;
}>;

type InsuranceWithSummaryRelations = Prisma.InsurancePolicyGetPayload<{
  include: typeof insuranceSummaryInclude;
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

const normalizeUserStatus = (value: unknown): UserStatus | null => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return (Object.values(UserStatus) as string[]).includes(normalized)
    ? (normalized as UserStatus)
    : null;
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

const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const adminRecord = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true }
    });

    const roleName = adminRecord?.role?.name?.trim().toUpperCase();

    if (!adminRecord || !roleName || !ADMIN_ROLE_NAMES.has(roleName)) {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    next();
  } catch (error) {
    console.error('Failed to verify admin privileges', error);
    res.status(500).json({ message: 'Failed to verify admin privileges' });
  }
};

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
  return {
    id: loan.id,
    applicantId: loan.applicantId,
    vehicleId: loan.vehicleId,
    amount,
    statusCode: loan.status,
    status: formatEnumLabel(loan.status) ?? loan.status,
    typeCode: loan.type,
    type: formatEnumLabel(loan.type) ?? loan.type,
    applicationDate: loan.applicationDate,
    approvedAt: loan.approvedAt ?? null,
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
      : null
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

const listUsers = async (where: Prisma.UserWhereInput) => {
  const records = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: userSummaryInclude
  });

  return records.map(mapUserToSummary);
};

router.use(authenticate, requireAdmin);

router.get('/users', async (req, res) => {
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

router.get('/users/:userId', async (req, res) => {
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

router.post('/users', async (req, res) => {
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
router.patch('/users/:userId', async (req, res) => {
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

router.post('/users/:userId/approve', async (req, res) => {
  try {
    const summary = await updateUserStatus(req.params.userId, UserStatus.ACTIVE);
    res.json(summary);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Failed to approve user', error);
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

router.post('/users/:userId/reject', async (req, res) => {
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

router.get('/users-approved', async (_req, res) => {
  try {
    res.json(await listUsers({ status: UserStatus.ACTIVE }));
  } catch (error) {
    console.error('Failed to list approved users', error);
    res.status(500).json({ message: 'Failed to list approved users' });
  }
});

router.get('/users-pending-approval', async (_req, res) => {
  try {
    res.json(await listUsers({ status: UserStatus.PENDING }));
  } catch (error) {
    console.error('Failed to list pending users', error);
    res.status(500).json({ message: 'Failed to list pending users' });
  }
});

router.post('/approve-user', async (req, res) => {
  try {
    const userId = toStringOrNull(req.body?.userId);
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const summary = await updateUserStatus(userId, UserStatus.ACTIVE);
    res.json(summary);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    console.error('Failed to approve user', error);
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

router.post('/disapprove-user', async (req, res) => {
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

router.get('/dashboard/users', async (_req, res) => {
  try {
    const [users, statusGroups] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: userSummaryInclude
      }),
      prisma.user.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

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

router.get('/dashboard/vehicles', async (_req, res) => {
  try {
    const [vehicles, statusGroups, registrationGroups] = await Promise.all([
      prisma.vehicle.findMany({
        orderBy: { dateAdded: 'desc' },
        include: vehicleSummaryInclude
      }),
      prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.vehicle.groupBy({ by: ['registrationStatus'], _count: { _all: true } })
    ]);

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

router.get('/dashboard/loans', async (_req, res) => {
  try {
    const [loans, statusGroups, totalAggregate, outstandingAggregate] = await Promise.all([
      prisma.loan.findMany({
        orderBy: { applicationDate: 'desc' },
        include: loanSummaryInclude
      }),
      prisma.loan.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.loan.aggregate({ _sum: { amount: true } }),
      prisma.loan.aggregate({
        where: { status: { notIn: [LoanStatus.REPAID, LoanStatus.REJECTED] } },
        _sum: { amount: true }
      })
    ]);

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

router.get('/dashboard/insurance', async (_req, res) => {
  try {
    const [policies, statusGroups] = await Promise.all([
      prisma.insurancePolicy.findMany({
        orderBy: { expiryDate: 'asc' },
        include: insuranceSummaryInclude
      }),
      prisma.insurancePolicy.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

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

export default router;
