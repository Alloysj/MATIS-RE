import { PrismaClient, UserType } from '@prisma/client';
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
