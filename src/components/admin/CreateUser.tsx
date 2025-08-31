import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserDataService, User, UserRole } from '../../services/userData';
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
  Users
} from 'lucide-react';

interface CreateUserProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface CreateUserForm {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  role: User['role'] | '';
  status: User['status'];
  profileCategory: User['profileCategory'];
  address: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  occupation: string;
  dateOfBirth: string;
  shareCapital: string;
  savingsBalance: string;
  permissions: string[];
}

export function CreateUser({ user, onNavigate, onLogout }: CreateUserProps) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [formData, setFormData] = useState<CreateUserForm>({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    role: '',
    status: 'Pending',
    profileCategory: 'Individual',
    address: '',
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

  useEffect(() => {
    setRoles(UserDataService.getAllRoles());
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserForm> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.nextOfKin.trim()) newErrors.nextOfKin = 'Next of kin is required';
    if (!formData.nextOfKinPhone.trim()) newErrors.nextOfKinPhone = 'Next of kin phone is required';
    if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone validation
    if (formData.phone && !/^\+254\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be in format +254XXXXXXXXX';
    }

    // ID number validation
    if (formData.idNumber && !/^\d{7,8}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'ID number must be 7-8 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRoleChange = (roleValue: string) => {
    const selectedRole = roles.find(r => r.name === roleValue);
    setFormData(prev => ({
      ...prev,
      role: roleValue as User['role'],
      permissions: selectedRole ? selectedRole.permissions : []
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const userData: Omit<User, 'id' | 'memberNumber' | 'createdAt' | 'modifiedAt'> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        idNumber: formData.idNumber.trim(),
        role: formData.role as User['role'],
        status: formData.status,
        registrationDate: new Date().toISOString().split('T')[0],
        lastLogin: 'Never',
        profileCategory: formData.profileCategory,
        shareCapital: parseFloat(formData.shareCapital) || 0,
        savingsBalance: parseFloat(formData.savingsBalance) || 0,
        loanBalance: 0,
        totalDeposits: 0,
        address: formData.address.trim(),
        nextOfKin: formData.nextOfKin.trim(),
        nextOfKinPhone: formData.nextOfKinPhone.trim(),
        occupation: formData.occupation.trim(),
        dateOfBirth: formData.dateOfBirth,
        vehicles: formData.role === 'Vehicle Owner' ? [] : undefined,
        permissions: formData.permissions,
        createdBy: user?.name || 'admin',
        modifiedBy: user?.name || 'admin'
      };

      const newUser = UserDataService.createUser(userData);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        idNumber: '',
        role: '',
        status: 'Pending',
        profileCategory: 'Individual',
        address: '',
        nextOfKin: '',
        nextOfKinPhone: '',
        occupation: '',
        dateOfBirth: '',
        shareCapital: '0',
        savingsBalance: '0',
        permissions: []
      });

      alert(`User created successfully! Member Number: ${newUser.memberNumber}`);
      
    } catch (error) {
      alert('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      onNavigate('admin/users');
    }
  };

  return (
    <AdminLayout user={user} currentPage="admin/users/create" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-600">Add a new member to the MATIS SACCO system</p>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
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
                      placeholder="user@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      National ID Number *
                    </label>
                    <Input
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      placeholder="12345678"
                      className={errors.idNumber ? 'border-red-500' : ''}
                    />
                    {errors.idNumber && <p className="text-sm text-red-600 mt-1">{errors.idNumber}</p>}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation *
                    </label>
                    <Input
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="Matatu Owner, Driver, etc."
                      className={errors.occupation ? 'border-red-500' : ''}
                    />
                    {errors.occupation && <p className="text-sm text-red-600 mt-1">{errors.occupation}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Full address including city/town"
                    className={`min-h-[80px] ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Next of Kin Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Next of Kin Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next of Kin Name *
                    </label>
                    <Input
                      value={formData.nextOfKin}
                      onChange={(e) => handleInputChange('nextOfKin', e.target.value)}
                      placeholder="Next of kin full name"
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
                      placeholder="+254712345678"
                      className={errors.nextOfKinPhone ? 'border-red-500' : ''}
                    />
                    {errors.nextOfKinPhone && <p className="text-sm text-red-600 mt-1">{errors.nextOfKinPhone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
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
            {/* System Settings */}
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
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Category
                  </label>
                  <Select value={formData.profileCategory} onValueChange={(value) => handleInputChange('profileCategory', value)}>
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
              </CardContent>
            </Card>

            {/* Role Permissions Preview */}
            {formData.permissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.permissions.slice(0, 5).map((permission) => (
                      <p key={permission} className="text-xs text-gray-600">• {permission}</p>
                    ))}
                    {formData.permissions.length > 5 && (
                      <p className="text-xs text-gray-500">+{formData.permissions.length - 5} more permissions</p>
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