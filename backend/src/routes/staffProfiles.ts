import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../prismaClient';

const router = Router();

const requireRbacAdmin = requirePermission('ADMIN:RBAC');

const mapProfile = (profile: any, includeRoles: boolean) => ({
  id: profile.id,
  name: profile.name,
  description: profile.description,
  isActive: profile.isActive,
  roles: includeRoles
    ? (profile.roles ?? []).map((entry: any) => entry.role).filter(Boolean)
    : []
});

const ensurePermissionsExist = async (names: string[]) => {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  for (const name of uniqueNames) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, category: name.split(':')[0] }
    });
  }
};

const ensureRolesExist = async (roleIds: string[]) => {
  const uniqueRoleIds = Array.from(new Set(roleIds));
  if (uniqueRoleIds.length === 0) {
    return { ok: true, roles: [] as string[] };
  }
  const roles = await prisma.role.findMany({ where: { id: { in: uniqueRoleIds } } });
  if (roles.length !== uniqueRoleIds.length) {
    return { ok: false, roles: uniqueRoleIds };
  }
  return { ok: true, roles: uniqueRoleIds };
};

router.get('/', authenticate, requireRbacAdmin, async (req, res) => {
  const includeRoles = String(req.query.includeRoles ?? 'true') !== 'false';
  const includeInactive = String(req.query.includeInactive ?? 'false') === 'true';
  const profiles = await prisma.staffProfile.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: includeRoles ? { roles: { include: { role: true } } } : undefined
  });
  res.json(profiles.map(profile => mapProfile(profile, includeRoles)));
});

router.get('/:id', authenticate, requireRbacAdmin, async (req, res) => {
  const includeRoles = String(req.query.includeRoles ?? 'true') !== 'false';
  const profile = await prisma.staffProfile.findUnique({
    where: { id: req.params.id },
    include: includeRoles ? { roles: { include: { role: true } } } : undefined
  });
  if (!profile) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }
  res.json(mapProfile(profile, includeRoles));
});

router.get('/:id/permissions', authenticate, requireRbacAdmin, async (req, res) => {
  const profile = await prisma.staffProfile.findUnique({
    where: { id: req.params.id },
    include: { roles: { include: { role: true } } }
  });

  if (!profile) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  const roleIds = profile.roles.map((entry: any) => entry.roleId);
  const roleRecords = profile.roles.map((entry: any) => entry.role).filter(Boolean);

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds } },
    include: { permission: true }
  });

  const permissionsByRole: Record<string, string[]> = {};
  for (const roleId of roleIds) {
    permissionsByRole[roleId] = [];
  }

  for (const entry of rolePermissions) {
    const list = permissionsByRole[entry.roleId] ?? [];
    list.push(entry.permission.name);
    permissionsByRole[entry.roleId] = list;
  }

  const effectivePermissions = Array.from(
    new Set(rolePermissions.map(entry => entry.permission.name))
  ).sort();

  res.json({
    profile: mapProfile(profile, true),
    roles: roleRecords,
    effectivePermissions,
    permissionsByRole
  });
});

router.post('/', authenticate, requireRbacAdmin, async (req, res) => {
  const { name, description, roleIds, allowEmptyRoles } = req.body ?? {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  if (!trimmedName) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const existing = await prisma.staffProfile.findUnique({ where: { name: trimmedName } });
  if (existing) {
    return res.status(409).json({ message: 'Staff profile name already exists' });
  }

  const rolesInput = Array.isArray(roleIds) ? roleIds.filter(Boolean).map(String) : [];
  if (rolesInput.length === 0 && !allowEmptyRoles) {
    return res.status(400).json({ message: 'At least one role is required' });
  }

  const roleCheck = await ensureRolesExist(rolesInput);
  if (!roleCheck.ok) {
    return res.status(400).json({ message: 'One or more roles do not exist' });
  }

  const created = await prisma.$transaction(async (tx) => {
    const profile = await tx.staffProfile.create({
      data: {
        name: trimmedName,
        description: description ? String(description) : null,
        isActive: true
      }
    });
    if (roleCheck.roles.length > 0) {
      await tx.staffProfileRole.createMany({
        data: roleCheck.roles.map(roleId => ({ staffProfileId: profile.id, roleId }))
      });
    }
    return tx.staffProfile.findUnique({
      where: { id: profile.id },
      include: { roles: { include: { role: true } } }
    });
  });

  res.status(201).json(mapProfile(created, true));
});

router.put('/:id', authenticate, requireRbacAdmin, async (req, res) => {
  const { name, description, isActive, roleIds, allowEmptyRoles } = req.body ?? {};
  const profile = await prisma.staffProfile.findUnique({ where: { id: req.params.id } });
  if (!profile) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  const trimmedName = typeof name === 'string' ? name.trim() : null;
  if (trimmedName === '') {
    return res.status(400).json({ message: 'Name is required' });
  }

  if (trimmedName && trimmedName !== profile.name) {
    const existing = await prisma.staffProfile.findUnique({ where: { name: trimmedName } });
    if (existing && existing.id !== profile.id) {
      return res.status(409).json({ message: 'Staff profile name already exists' });
    }
  }

  const rolesInput = Array.isArray(roleIds) ? roleIds.filter(Boolean).map(String) : null;
  if (rolesInput !== null && rolesInput.length === 0 && !allowEmptyRoles) {
    return res.status(400).json({ message: 'At least one role is required' });
  }

  const roleCheck = rolesInput ? await ensureRolesExist(rolesInput) : { ok: true, roles: [] as string[] };
  if (rolesInput && !roleCheck.ok) {
    return res.status(400).json({ message: 'One or more roles do not exist' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.staffProfile.update({
      where: { id: profile.id },
      data: {
        name: trimmedName ?? undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        isActive: typeof isActive === 'boolean' ? isActive : undefined
      }
    });

    if (rolesInput) {
      await tx.staffProfileRole.deleteMany({ where: { staffProfileId: profile.id } });
      if (roleCheck.roles.length > 0) {
        await tx.staffProfileRole.createMany({
          data: roleCheck.roles.map(roleId => ({ staffProfileId: profile.id, roleId }))
        });
      }
    }

    return tx.staffProfile.findUnique({
      where: { id: next.id },
      include: { roles: { include: { role: true } } }
    });
  });

  res.json(mapProfile(updated, true));
});

router.patch('/:id/status', authenticate, requireRbacAdmin, async (req, res) => {
  const { isActive } = req.body ?? {};
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be a boolean' });
  }

  const profile = await prisma.$transaction(async (tx) => {
    await tx.staffProfile.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    return tx.staffProfile.findUnique({
      where: { id: req.params.id },
      include: { roles: { include: { role: true } } }
    });
  });

  if (!profile) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  res.json(mapProfile(profile, true));
});

router.put('/:id/permissions', authenticate, requireRbacAdmin, async (req, res) => {
  const profile = await prisma.staffProfile.findUnique({
    where: { id: req.params.id },
    include: { roles: { include: { role: true } } }
  });

  if (!profile) {
    return res.status(404).json({ message: 'Staff profile not found' });
  }

  const allowInactive = Boolean(req.body?.allowInactive);
  if (!profile.isActive && !allowInactive) {
    return res.status(400).json({ message: 'Staff profile is inactive' });
  }

  const mode = String(req.body?.mode ?? 'REPLACE').toUpperCase();
  const targetRoleIdsInput = Array.isArray(req.body?.targetRoleIds)
    ? req.body.targetRoleIds.filter(Boolean).map(String)
    : [];
  const allProfileRoleIds: string[] = profile.roles.map((entry: any) => String(entry.roleId));
  const targetRoleIds: string[] = targetRoleIdsInput.length > 0 ? targetRoleIdsInput : allProfileRoleIds;

  if (targetRoleIds.length === 0) {
    return res.status(400).json({ message: 'Staff profile has no roles to update' });
  }

  const invalidRole = targetRoleIds.find((roleId: string) => !allProfileRoleIds.includes(roleId));
  if (invalidRole) {
    return res.status(400).json({ message: 'Target roles must belong to the staff profile' });
  }

  const permissionsInput = req.body?.permissions;
  let permissions: string[] = [];
  let add: string[] = [];
  let remove: string[] = [];

  if (mode === 'PATCH') {
    add = Array.isArray(permissionsInput?.add) ? permissionsInput.add.filter(Boolean).map(String) : [];
    remove = Array.isArray(permissionsInput?.remove) ? permissionsInput.remove.filter(Boolean).map(String) : [];
    permissions = Array.from(new Set([...add, ...remove]));
  } else {
    if (!Array.isArray(permissionsInput)) {
      return res.status(400).json({ message: 'Permissions must be an array of names' });
    }
    permissions = permissionsInput.filter(Boolean).map(String);
  }

  await ensurePermissionsExist(permissions);

  const adminRoleId =
    profile.roles.find((entry: any) => entry.role?.name === 'ADMIN')?.roleId ?? null;

  let updated: { permissionsByRole: Record<string, string[]>; effectivePermissions: string[] };
  try {
    updated = await prisma.$transaction(async (tx) => {
      const permissionRows = await tx.permission.findMany({
        where: { name: { in: permissions } }
      });
      const permissionIdByName = new Map(permissionRows.map(row => [row.name, row.id]));

      for (const roleId of targetRoleIds) {
        if (mode === 'PATCH') {
          const addIds = add.map(name => permissionIdByName.get(name)).filter(Boolean) as string[];
          const removeIds = remove.map(name => permissionIdByName.get(name)).filter(Boolean) as string[];

          if (roleId === adminRoleId && removeIds.length > 0) {
            const adminRbacId = permissionIdByName.get('ADMIN:RBAC');
            if (adminRbacId && removeIds.includes(adminRbacId)) {
              throw new Error('Cannot remove ADMIN:RBAC from ADMIN role');
            }
          }

          if (addIds.length > 0) {
            await tx.rolePermission.createMany({
              data: addIds.map(permissionId => ({ roleId, permissionId })),
              skipDuplicates: true
            });
          }
          if (removeIds.length > 0) {
            await tx.rolePermission.deleteMany({
              where: { roleId, permissionId: { in: removeIds } }
            });
          }
        } else {
          const nextPermissionIds = permissions
            .map(name => permissionIdByName.get(name))
            .filter(Boolean) as string[];

          if (roleId === adminRoleId && !permissions.includes('ADMIN:RBAC')) {
            throw new Error('ADMIN:RBAC is required for ADMIN role');
          }

          await tx.rolePermission.deleteMany({ where: { roleId } });
          if (nextPermissionIds.length > 0) {
            await tx.rolePermission.createMany({
              data: nextPermissionIds.map(permissionId => ({ roleId, permissionId })),
              skipDuplicates: true
            });
          }
        }
      }

      const refreshedRolePermissions = await tx.rolePermission.findMany({
        where: { roleId: { in: allProfileRoleIds } },
        include: { permission: true }
      });

      const permissionsByRole: Record<string, string[]> = {};
      for (const roleId of allProfileRoleIds) {
        permissionsByRole[roleId] = [];
      }
      for (const entry of refreshedRolePermissions) {
        const list = permissionsByRole[entry.roleId] ?? [];
        list.push(entry.permission.name);
        permissionsByRole[entry.roleId] = list;
      }

      const effectivePermissions = Array.from(
        new Set(refreshedRolePermissions.map(entry => entry.permission.name))
      ).sort();

      return { permissionsByRole, effectivePermissions };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update permissions';
    return res.status(400).json({ message });
  }

  res.json({
    profile: mapProfile(profile, true),
    roles: profile.roles.map((entry: any) => entry.role).filter(Boolean),
    effectivePermissions: updated.effectivePermissions,
    permissionsByRole: updated.permissionsByRole
  });
});

export default router;
