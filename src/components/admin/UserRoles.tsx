import { useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import {
  fetchRoles,
  fetchPermissions,
  fetchRolePermissions,
  fetchDashboardUsers,
  createRole,
  updateRole,
  deleteRole,
  addRolePermission,
  removeRolePermission,
  AdminRole,
  AdminPermission,
  RolePermissionRecord
} from '../../services/admin';
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  RefreshCcw
} from 'lucide-react';

interface UserRolesProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}
interface RoleWithAssignments extends AdminRole {
  permissions: string[];
  userCount: number;
}
const PERMISSION_CATEGORIES: AdminPermission['category'][] = [
  'User Management',
  'Fleet Management',
  'Financial',
  'Reports',
  'System'
];

export function UserRoles({ user, onNavigate, onLogout }: UserRolesProps) {
  const [roles, setRoles] = useState<RoleWithAssignments[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [rolePermissionRecords, setRolePermissionRecords] = useState<RolePermissionRecord[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithAssignments | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [loading, setLoading] = useState(true);
    
  const loadData = async () => {
    setLoading(true);
    
    try {
      const [rolesResponse, permissionsResponse, rolePermissionsResponse, usersResponse] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchRolePermissions(),
        fetchDashboardUsers()
      ]);

      const userCountByRole = new Map<string, number>();
      usersResponse.items.forEach(member => {
        if (member.roleId) {
          userCountByRole.set(member.roleId, (userCountByRole.get(member.roleId) ?? 0) + 1);
        }      });

      const permissionsByRole = rolePermissionsResponse.reduce<Record<string, string[]>>((acc, record) => {
        acc[record.roleId] = acc[record.roleId] ? [...acc[record.roleId], record.permissionId] : [record.permissionId];
        return acc;
      }, {});

      const mappedRoles: RoleWithAssignments[] = rolesResponse.map(role => ({
        ...role,
        permissions: permissionsByRole[role.id] ?? [],
        userCount: userCountByRole.get(role.id) ?? 0
      }));

      setRoles(mappedRoles);
      setPermissions(permissionsResponse);
      setRolePermissionRecords(rolePermissionsResponse);
    } catch (err) {
      console.error('Failed to load roles overview', err);
    } finally {
      setLoading(false);
    }  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setSelectedRole(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (role: RoleWithAssignments) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description ?? '',
      permissions: [...role.permissions]
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (role: RoleWithAssignments) => {
    setSelectedRole(role);
    setShowViewDialog(true);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, permissionId])]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const createRoleWithPermissions = async () => {
    if (!formData.name.trim()) {
      console.warn('Role name is required');
      return;
    }    try {
      const newRole = await createRole({
        name: formData.name.trim(),
        description: formData.description.trim() || null
      });

      await Promise.all(
        formData.permissions.map(permissionId => addRolePermission(newRole.id, permissionId))
      );

      setShowCreateDialog(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create role', err);
    }  };

  const updateRoleWithPermissions = async () => {
    if (!selectedRole) return;
    if (!formData.name.trim()) {
      console.warn('Role name is required');
      return;
    }    try {
      await updateRole(selectedRole.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      });

      const currentPermissions = new Set(selectedRole.permissions);
      const updatedPermissions = new Set(formData.permissions);

      const toAdd = formData.permissions.filter(permissionId => !currentPermissions.has(permissionId));
      const toRemove = selectedRole.permissions.filter(permissionId => !updatedPermissions.has(permissionId));

      await Promise.all(
        toAdd.map(permissionId => addRolePermission(selectedRole.id, permissionId))
      );

      await Promise.all(
        toRemove.map(permissionId => {
          const record = rolePermissionRecords.find(
            item => item.roleId === selectedRole.id && item.permissionId === permissionId
          );
          if (!record) return Promise.resolve();
          return removeRolePermission(record.id);
        })
      );

      setShowEditDialog(false);
      await loadData();
    } catch (err) {
      console.error('Failed to update role', err);
    }  };

  const handleDeleteRole = async (role: RoleWithAssignments) => {
    if (role.userCount > 0) {
      console.warn('Cannot delete a role that has assigned users.');
      return;
    }    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }    try {
      await deleteRole(role.id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete role', err);
    }  };

  const getPermissionsByCategory = (category: AdminPermission['category']) =>
    permissions.filter(permission => permission.category === category);

  const getPermissionName = (permissionId: string) =>
    permissions.find(permission => permission.id === permissionId)?.name ?? permissionId;

  const totalUsersCovered = useMemo(() => roles.reduce((sum, role) => sum + role.userCount, 0), [roles]);

  if (loading) {
    return (
      <AdminLayout user={user} onNavigate={onNavigate} onLogout={onLogout} title="User Roles">
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          Loading roles...
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout user={user} onNavigate={onNavigate} onLogout={onLogout} title="User Roles">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Role Management</h1>
            <p className="text-gray-500">
              Manage role definitions, descriptions, and permissions for all members.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadData} className="flex items-center space-x-2">
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Role</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            icon={Shield}
            title="Active Roles"
            value={roles.length.toString()}
            detail={`${permissions.length} available permissions`}
          />
          <SummaryCard
            icon={Users}
            title="Members Covered"
            value={totalUsersCovered.toLocaleString()}
            detail="Total users assigned to roles"
          />
          <SummaryCard
            icon={Eye}
            title="Permission Categories"
            value={PERMISSION_CATEGORIES.length.toString()}
            detail="Group permissions for easy assignment"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {roles.map(role => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{role.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{role.userCount} users</Badge>
                      <Button variant="ghost" size="icon" onClick={() => openViewDialog(role)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteRole(role)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {role.description && <p className="text-sm text-gray-500">{role.description}</p>}                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="font-medium text-gray-900">Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.length === 0 && (
                      <Badge variant="outline">No permissions assigned</Badge>
                    )}                    {role.permissions.map(permissionId => (
                      <Badge key={permissionId} variant="outline">
                        {getPermissionName(permissionId)}                      </Badge>
                    ))}                  </div>
                </CardContent>
              </Card>
            ))}          </div>

          <Card>
            <CardHeader>
              <CardTitle>Permissions Catalogue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PERMISSION_CATEGORIES.map(category => (
                <div key={category} className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {getPermissionsByCategory(category).map(permission => (
                      <Badge key={permission.id} variant="outline">
                        {permission.name}                      </Badge>
                    ))}                  </div>
                </div>
              ))}            </CardContent>
          </Card>
        </div>

        {/* Create Role Dialog */}        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>
                Define a new role and assign the permissions that determine accessible features.
              </DialogDescription>
            </DialogHeader>

            <RoleForm
              formData={formData}              setFormData={setFormData}              permissions={permissions}              onPermissionToggle={handlePermissionChange}            />

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={createRoleWithPermissions} className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update the role name, description, or permissions. Changes affect all assigned users.
              </DialogDescription>
            </DialogHeader>

            <RoleForm
              formData={formData}              setFormData={setFormData}              permissions={permissions}              onPermissionToggle={handlePermissionChange}            />

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={updateRoleWithPermissions} className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Update Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Role Dialog */}        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription>
                View the assigned permissions and member coverage for this role.
              </DialogDescription>
            </DialogHeader>

            {selectedRole && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                    <p className="text-sm text-gray-900">{selectedRole.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Users Count</label>
                    <p className="text-sm text-gray-900">{selectedRole.userCount} users</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900">{selectedRole.description ?? '—'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Assigned Permissions</h3>
                  <div className="space-y-6">
                    {PERMISSION_CATEGORIES.map(category => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRole.permissions
                            .filter(permissionId => permissions.find(p => p.id === permissionId)?.category === category)
                            .map(permissionId => (
                              <Badge key={permissionId} variant="outline">
                                {getPermissionName(permissionId)}                              </Badge>
                            ))}                          {selectedRole.permissions.filter(permissionId => permissions.find(p => p.id === permissionId)?.category === category).length === 0 && (
                            <Badge variant="outline">No permissions</Badge>
                          )}                        </div>
                      </div>
                    ))}                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setShowViewDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
const SummaryCard = ({
  icon: Icon,
  title,
  value,
  detail
}: {
  icon: typeof Shield;
  title: string;
  value: string;
  detail: string;
}) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-gray-50">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{detail}</p>
    </CardContent>
  </Card>
);

const RoleForm = ({
  formData,
  setFormData,
  permissions,
  onPermissionToggle
}: {
  formData: { name: string; description: string; permissions: string[] };
  setFormData: Dispatch<SetStateAction<{ name: string; description: string; permissions: string[] }>>;
  permissions: AdminPermission[];
  onPermissionToggle: (permissionId: string, checked: boolean) => void;
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
        <Input
          value={formData.name}          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}          placeholder="Enter role name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <Textarea
          value={formData.description}          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}          placeholder="Describe the purpose of this role"
          className="min-h-[40px]"
        />
      </div>
    </div>

    <div>
      <h3 className="font-medium text-gray-900 mb-4">Permissions</h3>
      <div className="space-y-6">
        {PERMISSION_CATEGORIES.map(category => (
          <div key={category} className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">{category}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissions
                .filter(permission => permission.category === category)
                .map(permission => {
                  const checked = formData.permissions.includes(permission.id);
                  return (
                    <label key={permission.id} className="flex items-start space-x-3 rounded-lg border border-gray-200 p-3 hover:border-[var(--neon-turquoise)] transition">
                      <Checkbox
                        checked={checked}                        onCheckedChange={(value) => onPermissionToggle(permission.id, Boolean(value))}                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                        {permission.description && (
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        )}                      </div>
                    </label>
                  );
                })}              {permissions.filter(permission => permission.category === category).length === 0 && (
                <p className="text-sm text-gray-500">No permissions in this category.</p>
              )}            </div>
          </div>
        ))}      </div>
    </div>
  </div>
);







