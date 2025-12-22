import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAnyPermission, usePermission } from '../../context/AccessContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { 
  Users, 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { fetchAdminUsers, type AdminUserSummary } from '../../services/admin';

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
  const canDeleteMember = usePermission('MEMBERS:DELETE');
  const canManageRoles = usePermission('ADMIN:RBAC');
  const canUpdateMember = usePermission('MEMBERS:UPDATE');
  const canReadMembers = useAnyPermission(['MEMBERS:READ', 'MEMBERS:READ_SELF']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved'>('pending');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    console.log('Approving user:', userId);
    // Add approval logic here
  };

  const handleRejectUser = (userId: string) => {
    console.log('Rejecting user:', userId);
    // Add rejection logic here
  };

  const handleEditUser = (userId: string) => {
    onNavigate(`app/members/profiles/${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
    // Add deletion logic here
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canApproveMember && (
                                  <DropdownMenuItem onClick={() => handleApproveUser(pendingUser.id)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {canApproveMember && (
                                  <DropdownMenuItem
                                    onClick={() => handleRejectUser(pendingUser.id)}
                                    className="text-red-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onNavigate('app/members/approve')}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canUpdateMember && (
                                  <DropdownMenuItem onClick={() => handleEditUser(approvedUser.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                  </DropdownMenuItem>
                                )}
                                {canManageRoles && (
                                  <DropdownMenuItem onClick={() => onNavigate('app/members/roles')}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Manage Roles
                                  </DropdownMenuItem>
                                )}
                                {canDeleteMember && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(approvedUser.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
    </LayoutComponent>
  );
}
