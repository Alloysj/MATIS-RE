import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getStaffDetails, getStaffProfile, updateStaffDetails } from '../../services/staff';

interface UpdateDetailsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface StaffProfileFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  idNumber: string;
  bankName: string;
  accountNumber: string;
  kraNumber: string;
  nhifNumber: string;
  emergencyName: string;
  emergencyContact: string;
}

const initialFormState: StaffProfileFormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  idNumber: '',
  bankName: '',
  accountNumber: '',
  kraNumber: '',
  nhifNumber: '',
  emergencyName: '',
  emergencyContact: ''
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong while processing your request.';
};

const toStringValue = (value: unknown) => (value == null ? '' : String(value));

export function UpdateDetails({ user, onNavigate, onLogout }: UpdateDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StaffProfileFormState>(initialFormState);
  const [originalData, setOriginalData] = useState<StaffProfileFormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (lifecycle?: { current: boolean }) => {
    const canUpdate = () => (lifecycle ? lifecycle.current : true);
    if (canUpdate()) {
      setLoading(true);
      setError(null);
    }

    try {
      const [profileResponse, detailsResponse] = await Promise.all([
        getStaffProfile().catch(() => null),
        getStaffDetails().catch(() => null)
      ]);

      if (!canUpdate()) return;

      const staff = profileResponse?.staff ?? null;

      const combinedStaffName = [staff?.firstName, staff?.lastName].filter(Boolean).join(' ');
      const name = detailsResponse?.name ?? (combinedStaffName || user?.name || '');

      const nextData: StaffProfileFormState = {
        name,
        phone: toStringValue(staff?.phone ?? user?.phone),
        email: toStringValue(staff?.email),
        address: toStringValue(staff?.address),
        idNumber: toStringValue(staff?.idNumber ?? staff?.nationalId),
        bankName: toStringValue(profileResponse?.bankName),
        accountNumber: toStringValue(profileResponse?.accountNumber),
        kraNumber: toStringValue(staff?.kra),
        nhifNumber: toStringValue(profileResponse?.nhif),
        emergencyName: toStringValue(staff?.nextOfKin),
        emergencyContact: toStringValue(staff?.nextOfKinPhone)
      };

      setFormData(nextData);
      setOriginalData(nextData);
    } catch (err) {
      if (!canUpdate()) return;
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      if (canUpdate()) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const lifecycle = { current: true };
    loadProfile(lifecycle);
    return () => {
      lifecycle.current = false;
    };
  }, [loadProfile]);

  const handleEdit = () => {
    if (loading) return;
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof StaffProfileFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (saving) return;
    const hasBankChanges =
      formData.bankName !== originalData.bankName ||
      formData.accountNumber !== originalData.accountNumber ||
      formData.nhifNumber !== originalData.nhifNumber ||
      formData.kraNumber !== originalData.kraNumber;

    if (!hasBankChanges) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateStaffDetails({
        bankName: formData.bankName || undefined,
        accountNumber: formData.accountNumber || undefined,
        nhif: formData.nhifNumber || undefined,
        kra: formData.kraNumber || undefined
      });
      toast.success('Profile updated successfully!');
      setOriginalData(formData);
      setIsEditing(false);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const personalFields = [
    { key: 'name', label: 'Full Name', icon: User, required: true, editable: false },
    { key: 'phone', label: 'Phone Number', icon: Phone, required: true, editable: false },
    { key: 'email', label: 'Email Address', icon: Mail, required: false, editable: false },
    { key: 'address', label: 'Home Address', icon: MapPin, required: false, editable: false },
    { key: 'idNumber', label: 'ID Number', icon: CreditCard, required: false, editable: false }
  ] as const;

  const bankingFields = [
    { key: 'bankName', label: 'Bank Name', icon: Building, required: true, editable: true },
    { key: 'accountNumber', label: 'Account Number', icon: CreditCard, required: true, editable: true },
    { key: 'kraNumber', label: 'KRA Number', icon: Building, required: false, editable: true },
    { key: 'nhifNumber', label: 'NHIF Number', icon: Building, required: false, editable: true }
  ] as const;

  const emergencyFields = [
    { key: 'emergencyName', label: 'Emergency Contact Name', icon: User, required: false, editable: false },
    { key: 'emergencyContact', label: 'Emergency Contact Phone', icon: Phone, required: false, editable: false }
  ] as const;

  const renderField = (field: typeof personalFields[number] | typeof bankingFields[number] | typeof emergencyFields[number]) => {
    const value = formData[field.key];
    const showInput = isEditing && field.editable;

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key} className="flex items-center space-x-2">
          <field.icon className="h-4 w-4 text-gray-500" />
          <span>{field.label}</span>
          {field.required && <span className="text-red-500">*</span>}
        </Label>
        {showInput ? (
          <Input
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="border-2 border-[var(--neon-turquoise)]/20 focus:border-[var(--neon-turquoise)]"
            required={field.required}
            disabled={saving}
          />
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-gray-900">{value || 'Not provided'}</p>
          </div>
        )}
      </div>
    );
  };

  const hasEditableChanges = useMemo(
    () =>
      formData.bankName !== originalData.bankName ||
      formData.accountNumber !== originalData.accountNumber ||
      formData.kraNumber !== originalData.kraNumber ||
      formData.nhifNumber !== originalData.nhifNumber,
    [formData, originalData]
  );

  if (loading) {
    return (
      <StaffLayout user={user} currentPage="staff/update" onNavigate={onNavigate} onLogout={onLogout}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      </StaffLayout>
    );
  }

  if (error) {
    return (
      <StaffLayout user={user} currentPage="staff/update" onNavigate={onNavigate} onLogout={onLogout}>
        <Card className="max-w-xl mx-auto mt-24">
          <CardHeader>
            <CardTitle>Unable to load profile</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onNavigate('staff/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => loadProfile()}>Retry</Button>
          </CardContent>
        </Card>
      </StaffLayout>
    );
  }

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
            <Badge variant={isEditing ? 'secondary' : 'default'} className="px-3 py-1">
              {isEditing ? 'Editing Mode' : 'View Mode'}
            </Badge>
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                disabled={saving}
                className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasEditableChanges}
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
            <CardDescription>Your basic personal details and identification</CardDescription>
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
              <span>Banking & Compliance Information</span>
            </CardTitle>
            <CardDescription>Ensure banking details are up to date for payroll processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CardDescription>Reference details for emergency communication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {emergencyFields.map(renderField)}
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
