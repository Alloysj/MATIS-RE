import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { UserDataService, UserRole, Permission } from '../../services/userData';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Save,
  X
} from 'lucide-react';

interface UserRolesProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function UserRoles({ user, onNavigate, onLogout }: UserRolesProps) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    setRoles(UserDataService.getAllRoles());
    setPermissions(UserDataService.getAllPermissions());
  }, []);

  const handleCreateRole = () => {
    if (!formData.name.trim()) return;
    
    UserDataService.createRole({
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions
    });
    
    setRoles(UserDataService.getAllRoles());
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditRole = () => {
    if (!selectedRole) return;
    
    UserDataService.updateRole(selectedRole.id, {
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions
    });
    
    setRoles(UserDataService.getAllRoles());
    setShowEditDialog(false);
    resetForm();
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      UserDataService.deleteRole(roleId);
      setRoles(UserDataService.getAllRoles());
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setSelectedRole(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (role: UserRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (role: UserRole) => {
    setSelectedRole(role);
    setShowViewDialog(true);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const getPermissionsByCategory = (category: Permission['category']) => {
    return permissions.filter(p => p.category === category);
  };

  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
  };

  const RoleCard = ({ role }: { role: UserRole }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-black" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{role.name}</h3>
              <p className="text-sm text-gray-600">{role.description}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openViewDialog(role)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(role)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteRole(role.id)}
              disabled={role.userCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{role.userCount} users</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{role.permissions.length} permissions</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PermissionSection = ({ category, isForm = false }: { category: Permission['category'], isForm?: boolean }) => {
    const categoryPermissions = getPermissionsByCategory(category);
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">{category}</h4>
        <div className="space-y-2">
          {categoryPermissions.map((permission) => (
            <div key={permission.id} className="flex items-start space-x-3">
              {isForm ? (
                <Checkbox
                  id={permission.id}
                  checked={formData.permissions.includes(permission.id)}
                  onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                />
              ) : (
                <div className="w-4 h-4 mt-0.5">
                  {selectedRole?.permissions.includes(permission.id) && (
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  )}
                </div>
              )}
              <div className="flex-1">
                <label htmlFor={permission.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                  {permission.name}
                </label>
                <p className="text-xs text-gray-600">{permission.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout user={user} currentPage="admin/users/roles" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Roles & Permissions</h1>
            <p className="text-gray-600">Manage user roles and their associated permissions</p>
          </div>
          
          <Button onClick={openCreateDialog} className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-blue-600">{roles.length}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                  <p className="text-2xl font-bold text-green-600">{permissions.length}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {roles.reduce((sum, role) => sum + role.userCount, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>

        {/* Create Role Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new user role and assign specific permissions to control access to different parts of the system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this role's purpose"
                    className="min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Permissions</h3>
                <div className="space-y-6">
                  <PermissionSection category="User Management" isForm />
                  <PermissionSection category="Fleet Management" isForm />
                  <PermissionSection category="Financial" isForm />
                  <PermissionSection category="Reports" isForm />
                  <PermissionSection category="System" isForm />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleCreateRole} className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Modify the role name, description, and permissions. Changes will affect all users assigned to this role.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this role's purpose"
                    className="min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Permissions</h3>
                <div className="space-y-6">
                  <PermissionSection category="User Management" isForm />
                  <PermissionSection category="Fleet Management" isForm />
                  <PermissionSection category="Financial" isForm />
                  <PermissionSection category="Reports" isForm />
                  <PermissionSection category="System" isForm />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleEditRole} className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  Update Role
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Role Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription>
                View detailed information about this role including assigned permissions and user count.
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
                    <p className="text-sm text-gray-900">{selectedRole.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Assigned Permissions</h3>
                  <div className="space-y-6">
                    <PermissionSection category="User Management" />
                    <PermissionSection category="Fleet Management" />
                    <PermissionSection category="Financial" />
                    <PermissionSection category="Reports" />
                    <PermissionSection category="System" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setShowViewDialog(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}