import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  MessageCircle,
  CreditCard,
  PiggyBank,
  Calculator,
  TrendingUp,
  Car,
  Search,
  Shield,
} from 'lucide-react';
import {
  fetchAdminUsers,
  fetchAdminUserDetail,
  type AdminUserSummary,
} from '../../services/admin';

interface UserProfilesProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  selectedUserId?: string;
  LayoutComponent?: ComponentType<UserProfilesLayoutProps>;
  currentPage?: string;
}

interface UserProfilesLayoutProps {
  children: ReactNode;
  user: { name: string; role: string; phone: string } | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type AdminUserDetail = AdminUserSummary & {
  address?: string | null;
  county?: string | null;
  town?: string | null;
  occupation?: string | null;
  nextOfKin?: string | null;
  nextOfKinPhone?: string | null;
  dateOfBirth?: string | null;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'An unexpected error occurred while loading data.';

const getProfileCategory = (user: AdminUserSummary) =>
  user.profileCategoryLabel ?? user.profileCategory ?? 'Unknown';

const getRoleName = (user: AdminUserSummary) => user.role?.name ?? 'Unassigned';

const getStatusLabel = (user: AdminUserSummary) => user.status ?? user.statusCode;

const formatCurrency = (value: number | null | undefined) =>
  `KSh ${Number(value ?? 0).toLocaleString()}`;

const formatDate = (value?: string | null) => {
  if (!value) return 'Not provided';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const [date] = value.split('T');
    return date || value;
  }
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const calculateAge = (value?: string | null) => {
  if (!value) return 'N/A';
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) {
    return 'N/A';
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return `${age}`;
};

export function UserProfiles({
  user,
  onNavigate,
  onLogout,
  selectedUserId,
  LayoutComponent = AdminLayout,
  currentPage = 'app/members/profiles'
}: UserProfilesProps) {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);
  const [selectedUserError, setSelectedUserError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await fetchAdminUsers();
        if (!isMounted) return;
        setUsers(response.items ?? []);
        setUsersError(null);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load users', error);
          setUsers([]);
          setUsersError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUser(null);
      setSelectedUserLoading(false);
      setSelectedUserError(null);
      return;
    }

    let isMounted = true;
    const candidate = users.find((item) => item.id === selectedUserId);
    if (candidate) {
      setSelectedUser(candidate as AdminUserDetail);
    }

    const loadDetail = async () => {
      setSelectedUserLoading(true);
      try {
        const detail = await fetchAdminUserDetail(selectedUserId);
        if (isMounted) {
          setSelectedUser(detail as AdminUserDetail);
          setSelectedUserError(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load user detail', error);
          setSelectedUserError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setSelectedUserLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedUserId, users]);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return users.filter((candidate) => {
      if (!search) {
        return true;
      }
      const values = [
        candidate.name,
        candidate.email ?? '',
        candidate.phone ?? '',
        candidate.memberNumber ?? '',
        candidate.idNumber ?? '',
      ];
      return values.some((value) => value.toLowerCase().includes(search));
    });
  }, [users, searchTerm]);

  if (selectedUserId) {
    if (selectedUserLoading) {
      return (
        <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
          <Card>
            <CardContent className="p-10 text-center text-gray-600">Loading user profile...</CardContent>
          </Card>
        </LayoutComponent>
      );
    }

    if (selectedUserError) {
      return (
        <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
          <Card>
            <CardContent className="p-10 space-y-4 text-center">
              <p className="text-red-600 font-semibold">Failed to load user profile</p>
              <p className="text-sm text-gray-600">{selectedUserError}</p>
              <Button variant="outline" onClick={() => onNavigate('app/members')}>
                Return to User Management
              </Button>
            </CardContent>
          </Card>
        </LayoutComponent>
      );
    }

    if (!selectedUser) {
      return (
        <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
          <Card>
            <CardContent className="p-10 space-y-4 text-center">
              <p className="text-lg font-semibold text-gray-900">User not found</p>
              <p className="text-sm text-gray-600">
                We could not find the member you were looking for. They may have been removed or the link may be
                outdated.
              </p>
              <Button variant="outline" onClick={() => onNavigate('app/members')}>
                Return to User Management
              </Button>
            </CardContent>
          </Card>
        </LayoutComponent>
      );
    }

    const statusLabel = getStatusLabel(selectedUser);
    const categoryLabel = getProfileCategory(selectedUser);
    const roleName = getRoleName(selectedUser);
    const memberNumber = selectedUser.memberNumber ?? 'N/A';
    const shareCapital = selectedUser.shareCapital ?? selectedUser.metrics?.shareCapital ?? 0;
    const savingsBalance = selectedUser.savingsBalance ?? selectedUser.metrics?.savingsBalance ?? 0;
    const loanBalance = selectedUser.loanBalance ?? selectedUser.metrics?.loanBalance ?? 0;
    const totalDeposits = selectedUser.totalDeposits ?? selectedUser.metrics?.totalDeposits ?? 0;
    const nextOfKin = (selectedUser as AdminUserDetail).nextOfKin ?? 'Not provided';
    const nextOfKinPhone = (selectedUser as AdminUserDetail).nextOfKinPhone ?? 'Not provided';
    const occupation = (selectedUser as AdminUserDetail).occupation ?? 'Not provided';
    const address = (selectedUser as AdminUserDetail).address ?? 'Not provided';
    const dateOfBirth = (selectedUser as AdminUserDetail).dateOfBirth;
    const vehicles =
      (selectedUser.vehicles && selectedUser.vehicles.length > 0
        ? selectedUser.vehicles
        : selectedUser.vehiclesOwned?.items) ?? [];

    const vehicleStatusClass = (value: string) => {
      const normalized = value.toLowerCase();
      if (normalized === 'active') return 'bg-green-100 text-green-800';
      if (normalized === 'pending' || normalized === 'maintenance') return 'bg-yellow-100 text-yellow-800';
      if (normalized === 'inactive' || normalized === 'decommissioned') return 'bg-red-100 text-red-800';
      return 'bg-gray-100 text-gray-800';
    };

    return (
      <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => onNavigate('app/members')} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to User Management</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile Details</h1>
              <p className="text-gray-600">Comprehensive member information</p>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-purple)]/10 border-l-4 border-l-[var(--neon-turquoise)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-[var(--neon-turquoise)]">
                    <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-bold text-lg">
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <Badge className={getStatusColor(statusLabel)}>{statusLabel}</Badge>
                      <Badge variant="outline">{roleName}</Badge>
                      <Badge variant="outline">{categoryLabel}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Member #{memberNumber}</p>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] hover:opacity-90"
                  onClick={() => alert(`Message feature would open for ${selectedUser.name}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">National ID</p>
                  <p className="text-gray-900">{selectedUser.idNumber ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date of Birth</p>
                  <p className="text-gray-900">
                    {formatDate(dateOfBirth)} {dateOfBirth ? `(${calculateAge(dateOfBirth)} years old)` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Occupation</p>
                  <p className="text-gray-900">{occupation}</p>
                </div>
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="text-gray-900">{address}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-900">{selectedUser.phone ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900">{selectedUser.email ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Next of Kin</p>
                  <p className="text-gray-900">{nextOfKin}</p>
                </div>
                <div>
                  <p className="text-gray-500">Next of Kin Phone</p>
                  <p className="text-gray-900">{nextOfKinPhone}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Membership Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="text-gray-900">{formatDate(selectedUser.registrationDate ?? selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Login</p>
                  <p className="text-gray-900">
                    {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="text-gray-900">{roleName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Permissions</p>
                  <p className="text-gray-900">
                    {selectedUser.permissions.length > 0
                      ? selectedUser.permissions.join(', ')
                      : 'No permissions assigned'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Share Capital</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(shareCapital)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Savings Balance</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(savingsBalance)}</p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Loan Balance</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(loanBalance)}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalDeposits)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {vehicles.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Registered Vehicles ({vehicles.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{vehicle.plateNumber}</h4>
                        <Badge className={vehicleStatusClass(vehicle.status)}>{vehicle.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Model:</span>{' '}
                          {vehicle.model || 'Not provided'}{' '}
                          {vehicle.year ? `(${vehicle.year})` : ''}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{' '}
                          {vehicle.vehicleType || 'Not provided'}
                        </p>
                        <p>
                          <span className="font-medium">Route:</span>{' '}
                          {vehicle.route?.name ||
                            [vehicle.route?.startPoint, vehicle.route?.endPoint]
                              .filter(Boolean)
                              .join(' - ') ||
                            'Not assigned'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Registered Vehicles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Vehicles Registered</h3>
                <p className="text-gray-500">This member has not registered any vehicles yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profiles</h1>
          <p className="text-gray-600">
            Browse members and open a profile to view detailed information.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members by name, email, phone, or member number..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {usersLoading ? (
          <Card>
            <CardContent className="p-10 text-center text-gray-600">Loading users...</CardContent>
          </Card>
        ) : usersError ? (
          <Card>
            <CardContent className="p-10 space-y-4 text-center">
              <p className="text-red-600 font-semibold">Failed to load users</p>
              <p className="text-sm text-gray-600">{usersError}</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Users className="h-12 w-12 text-gray-300 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-900">No members found</p>
                <p className="text-sm text-gray-600">Try a different search term.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredUsers.map((candidate) => {
              const statusLabel = getStatusLabel(candidate);
              const categoryLabel = getProfileCategory(candidate);
              const roleName = getRoleName(candidate);
              const vehicleCount =
                candidate.vehicles?.length ?? candidate.vehiclesOwned?.count ?? 0;

              return (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
                        <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                          {candidate.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                            <Badge className={getStatusColor(statusLabel)}>{statusLabel}</Badge>
                          </div>
                          <Badge variant="outline">{categoryLabel}</Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {(candidate.memberNumber ?? 'N/A')} • {roleName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{candidate.phone ?? 'Not provided'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{candidate.email ?? 'Not provided'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{(candidate as AdminUserDetail).address ?? 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
                          <div className="flex gap-4">
                            <span>
                              Share Capital: {formatCurrency(candidate.shareCapital ?? candidate.metrics?.shareCapital ?? 0)}
                            </span>
                            <span>
                              Savings: {formatCurrency(candidate.savingsBalance ?? candidate.metrics?.savingsBalance ?? 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-3">
                            {vehicleCount > 0 && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Car className="h-3 w-3" />
                                {vehicleCount} vehicle{vehicleCount === 1 ? '' : 's'}
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigate(`app/members/profiles/${candidate.id}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </LayoutComponent>
  );
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
