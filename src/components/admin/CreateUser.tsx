import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  createAdminUser,
  fetchRoles,
  fetchPermissions,
  fetchRolePermissions,
  AdminRole,
  RolePermissionRecord,
  AdminUserStatusCode
} from '../../services/admin';
import {
  UserPlus,
  Save,
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User as UserIcon,
  Building,
  Users,
  RefreshCcw
} from 'lucide-react';

interface CreateUserProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type ProfileCategory = 'Individual' | 'Corporate' | 'Cooperative';

interface RoleOption extends AdminRole {
  permissionIds: string[];
  permissionNames: string[];
}

interface CreateUserForm {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  roleId: string;
  status: AdminUserStatusCode;
  profileCategory: ProfileCategory;
  membershipType: string;
  address: string;
  county: string;
  town: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  occupation: string;
  dateOfBirth: string;
  shareCapital: string;
  savingsBalance: string;
  permissions: string[];
}

const STATUS_OPTIONS: { value: AdminUserStatusCode; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' }
];

const parseFullName = (fullName: string) => {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { firstName: '', lastName: '' };
  }
  const [firstName, ...rest] = normalized.split(' ');
  return {
    firstName,
    lastName: rest.length ? rest.join(' ') : firstName
  };
};

const toNumberOrNull = (value: string) => {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export function CreateUser({ user, onNavigate, onLogout }: CreateUserProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
    const [formData, setFormData] = useState<CreateUserForm>({
    fullName: '',
    phone: '',
    email: '',
    idNumber: '',
    roleId: '',
    status: 'PENDING',
    profileCategory: 'Individual',
    membershipType: 'Standard',
    address: '',
    county: '',
    town: '',
    nextOfKin: '',
    nextOfKinPhone: '',
    occupation: '',
    dateOfBirth: '',
    shareCapital: '0',
    savingsBalance: '0',
    permissions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserForm>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  
  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const [rolesResponse, permissionsResponse, rolePermissionsResponse] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchRolePermissions()
      ]);

      const permissionNameById = new Map<string, string>();
      permissionsResponse.forEach(permission => permissionNameById.set(permission.id, permission.name));

      const permissionsGrouped = rolePermissionsResponse.reduce<Record<string, RolePermissionRecord[]>>(
        (acc, record) => {
          acc[record.roleId] = acc[record.roleId] ? [...acc[record.roleId], record] : [record];
          return acc;
        },
        {}
      );

      const mappedRoles: RoleOption[] = rolesResponse.map(role => {
        const records = permissionsGrouped[role.id] ?? [];
        const permissionIds = records.map(record => record.permissionId);
        const permissionNames = permissionIds.map(id => permissionNameById.get(id) ?? id);
        return {
          ...role,
          permissionIds,
          permissionNames
        };
      });

      setRoles(mappedRoles);
    } catch (err) {
      console.error('Failed to load roles data', err);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserForm> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
    if (!formData.roleId) newErrors.roleId = 'Role is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.nextOfKin.trim()) newErrors.nextOfKin = 'Next of kin is required';
    if (!formData.nextOfKinPhone.trim()) newErrors.nextOfKinPhone = 'Next of kin phone is required';
    if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid international phone number';
    }

    if (formData.idNumber && !/^\d{7,8}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'ID number must be 7-8 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRoleChange = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    setFormData(prev => ({
      ...prev,
      roleId,
      permissions: role ? role.permissionNames : []
    }));
    if (errors.roleId) {
      setErrors(prev => ({ ...prev, roleId: undefined }));
    }
  };

  const handleSubmit = async () => {
    setSubmitMessage(null);

    if (!validateForm()) return;

    const { firstName, lastName } = parseFullName(formData.fullName);
    if (!firstName || !lastName) {
      setErrors(prev => ({ ...prev, fullName: 'Enter at least first and last name' }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createAdminUser({
        firstName,
        lastName,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        idNumber: formData.idNumber.trim() || undefined,
        status: formData.status,
        profileCategory: formData.profileCategory,
        membershipType: formData.membershipType || undefined,
        address: formData.address.trim() || undefined,
        county: formData.county.trim() || undefined,
        town: formData.town.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        nextOfKin: formData.nextOfKin.trim() || undefined,
        nextOfKinPhone: formData.nextOfKinPhone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        shareCapital: toNumberOrNull(formData.shareCapital),
        savingsBalance: toNumberOrNull(formData.savingsBalance),
        roleId: formData.roleId || undefined
      });

      const message = response.temporaryPassword
        ? `User created successfully. Temporary password: ${response.temporaryPassword}`
        : 'User created successfully.';
      setSubmitMessage(message);

      setFormData({
        fullName: '',
        phone: '',
        email: '',
        idNumber: '',
        roleId: '',
        status: 'PENDING',
        profileCategory: 'Individual',
        membershipType: 'Standard',
        address: '',
        county: '',
        town: '',
        nextOfKin: '',
        nextOfKinPhone: '',
        occupation: '',
        dateOfBirth: '',
        shareCapital: '0',
        savingsBalance: '0',
        permissions: []
      });
    } catch (err) {
      console.error('Failed to create user', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRole = useMemo(() => roles.find(role => role.id === formData.roleId), [roles, formData.roleId]);

  return (
    <AdminLayout user={user} onNavigate={onNavigate} onLogout={onLogout} title="Create User">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create New Member</h1>
            <p className="text-gray-500">Capture member information and assign their initial role.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={loadRoles} className="flex items-center space-x-2">
              <RefreshCcw className="h-4 w-4" />
              <span>Refresh Roles</span>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Member'}</span>
            </Button>
          </div>
        </div>

        {submitMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-3 text-sm text-green-700">
              {submitMessage}
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+254712345678"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="name@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Number *
                    </label>
                    <Input
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      placeholder="National ID"
                      className={errors.idNumber ? 'border-red-500' : ''}
                    />
                    {errors.idNumber && <p className="text-sm text-red-600 mt-1">{errors.idNumber}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Member Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next of Kin *
                    </label>
                    <Input
                      value={formData.nextOfKin}
                      onChange={(e) => handleInputChange('nextOfKin', e.target.value)}
                      placeholder="Enter next of kin"
                      className={errors.nextOfKin ? 'border-red-500' : ''}
                    />
                    {errors.nextOfKin && <p className="text-sm text-red-600 mt-1">{errors.nextOfKin}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next of Kin Phone *
                    </label>
                    <Input
                      value={formData.nextOfKinPhone}
                      onChange={(e) => handleInputChange('nextOfKinPhone', e.target.value)}
                      placeholder="+2547..."
                      className={errors.nextOfKinPhone ? 'border-red-500' : ''}
                    />
                    {errors.nextOfKinPhone && <p className="text-sm text-red-600 mt-1">{errors.nextOfKinPhone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation *
                    </label>
                    <Input
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="Occupation or role"
                      className={errors.occupation ? 'border-red-500' : ''}
                    />
                    {errors.occupation && <p className="text-sm text-red-600 mt-1">{errors.occupation}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={errors.dateOfBirth ? 'border-red-500' : ''}
                    />
                    {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Residential Address *
                    </label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Street, town, county"
                      className={`min-h-[60px] ${errors.address ? 'border-red-500' : ''}`}
                    />
                    {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      County
                    </label>
                    <Input
                      value={formData.county}
                      onChange={(e) => handleInputChange('county', e.target.value)}
                      placeholder="County"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Town
                    </label>
                    <Input
                      value={formData.town}
                      onChange={(e) => handleInputChange('town', e.target.value)}
                      placeholder="Town or estate"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Initial Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Share Capital (KSh)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.shareCapital}
                      onChange={(e) => handleInputChange('shareCapital', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Savings Balance (KSh)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.savingsBalance}
                      onChange={(e) => handleInputChange('savingsBalance', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>System Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role *
                  </label>
                  <Select
                    value={formData.roleId}
                    onValueChange={handleRoleChange}
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className={errors.roleId ? 'border-red-500' : ''}>
                      <SelectValue placeholder={rolesLoading ? 'Loading roles...' : 'Select role'} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roleId && <p className="text-sm text-red-600 mt-1">{errors.roleId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as AdminUserStatusCode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Category
                  </label>
                  <Select
                    value={formData.profileCategory}
                    onValueChange={(value) => handleInputChange('profileCategory', value as ProfileCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membership Type
                  </label>
                  <Input
                    value={formData.membershipType}
                    onChange={(e) => handleInputChange('membershipType', e.target.value)}
                    placeholder="Standard"
                  />
                </div>
              </CardContent>
            </Card>

            {formData.permissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.permissions.slice(0, 6).map((permission) => (
                      <p key={permission} className="text-xs text-gray-600">• {permission}</p>
                    ))}
                    {formData.permissions.length > 6 && (
                      <p className="text-xs text-gray-500">
                        +{formData.permissions.length - 6} more permissions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}





