import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Shield, RefreshCcw, Settings } from 'lucide-react';
import {
  fetchRoles,
  fetchStaffProfiles,
  createStaffProfile,
  updateStaffProfile,
  setStaffProfileStatus,
  fetchStaffProfilePermissions,
  updateStaffProfilePermissions,
  AdminRole,
  StaffProfileSummary,
  StaffProfilePermissionsResponse
} from '../../services/admin';
import { MODULE_PERMISSIONS, ModulePermissionDefinition } from '../../navigation/modulePermissions';

interface StaffProfilesProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<StaffProfilesLayoutProps>;
  currentPage?: string;
}

interface StaffProfilesLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type StaffProfileFormState = {
  name: string;
  description: string;
  roleIds: string[];
  isActive: boolean;
};

const defaultFormState: StaffProfileFormState = {
  name: '',
  description: '',
  roleIds: [],
  isActive: true
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

export function StaffProfiles({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/staff-profiles'
}: StaffProfilesProps) {
  const [profiles, setProfiles] = useState<StaffProfileSummary[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfileSummary | null>(null);
  const [formData, setFormData] = useState<StaffProfileFormState>(defaultFormState);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsData, setPermissionsData] = useState<StaffProfilePermissionsResponse | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [editingPermissions, setEditingPermissions] = useState<Set<string>>(new Set());

  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => a.name.localeCompare(b.name)),
    [roles]
  );

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const [profilesResponse, rolesResponse] = await Promise.all([
        fetchStaffProfiles({ includeInactive: true }),
        fetchRoles()
      ]);
      setProfiles(profilesResponse);
      setRoles(rolesResponse);
    } catch (error) {
      toast.error('Failed to load staff profiles', { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const openCreateDialog = () => {
    setSelectedProfile(null);
    setFormData(defaultFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (profile: StaffProfileSummary) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description ?? '',
      roleIds: profile.roles.map(role => role.id),
      isActive: profile.isActive
    });
    setDialogOpen(true);
  };

  const openPermissionsDialog = async (profile: StaffProfileSummary) => {
    setPermissionsDialogOpen(true);
    setPermissionsLoading(true);
    try {
      const data = await fetchStaffProfilePermissions(profile.id);
      setPermissionsData(data);
      const firstRole = data.roles[0]?.id ?? 'ALL';
      setSelectedRoleId(data.roles.length > 1 ? firstRole : 'ALL');
      const initialPermissions =
        data.roles.length > 1
          ? data.permissionsByRole[firstRole] ?? []
          : data.effectivePermissions ?? [];
      setEditingPermissions(new Set(initialPermissions));
    } catch (error) {
      toast.error('Failed to load permissions', { description: getErrorMessage(error) });
      setPermissionsDialogOpen(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const updateEditingPermissions = (nextPermissions: string[]) => {
    setEditingPermissions(new Set(nextPermissions));
  };

  const handleRoleSelection = (roleId: string) => {
    setSelectedRoleId(roleId);
    if (!permissionsData) return;
    const nextPermissions =
      roleId === 'ALL'
        ? permissionsData.effectivePermissions ?? []
        : permissionsData.permissionsByRole[roleId] ?? [];
    updateEditingPermissions(nextPermissions);
  };

  const getModulePermissions = (module: ModulePermissionDefinition) => [
    ...module.visibilityPermissions,
    ...module.actions.map(action => action.permission)
  ];

  const toggleModule = (module: ModulePermissionDefinition, enabled: boolean) => {
    const modulePermissions = getModulePermissions(module);
    const next = new Set(editingPermissions);
    if (enabled) {
      if (!module.visibilityPermissions.some(permission => next.has(permission))) {
        next.add(module.visibilityPermissions[0]);
      }
    } else {
      modulePermissions.forEach(permission => next.delete(permission));
    }
    setEditingPermissions(next);
  };

  const togglePermission = (module: ModulePermissionDefinition, permission: string, enabled: boolean) => {
    const next = new Set(editingPermissions);
    if (enabled) {
      next.add(permission);
      if (!module.visibilityPermissions.some(perm => next.has(perm))) {
        next.add(module.visibilityPermissions[0]);
      }
    } else {
      next.delete(permission);
    }
    setEditingPermissions(next);
  };

  const handleSavePermissions = async () => {
    if (!permissionsData) return;
    const permissions = Array.from(editingPermissions);
    const targetRoleIds = selectedRoleId === 'ALL' ? undefined : [selectedRoleId];

    setPermissionsLoading(true);
    try {
      const updated = await updateStaffProfilePermissions(permissionsData.profile.id, {
        mode: 'REPLACE',
        targetRoleIds,
        permissions
      });
      setPermissionsData(updated);
      setEditingPermissions(new Set(targetRoleIds ? updated.permissionsByRole[targetRoleIds[0]] ?? [] : updated.effectivePermissions ?? []));
      toast.success('Permissions updated.');
    } catch (error) {
      toast.error('Failed to update permissions', { description: getErrorMessage(error) });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleToggleRole = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roleIds: checked
        ? [...new Set([...prev.roleIds, roleId])]
        : prev.roleIds.filter(id => id !== roleId)
    }));
  };

  const handleSubmit = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('Profile name is required.');
      return;
    }
    if (formData.roleIds.length === 0) {
      toast.error('Select at least one role for this profile.');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedProfile) {
        await updateStaffProfile(selectedProfile.id, {
          name: trimmedName,
          description: formData.description.trim() || null,
          roleIds: formData.roleIds,
          isActive: formData.isActive
        });
        toast.success(`Updated ${trimmedName}.`);
      } else {
        await createStaffProfile({
          name: trimmedName,
          description: formData.description.trim() || null,
          roleIds: formData.roleIds
        });
        toast.success(`Created ${trimmedName}.`);
      }
      setDialogOpen(false);
      await loadProfiles();
    } catch (error) {
      toast.error('Failed to save staff profile', { description: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (profile: StaffProfileSummary, nextActive: boolean) => {
    if (!nextActive && !confirm(`Deactivate ${profile.name}? This will hide it from assignments.`)) {
      return;
    }
    try {
      await setStaffProfileStatus(profile.id, nextActive);
      toast.success(`${profile.name} ${nextActive ? 'activated' : 'deactivated'}.`);
      await loadProfiles();
    } catch (error) {
      toast.error('Failed to update status', { description: getErrorMessage(error) });
    }
  };

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Staff Profiles</h1>
            <p className="text-sm text-gray-500">
              Bundle roles into staff profiles for quick assignment in the admin workflow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadProfiles} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Profile
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[50vh] text-gray-500">
            Loading staff profiles...
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-gray-500">
              No staff profiles yet. Create one to bundle roles for staff assignments.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {profiles.map(profile => (
              <Card key={profile.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {profile.name}
                        <Badge variant={profile.isActive ? 'default' : 'outline'}>
                          {profile.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      {profile.description && (
                        <p className="text-sm text-gray-500 mt-1">{profile.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(profile)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openPermissionsDialog(profile)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={profile.isActive}
                        onCheckedChange={(value) => handleStatusChange(profile, Boolean(value))}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 mb-2">Roles ({profile.roles.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.roles.map(role => (
                      <Badge key={role.id} variant="outline">
                        {role.name}
                      </Badge>
                    ))}
                    {profile.roles.length === 0 && (
                      <Badge variant="outline">No roles assigned</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProfile ? 'Edit Staff Profile' : 'Create Staff Profile'}</DialogTitle>
            <DialogDescription>
              Define a staff profile and bundle one or more roles for quick assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Name</label>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Treasurer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(event) => setFormData(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional description"
                  className="min-h-[40px]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Role Bundle</label>
                {selectedProfile && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    Roles define permissions for this profile.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sortedRoles.map(role => {
                  const checked = formData.roleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className="flex items-start space-x-3 rounded-lg border border-gray-200 p-3 hover:border-[var(--neon-turquoise)] transition"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => handleToggleRole(role.id, Boolean(value))}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-gray-500">{role.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedProfile && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Profile status</p>
                  <p className="text-xs text-gray-500">Deactivate to hide this profile from assignments.</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(value) => setFormData(prev => ({ ...prev, isActive: Boolean(value) }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
            >
              {selectedProfile ? 'Save Changes' : 'Create Profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Modules & Permissions</DialogTitle>
            <DialogDescription>
              Toggle modules and action-level permissions for this staff profile. Users may need to re-login to see updates.
            </DialogDescription>
          </DialogHeader>

          {permissionsLoading || !permissionsData ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading permissions...</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{permissionsData.profile.name}</p>
                  <p className="text-xs text-gray-500">
                    Roles: {permissionsData.roles.map(role => role.name).join(', ') || 'None'}
                  </p>
                </div>
                {permissionsData.roles.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Edit scope</label>
                    <select
                      value={selectedRoleId}
                      onChange={(event) => handleRoleSelection(event.target.value)}
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                    >
                      <option value="ALL">All roles</option>
                      {permissionsData.roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {MODULE_PERMISSIONS.map(module => {
                  const modulePermissions = getModulePermissions(module);
                  const moduleEnabled = modulePermissions.some(permission => editingPermissions.has(permission));
                  return (
                    <Card key={module.key}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{module.label}</CardTitle>
                          <Switch
                            checked={moduleEnabled}
                            onCheckedChange={(value) => toggleModule(module, Boolean(value))}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Module access requires: {module.visibilityPermissions.join(' or ')}.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {module.actions.map(action => {
                            const checked = editingPermissions.has(action.permission);
                            return (
                              <label
                                key={action.key}
                                className="flex items-start space-x-3 rounded-lg border border-gray-200 p-3 hover:border-[var(--neon-turquoise)] transition"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => togglePermission(module, action.permission, Boolean(value))}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{action.label}</p>
                                  <p className="text-xs text-gray-500">{action.permission}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <p>Effective permissions: {editingPermissions.size}</p>
                <p>Users may need to re-login to see changes.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)} disabled={permissionsLoading}>
              Close
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={permissionsLoading || !permissionsData}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
            >
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutComponent>
  );
}
