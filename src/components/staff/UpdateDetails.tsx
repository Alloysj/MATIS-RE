import { useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Building, 
  Edit3, 
  Save, 
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface UpdateDetailsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function UpdateDetails({ user, onNavigate, onLogout }: UpdateDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: 'staff@matissacco.co.ke',
    address: '123 Matatu Street, Nairobi',
    bankName: 'Equity Bank',
    accountNumber: '0123456789',
    nhifNumber: 'NHIF123456',
    idNumber: '12345678',
    emergencyContact: '+254 712 345 678',
    emergencyName: 'Jane Doe'
  });

  const [originalData, setOriginalData] = useState(formData);

  const handleEdit = () => {
    setOriginalData(formData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleSave = () => {
    // Simulate API call
    setTimeout(() => {
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const personalFields = [
    { key: 'name', label: 'Full Name', icon: User, required: true },
    { key: 'phone', label: 'Phone Number', icon: Phone, required: true },
    { key: 'email', label: 'Email Address', icon: Mail, required: true },
    { key: 'address', label: 'Home Address', icon: MapPin, required: false },
    { key: 'idNumber', label: 'ID Number', icon: CreditCard, required: true }
  ];

  const bankingFields = [
    { key: 'bankName', label: 'Bank Name', icon: Building, required: true },
    { key: 'accountNumber', label: 'Account Number', icon: CreditCard, required: true },
    { key: 'nhifNumber', label: 'NHIF Number', icon: Building, required: true }
  ];

  const emergencyFields = [
    { key: 'emergencyName', label: 'Emergency Contact Name', icon: User, required: true },
    { key: 'emergencyContact', label: 'Emergency Contact Phone', icon: Phone, required: true }
  ];

  const renderField = (field: any) => (
    <div key={field.key} className="space-y-2">
      <Label htmlFor={field.key} className="flex items-center space-x-2">
        <field.icon className="h-4 w-4 text-gray-500" />
        <span>{field.label}</span>
        {field.required && <span className="text-red-500">*</span>}
      </Label>
      {isEditing ? (
        <Input
          id={field.key}
          value={formData[field.key as keyof typeof formData]}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className="border-2 border-[var(--neon-turquoise)]/20 focus:border-[var(--neon-turquoise)]"
          required={field.required}
        />
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <p className="text-gray-900">{formData[field.key as keyof typeof formData] || 'Not provided'}</p>
        </div>
      )}
    </div>
  );

  return (
    <StaffLayout user={user} currentPage="staff/update" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Update Profile Details</h1>
            <p className="text-gray-600">Manage your personal and banking information</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isEditing ? "secondary" : "default"} className="px-3 py-1">
              {isEditing ? 'Editing Mode' : 'View Mode'}
            </Badge>
            {!isEditing ? (
              <Button 
                onClick={handleEdit}
                className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <Card className="border-l-4 border-[var(--neon-turquoise)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-[var(--neon-turquoise)]" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Your basic personal details and identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {personalFields.map(renderField)}
            </div>
          </CardContent>
        </Card>

        {/* Banking Information */}
        <Card className="border-l-4 border-[var(--neon-yellow)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-[var(--neon-orange)]" />
              <span>Banking & NHIF Information</span>
            </CardTitle>
            <CardDescription>
              Required for salary payments and health insurance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bankingFields.map(renderField)}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="border-l-4 border-[var(--neon-orange)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-[var(--neon-orange)]" />
              <span>Emergency Contact</span>
            </CardTitle>
            <CardDescription>
              Person to contact in case of emergency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {emergencyFields.map(renderField)}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-[var(--neon-purple)]" />
              <span>Account Status</span>
            </CardTitle>
            <CardDescription>
              Current status of your staff account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="p-3 bg-green-50 rounded-lg border">
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Employment Date</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900">January 15, 2023</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Staff ID</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900">STAFF-001</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Notice */}
        {isEditing && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Important Notice</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Changes to banking information may take 1-2 business days to reflect in the payroll system. 
                    Please ensure all information is accurate before saving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
}