import { PrismaClient, UserType } from '@prisma/client';

const prisma = new PrismaClient();

const inferUserType = (roleNames: string[]): UserType => {
  const normalized = roleNames.map(name => name.toUpperCase());
  if (normalized.some(name => name === 'ADMIN')) {
    return UserType.ADMIN;
  }
  if (normalized.some(name => name.includes('STAFF'))) {
    return UserType.STAFF;
  }
  return UserType.USER;
};

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, roles: { include: { role: true } } }
  });

  for (const user of users) {
    if (user.roles.length === 0 && user.roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: user.roleId } },
        update: {},
        create: { userId: user.id, roleId: user.roleId }
      });
    }

    const roleNames = user.roles.length
      ? user.roles.map(entry => entry.role?.name).filter((name): name is string => Boolean(name))
      : user.role?.name
        ? [user.role.name]
        : [];

    const userTypeValue = (user as { userType?: UserType | null }).userType;
    const shouldUpdateUserType =
      (userTypeValue == null && roleNames.length > 0) ||
      (process.env.ALLOW_DEFAULT_USER_TYPE_UPDATE === 'true' &&
        userTypeValue === UserType.USER &&
        roleNames.length > 0);

    if (shouldUpdateUserType) {
      await prisma.user.update({
        where: { id: user.id },
        data: { userType: inferUserType(roleNames) }
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
