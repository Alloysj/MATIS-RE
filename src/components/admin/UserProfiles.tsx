import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  fetchDashboardUsers,
  AdminUserSummary,
  AdminUserStatusCode
} from '../../services/admin';
import {
  Users,
  Building,
  UserCheck,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Car,
  PiggyBank,
  Calculator,
  RefreshCcw
} from 'lucide-react';

type StatusFilter = 'all' | AdminUserStatusCode;
type CategoryFilter = 'all' | 'Individual' | 'Corporate' | 'Cooperative';

const STATUS_LABELS: Record<AdminUserStatusCode, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive'
};

const getStatusBadge = (status: AdminUserStatusCode) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'INACTIVE':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatCurrency = (value: number | null | undefined) =>
  value != null ? `KSh ${value.toLocaleString('en-KE')}` : 'KSh 0';

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString() : '--';

export function UserProfiles({
  user,
  onNavigate,
  onLogout
}: {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}) {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);

  const loadUsers = async () => {
    setLoading(true);

    try {
      const response = await fetchDashboardUsers();
      setUsers(response.items);
      setSelectedUser(response.items[0] ?? null);
    } catch (err) {
      console.error('Failed to load user profiles', err);
      setUsers([]);
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>();
    users.forEach(item => {
      if (item.role?.name) uniqueRoles.add(item.role.name);
    });
    return ['all', ...Array.from(uniqueRoles)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return users.filter(item => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        (item.phone ?? '').toLowerCase().includes(search) ||
        (item.memberNumber ?? '').toLowerCase().includes(search);

      const matchesCategory =
        categoryFilter === 'all' ||
        item.profileCategoryLabel === categoryFilter;

      const matchesRole =
        roleFilter === 'all' ||
        item.role?.name === roleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        item.statusCode === statusFilter;

      return matchesSearch && matchesCategory && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, categoryFilter, roleFilter, statusFilter]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUser(null);
    } else if (!selectedUser || !filteredUsers.some(userItem => userItem.id === selectedUser.id)) {
      setSelectedUser(filteredUsers[0]);
    }
  }, [filteredUsers, selectedUser]);

  const profileStats = useMemo(() => {
    const categories: CategoryFilter[] = ['Individual', 'Corporate', 'Cooperative'];
    const totalMembers = users.length || 1;
    return categories.map(category => {
      const categoryUsers = users.filter(userItem => userItem.profileCategoryLabel === category);
      const count = categoryUsers.length;
      const shareCapital = categoryUsers.reduce((sum, userItem) => sum + (userItem.shareCapital ?? 0), 0);
      const savings = categoryUsers.reduce((sum, userItem) => sum + (userItem.savingsBalance ?? 0), 0);
      const loans = categoryUsers.reduce((sum, userItem) => sum + (userItem.loanBalance ?? 0), 0);
      return {
        category,
        count,
        percentage: Math.round((count / totalMembers) * 100),
        shareCapital,
        savings,
        loans
      };
    });
  }, [users]);

  const totals = useMemo(() => {
    const totalShareCapital = users.reduce((sum, item) => sum + (item.shareCapital ?? 0), 0);
    const totalSavings = users.reduce((sum, item) => sum + (item.savingsBalance ?? 0), 0);
    const totalLoans = users.reduce((sum, item) => sum + (item.loanBalance ?? 0), 0);
    const activeMembers = users.filter(item => item.statusCode === 'ACTIVE').length;
    const pendingMembers = users.filter(item => item.statusCode === 'PENDING').length;
    return {
      totalMembers: users.length,
      activeMembers,
      pendingMembers,
      totalShareCapital,
      totalSavings,
      totalLoans
    };
  }, [users]);

  if (loading) {
    return (
      <AdminLayout user={user} onNavigate={onNavigate} onLogout={onLogout} title="User Profiles">
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          Loading user profiles...
        </div>
      </AdminLayout>
    );
  }
  return (
    <AdminLayout user={user} onNavigate={onNavigate} onLogout={onLogout} title="User Profiles">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            title="Total Members"
            value={totals.totalMembers.toLocaleString()}
            detail={`${totals.activeMembers} active • ${totals.pendingMembers} pending`}
          />
          <StatCard
            icon={PiggyBank}
            title="Total Savings"
            value={formatCurrency(totals.totalSavings)}
            detail="Member savings balance"
          />
          <StatCard
            icon={Calculator}
            title="Outstanding Loans"
            value={formatCurrency(totals.totalLoans)}
            detail="Across all members"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle>Members Directory</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Filter className="h-4 w-4" />
                    <span>{filteredUsers.length} results</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option === 'all' ? 'All Roles' : option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredUsers.length === 0 && (
                    <Card>
                      <CardContent className="p-10 text-center text-gray-500">
                        No members match the selected filters.
                      </CardContent>
                    </Card>
                  )}
                  {filteredUsers.map(userItem => (
                    <UserListItem
                      key={userItem.id}
                      user={userItem}
                      active={selectedUser?.id === userItem.id}
                      onSelect={() => setSelectedUser(userItem)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Categories Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profileStats.map(stat => (
                  <div key={stat.category} className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{stat.category}</h3>
                      <Badge variant="outline">{stat.percentage}%</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{stat.count} members</p>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p>Share Capital: {formatCurrency(stat.shareCapital)}</p>
                      <p>Savings: {formatCurrency(stat.savings)}</p>
                      <p>Loans: {formatCurrency(stat.loans)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Member Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedUser ? (
                  <div className="text-center text-gray-500 py-12">
                    Select a member to view their full profile.
                  </div>
                ) : (
                  <>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
                        <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                          {selectedUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
                          <Badge className={getStatusBadge(selectedUser.statusCode)}>
                            {STATUS_LABELS[selectedUser.statusCode]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                        <p className="text-sm text-gray-500">{selectedUser.phone ?? 'No phone'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <DetailRow icon={UserCheck} label="Role" value={selectedUser.role?.name ?? 'Unassigned'} />
                      <DetailRow icon={Building} label="Category" value={selectedUser.profileCategoryLabel ?? '—'} />
                      <DetailRow icon={Calendar} label="Registered" value={formatDate(selectedUser.registrationDate)} />
                      <DetailRow icon={MapPin} label="Membership Type" value={selectedUser.membershipTypeLabel ?? '—'} />
                      <DetailRow icon={CreditCard} label="Member No." value={selectedUser.memberNumber ?? '—'} />
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Financial Summary</h3>
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                        <FinancialTile label="Share Capital" value={formatCurrency(selectedUser.shareCapital)} />
                        <FinancialTile label="Savings" value={formatCurrency(selectedUser.savingsBalance)} />
                        <FinancialTile label="Loan Balance" value={formatCurrency(selectedUser.loanBalance)} />
                        <FinancialTile label="Total Deposits" value={formatCurrency(selectedUser.totalDeposits)} />
                      </div>
                    </div>

                    {selectedUser.vehicles.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Vehicles</h3>
                        <div className="space-y-3">
                          {selectedUser.vehicles.map(vehicle => (
                            <div key={vehicle.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Car className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</p>
                                  <p className="text-xs text-gray-500">
                                    {[vehicle.model, vehicle.year?.toString()].filter(Boolean).join(' • ') || '—'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">{vehicle.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const StatCard = ({
  icon: Icon,
  title,
  value,
  detail
}: {
  icon: typeof Users;
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

const UserListItem = ({
  user,
  active,
  onSelect
}: {
  user: AdminUserSummary;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full text-left border rounded-lg p-4 transition ${
      active ? 'border-[var(--neon-turquoise)] bg-[var(--neon-turquoise)]/5 shadow-sm' : 'border-gray-200 hover:border-[var(--neon-turquoise)]'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center space-x-2">
          <p className="font-medium text-gray-900">{user.name}</p>
          <Badge className={getStatusBadge(user.statusCode)}>
            {STATUS_LABELS[user.statusCode]}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">{user.email}</p>
        <p className="text-xs text-gray-400">
          {user.role?.name ?? 'Unassigned'} • {user.profileCategoryLabel ?? '—'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{formatCurrency(user.savingsBalance)}</p>
        <p className="text-xs text-gray-400">Savings</p>
      </div>
    </div>
  </button>
);

const DetailRow = ({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) => (
  <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
    <Icon className="h-4 w-4 text-gray-400" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const FinancialTile = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-semibold text-gray-900">{value}</p>
  </div>
);





