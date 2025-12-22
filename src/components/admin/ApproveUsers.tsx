import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  fetchDashboardUsers,
  approveAdminUser,
  setAdminUserStatus,
  fetchRoles,
  AdminUserSummary,
  AdminUserStatusCode,
  AdminRole
} from '../../services/admin';
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User as UserIcon,
  Car,
  RefreshCcw
} from 'lucide-react';

interface ApproveUsersProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<ApproveUsersLayoutProps>;
  currentPage?: string;
}

interface ApproveUsersLayoutProps {
  children: ReactNode;
  user: { name: string; role: string; phone: string } | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

type StatusFilter = 'all' | AdminUserStatusCode;

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

const getVehicleStatusBadge = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Inactive':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Decommissioned':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatCurrency = (value: number | null | undefined) =>
  value != null ? `KSh ${value.toLocaleString('en-KE')}` : 'KSh 0';

export function ApproveUsers({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/users/approve'
}: ApproveUsersProps) {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSelections, setRoleSelections] = useState<Record<string, string | null>>({});

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchDashboardUsers();
      setUsers(response.items);
      setRoleSelections(prev => {
        const next: Record<string, string | null> = {};
        response.items.forEach(item => {
          next[item.id] = prev[item.id] ?? item.roleId ?? null;
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load admin users list', err);
      setUsers([]);
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const loadRolesList = async () => {
      setRolesLoading(true);
      try {
        const response = await fetchRoles();
        setRoles(response);
      } catch (err) {
        console.error('Failed to load roles list', err);
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };

    loadRolesList();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter(item => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        (item.phone ?? '').toLowerCase().includes(normalizedSearch) ||
        (item.memberNumber ?? '').toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || item.statusCode === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const handleRoleSelection = (userId: string, roleId: string) => {
    setRoleSelections(prev => ({ ...prev, [userId]: roleId }));
  };
  const resolveRoleName = (roleId: string | null) => {
    if (!roleId) return 'Unassigned';
    const match = roles.find(role => role.id === roleId);
    return match ? match.name : 'Unassigned';
  };

  const selectedUserRoleId = selectedUser ? roleSelections[selectedUser.id] ?? selectedUser.roleId ?? null : null;

  const groupedUsers = useMemo(() => {
    const pending = filteredUsers.filter(userItem => userItem.statusCode === 'PENDING');
    const active = filteredUsers.filter(userItem => userItem.statusCode === 'ACTIVE');
    const suspended = filteredUsers.filter(userItem => userItem.statusCode === 'SUSPENDED');
    const inactive = filteredUsers.filter(userItem => userItem.statusCode === 'INACTIVE');
    return { pending, active, suspended, inactive };
  }, [filteredUsers]);

  const handleApproveUser = async (userId: string) => {
    const roleId = roleSelections[userId];
    if (!roleId) {
      console.warn('Select a role before approving this user');
      return;
    }
    setActionInFlight(userId);
    try {
      const updated = await approveAdminUser(userId, roleId);
      setUsers(prev => prev.map(item => (item.id === userId ? updated : item)));
      setRoleSelections(prev => ({ ...prev, [userId]: updated.roleId ?? roleId }));
      if (selectedUser?.id === userId) {
        setSelectedUser(updated);
      }
    } catch (err) {
      console.error('Failed to approve user', err);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleSuspendUser = async (userId: string, targetStatus: AdminUserStatusCode) => {
    setActionInFlight(userId);
    try {
      const updated = await setAdminUserStatus(userId, targetStatus);
      setUsers(prev => prev.map(item => (item.id === userId ? updated : item)));
      if (selectedUser?.id === userId) {
        setSelectedUser(updated);
      }
    } catch (err) {
      console.error('Failed to update user status', err);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleViewDetails = (userItem: AdminUserSummary) => {
    setSelectedUser(userItem);
    setShowDetailsDialog(true);
  };

  const StatusLegend = (
    <div className="flex items-center space-x-3 text-sm text-gray-500">
      <Filter className="h-4 w-4" />
      <span>{filteredUsers.length} users</span>
      {statusFilter !== 'all' && <span>• {STATUS_LABELS[statusFilter]} selected</span>}
    </div>
  );

  if (loading) {
    return (
      <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          Loading users...
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Member Approvals</CardTitle>
              {StatusLegend}
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

              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadUsers} className="flex items-center space-x-2">
                <RefreshCcw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Users */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            <Badge variant="secondary">{groupedUsers.pending.length} pending</Badge>
          </div>
          <div className="grid gap-4">
            {groupedUsers.pending.map((userItem) => (
              <UserCard
                key={userItem.id}
                user={userItem}
                onApprove={() => handleApproveUser(userItem.id)}
                onReject={() => handleSuspendUser(userItem.id, 'SUSPENDED')}
                onView={() => handleViewDetails(userItem)}
                actionInFlight={actionInFlight === userItem.id}
                roles={roles}
                roleLoading={rolesLoading}
                selectedRoleId={roleSelections[userItem.id] ?? null}
                onRoleChange={(value) => handleRoleSelection(userItem.id, value)}
                disableApprove={!roleSelections[userItem.id]}
              />
            ))}
            {groupedUsers.pending.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No pending users match the selected filters.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Active Users */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Active Members</h2>
            <Badge variant="outline">{groupedUsers.active.length} active</Badge>
          </div>
          <div className="grid gap-4">
            {groupedUsers.active.map((userItem) => (
              <UserCard
                key={userItem.id}
                user={userItem}
                onReject={() => handleSuspendUser(userItem.id, 'SUSPENDED')}
                onView={() => handleViewDetails(userItem)}
                actionInFlight={actionInFlight === userItem.id}
                showApprove={false}
                rejectLabel="Suspend"
              />
            ))}
            {groupedUsers.active.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No active users match the selected filters.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Suspended Users */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Suspended Members</h2>
            <Badge variant="destructive">{groupedUsers.suspended.length} suspended</Badge>
          </div>
          <div className="grid gap-4">
            {groupedUsers.suspended.map((userItem) => (
              <UserCard
                key={userItem.id}
                user={userItem}
                onApprove={() => handleApproveUser(userItem.id)}
                onReject={() => handleSuspendUser(userItem.id, 'INACTIVE')}
                onView={() => handleViewDetails(userItem)}
                actionInFlight={actionInFlight === userItem.id}
                rejectLabel="Mark Inactive"
                roles={roles}
                roleLoading={rolesLoading}
                selectedRoleId={roleSelections[userItem.id] ?? null}
                onRoleChange={(value) => handleRoleSelection(userItem.id, value)}
                disableApprove={!roleSelections[userItem.id]}
              />
            ))}
            {groupedUsers.suspended.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No suspended users match the selected filters.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Inactive Users */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Inactive Members</h2>
            <Badge variant="outline">{groupedUsers.inactive.length} inactive</Badge>
          </div>
          <div className="grid gap-4">
            {groupedUsers.inactive.map((userItem) => (
              <UserCard
                key={userItem.id}
                user={userItem}
                onApprove={() => handleSuspendUser(userItem.id, 'ACTIVE')}
                onView={() => handleViewDetails(userItem)}
                actionInFlight={actionInFlight === userItem.id}
                showReject={false}
                approveLabel="Reactivate"
              />
            ))}
            {groupedUsers.inactive.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No inactive users match the selected filters.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Review the member profile, financials and vehicles.</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
                      <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                        {selectedUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h2>
                        <Badge className={getStatusBadge(selectedUser.statusCode)}>
                          {STATUS_LABELS[selectedUser.statusCode]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      <p className="text-sm text-gray-500">{selectedUser.phone ?? 'No phone provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={UserIcon} label="Member Number" value={selectedUser.memberNumber ?? '•'} />
                  <InfoRow icon={Phone} label="Phone" value={selectedUser.phone ?? '•'} />
                  <InfoRow icon={Mail} label="Email" value={selectedUser.email} />
                  <InfoRow
                    icon={Calendar}
                    label="Registered"
                    value={selectedUser.registrationDate ? new Date(selectedUser.registrationDate).toLocaleDateString() : '•'}
                  />
                  <InfoRow icon={MapPin} label="Profile Category" value={selectedUser.profileCategoryLabel ?? '•'} />
                  <InfoRow icon={UserIcon} label="Role" value={resolveRoleName(selectedUserRoleId)} />
                </div>

                {roles.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Role Assignment</h3>
                    <Select
                      value={selectedUserRoleId ?? undefined}
                      onValueChange={(value) => handleRoleSelection(selectedUser.id, value)}
                      disabled={rolesLoading}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Assign role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Financial Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatTile label="Share Capital" value={formatCurrency(selectedUser.shareCapital)} />
                    <StatTile label="Savings" value={formatCurrency(selectedUser.savingsBalance)} />
                    <StatTile label="Loan Balance" value={formatCurrency(selectedUser.loanBalance)} />
                    <StatTile label="Total Deposits" value={formatCurrency(selectedUser.totalDeposits)} />
                  </div>
                </div>

                {selectedUser.vehicles.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Vehicles</h3>
                    <div className="space-y-3">
                      {selectedUser.vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Car className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{vehicle.plateNumber}</p>
                                <p className="text-sm text-gray-600">
                                  {[vehicle.model, vehicle.year?.toString()].filter(Boolean).join(' • ') || '•'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{vehicle.route?.name ?? 'Unassigned route'}</p>
                              <Badge className={getVehicleStatusBadge(vehicle.status)}>
                                {vehicle.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  {selectedUser.statusCode === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleApproveUser(selectedUser.id)}
                        disabled={actionInFlight === selectedUser.id || !selectedUserRoleId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve User
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleSuspendUser(selectedUser.id, 'SUSPENDED')}
                        disabled={actionInFlight === selectedUser.id}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject User
                      </Button>
                    </>
                  )}

                  {selectedUser.statusCode === 'ACTIVE' && (
                    <Button
                      variant="destructive"
                      onClick={() => handleSuspendUser(selectedUser.id, 'SUSPENDED')}
                      disabled={actionInFlight === selectedUser.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend User
                    </Button>
                  )}

                  {selectedUser.statusCode === 'SUSPENDED' && (
                    <Button
                      onClick={() => handleApproveUser(selectedUser.id)}
                      disabled={actionInFlight === selectedUser.id || !selectedUserRoleId}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reactivate User
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutComponent>
  );
}

interface UserCardProps {
  user: AdminUserSummary;
  onApprove?: () => void;
  onReject?: () => void;
  onView: () => void;
  actionInFlight: boolean;
  showApprove?: boolean;
  showReject?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  roles?: AdminRole[];
  selectedRoleId?: string | null;
  onRoleChange?: (roleId: string) => void;
  roleLoading?: boolean;
  disableApprove?: boolean;
}

const UserCard = ({
  user,
  onApprove,
  onReject,
  onView,
  actionInFlight,
  showApprove = true,
  showReject = true,
  approveLabel = 'Approve',
  rejectLabel = 'Reject',
  roles,
  selectedRoleId = null,
  onRoleChange,
  roleLoading = false,
  disableApprove = false
}: UserCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
            <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <Badge className={getStatusBadge(user.statusCode)}>
                {STATUS_LABELS[user.statusCode]}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4" />
                <span>{user.memberNumber ?? 'Not assigned'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{user.phone ?? 'No phone'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Registered: {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : '•'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          {roles && onRoleChange && (
            <Select
              value={selectedRoleId ?? undefined}
              onValueChange={onRoleChange}
              disabled={roleLoading || actionInFlight}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Assign role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            onClick={onView}
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          {showApprove && onApprove && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              onClick={onApprove}
              disabled={actionInFlight || disableApprove}
            >
              <CheckCircle className="h-4 w-4" />
              <span>{approveLabel}</span>
            </Button>
          )}
          {showReject && onReject && (
            <Button
              size="sm"
              variant="destructive"
              className="flex items-center space-x-2"
              onClick={onReject}
              disabled={actionInFlight}
            >
              <XCircle className="h-4 w-4" />
              <span>{rejectLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const InfoRow = ({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserIcon;
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

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 p-3 rounded-lg">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);










