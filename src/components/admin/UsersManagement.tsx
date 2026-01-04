import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAnyPermission, usePermission } from '../../context/AccessContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { RowActionsMenu } from '../auth/RowActionsMenu';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { approveAdminUser, fetchAdminUsers, fetchRoles, setAdminUserStatus, type AdminRole, type AdminUserSummary } from '../../services/admin';

interface UsersManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<UsersLayoutProps>;
  currentPage?: string;
}

interface UsersLayoutProps {
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

export function UsersManagement({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'app/members'
}: UsersManagementProps) {
  const canCreateMember = usePermission('MEMBERS:CREATE');
  const canApproveMember = usePermission('MEMBERS:APPROVE');
  const canManageRoles = usePermission('ADMIN:RBAC');
  const canReadMembers = useAnyPermission(['MEMBERS:READ', 'MEMBERS:READ_SELF']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved'>('pending');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveUser, setApproveUser] = useState<AdminUserSummary | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const response = await fetchAdminUsers();
        if (!isMounted) return;
        setUsers(response.items ?? []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load users', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await fetchRoles();
        if (isMounted) {
          setRoles(response);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load roles', err);
          setRoles([]);
        }
      } finally {
        if (isMounted) {
          setRolesLoading(false);
        }
      }
    };
    loadRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  const matchesSearch = (candidate: AdminUserSummary, term: string) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      candidate.name,
      candidate.email,
      candidate.phone ?? '',
      candidate.memberNumber ?? '',
      candidate.idNumber ?? '',
      candidate.role?.name ?? '',
      candidate.status ?? ''
    ];

    return fields.some(field => field.toLowerCase().includes(query));
  };

  const pendingUsers = useMemo(
    () => users.filter((item) => item.statusCode === 'PENDING'),
    [users]
  );

  const approvedUsers = useMemo(
    () => users.filter((item) => item.statusCode !== 'PENDING'),
    [users]
  );

  const filteredPendingUsers = useMemo(
    () => pendingUsers.filter((item) => matchesSearch(item, searchTerm)),
    [pendingUsers, searchTerm]
  );

  const filteredApprovedUsers = useMemo(
    () => approvedUsers.filter((item) => matchesSearch(item, searchTerm)),
    [approvedUsers, searchTerm]
  );

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      const [datePart] = value.split('T');
      return datePart || value;
    }
    return parsed.toLocaleDateString();
  };

  const getRoleName = (candidate: AdminUserSummary) => candidate.role?.name ?? 'Unassigned';

  const getStatusVariant = (statusCode: string) => {
    switch (statusCode) {
      case 'ACTIVE':
        return 'default' as const;
      case 'PENDING':
        return 'secondary' as const;
      case 'SUSPENDED':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getAdditionalInfo = (candidate: AdminUserSummary) => {
    const details: string[] = [];
    const vehicleCount = candidate.vehiclesOwned?.count ?? candidate.vehicles.length;
    if (vehicleCount) {
      details.push(`${vehicleCount} vehicle${vehicleCount === 1 ? '' : 's'}`);
    }
    if (candidate.membershipTypeLabel) {
      details.push(candidate.membershipTypeLabel);
    }
    if (candidate.profileCategoryLabel) {
      details.push(candidate.profileCategoryLabel);
    }
    return details.length > 0 ? details.join(' | ') : 'N/A';
  };

  const handleApproveUser = (userId: string) => {
    const target = users.find((item) => item.id === userId) ?? null;
    if (!target) return;
    setApproveUser(target);
    setSelectedRoleId(target.roleId ?? null);
    setApproveDialogOpen(true);
  };

  const confirmApproveUser = async () => {
    if (!approveUser || !selectedRoleId) return;
    setActionInFlight(true);
    try {
      const updated = await approveAdminUser(approveUser.id, selectedRoleId);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setApproveDialogOpen(false);
      setApproveUser(null);
    } catch (err) {
      console.error('Failed to approve user', err);
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setActionInFlight(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionInFlight(true);
    try {
      const updated = await setAdminUserStatus(userId, 'SUSPENDED');
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      console.error('Failed to reject user', err);
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    } finally {
      setActionInFlight(false);
    }
  };

  const handleEditUser = (userId: string) => {
    onNavigate(`app/members/profiles/${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
    // Add deletion logic here
  };

  const closeApproveDialog = () => {
    setApproveDialogOpen(false);
    setApproveUser(null);
  };

  // const filteredPendingUsers = pendingUsers.filter(user =>
  //   user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   user.email.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // const filteredApprovedUsers = approvedUsers.filter(user =>
  //   user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   user.email.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <LayoutComponent
      user={user}
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">Manage user registrations and accounts</p>
          </div>
          {canCreateMember && (
            <Button 
              onClick={() => onNavigate('app/members/create')}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90"
            >
              <Users className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {canApproveMember && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('app/members/approve')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Approve Users</h3>
                  <p className="text-sm text-gray-600">Review pending registrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {canManageRoles && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('app/members/roles')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">User Roles</h3>
                  <p className="text-sm text-gray-600">Manage roles & permissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {canCreateMember && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('app/members/create')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create User</h3>
                  <p className="text-sm text-gray-600">Add new SACCO member</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {canReadMembers && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('app/members/profiles')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">User Profiles</h3>
                  <p className="text-sm text-gray-600">View member categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={selectedTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('pending')}
              className={selectedTab === 'pending' ? 'bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-black hover:opacity-90' : ''}
            >
              Pending ({pendingUsers.length})
            </Button>
            <Button
              variant={selectedTab === 'approved' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('approved')}
              className={selectedTab === 'approved' ? 'bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90' : ''}
            >
              Approved ({approvedUsers.length})
            </Button>
          </div>
        </div>

        {/* Pending Users Table */}
        {selectedTab === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-yellow-600" />
                <span>Pending User Registrations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading users...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">{error}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Info</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Date Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingUsers.map((pendingUser) => (
                        <TableRow key={pendingUser.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{pendingUser.name}</p>
                              <p className="text-sm text-gray-500">
                                {pendingUser.memberNumber || pendingUser.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {pendingUser.email || 'N/A'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {pendingUser.phone || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleName(pendingUser)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDisplayDate(pendingUser.registrationDate ?? pendingUser.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(pendingUser.statusCode)}>
                              {pendingUser.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <RowActionsMenu
                              actions={[
                                {
                                  key: 'approve',
                                  label: 'Approve',
                                  onClick: () => handleApproveUser(pendingUser.id),
                                  icon: <UserCheck className="h-4 w-4" />,
                                  requiredPermissions: { anyOf: ['MEMBERS:APPROVE'] }
                                },
                                {
                                  key: 'reject',
                                  label: 'Reject',
                                  onClick: () => handleRejectUser(pendingUser.id),
                                  icon: <UserX className="h-4 w-4" />,
                                  requiredPermissions: { anyOf: ['MEMBERS:APPROVE'] }
                                },
                                {
                                  key: 'details',
                                  label: 'View Details',
                                  onClick: () => onNavigate('app/members/approve'),
                                  icon: <Edit className="h-4 w-4" />,
                                  requiredPermissions: { anyOf: ['MEMBERS:APPROVE'] }
                                }
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredPendingUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No pending users found</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approved Users Table */}
        {selectedTab === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Approved Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading users...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-600">{error}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Info</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Date Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Additional Info</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApprovedUsers.map((approvedUser) => (
                        <TableRow key={approvedUser.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{approvedUser.name}</p>
                              <p className="text-sm text-gray-500">
                                {approvedUser.memberNumber || approvedUser.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {approvedUser.email || 'N/A'}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {approvedUser.phone || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleName(approvedUser)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDisplayDate(approvedUser.registrationDate ?? approvedUser.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(approvedUser.statusCode)}>
                              {approvedUser.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">{getAdditionalInfo(approvedUser)}</div>
                          </TableCell>
                          <TableCell>
                            <RowActionsMenu
                              actions={[
                                {
                                  key: 'edit',
                                  label: 'Edit Profile',
                                  onClick: () => handleEditUser(approvedUser.id),
                                  icon: <Edit className="h-4 w-4" />,
                                  requiredPermissions: { anyOf: ['MEMBERS:UPDATE'] }
                                },
                                {
                                  key: 'roles',
                                  label: 'Manage Roles',
                                  onClick: () => onNavigate('app/members/roles'),
                                  icon: <UserCheck className="h-4 w-4" />,
                                  requiredPermissions: { anyOf: ['ADMIN:RBAC'] }
                                },
                                {
                                  key: 'delete',
                                  label: 'Delete User',
                                  onClick: () => handleDeleteUser(approvedUser.id),
                                  icon: <Trash2 className="h-4 w-4" />,
                                  requiredPermissions: { anyOf: ['MEMBERS:DELETE'] }
                                }
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredApprovedUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No approved users found</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Member</DialogTitle>
            <DialogDescription>
              Assign a role before approving this member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {approveUser?.name}
            </div>
            <Select
              value={selectedRoleId ?? undefined}
              onValueChange={(value) => setSelectedRoleId(value)}
              disabled={rolesLoading || actionInFlight}
            >
              <SelectTrigger>
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
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeApproveDialog} disabled={actionInFlight}>
                Cancel
              </Button>
              <Button
                onClick={confirmApproveUser}
                disabled={!selectedRoleId || actionInFlight}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutComponent>
  );
}
