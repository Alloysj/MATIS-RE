import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { UserDataService, User } from '../../services/userData';
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
  FileText
} from 'lucide-react';

interface ApproveUsersProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ApproveUsers({ user, onNavigate, onLogout }: ApproveUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    // Load users data
    const allUsers = UserDataService.getAllUsers();
    setUsers(allUsers);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.memberNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingUsers = filteredUsers.filter(user => user.status === 'Pending');
  const approvedUsers = filteredUsers.filter(user => user.status === 'Active');
  const suspendedUsers = filteredUsers.filter(user => user.status === 'Suspended');

  const handleApproveUser = (userId: string) => {
    const updatedUser = UserDataService.approveUser(userId);
    if (updatedUser) {
      setUsers(UserDataService.getAllUsers());
    }
  };

  const handleSuspendUser = (userId: string) => {
    const updatedUser = UserDataService.suspendUser(userId);
    if (updatedUser) {
      setUsers(UserDataService.getAllUsers());
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const UserCard = ({ user }: { user: User }) => (
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
                <Badge className={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.memberNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Registered: {new Date(user.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(user)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {user.status === 'Pending' && (
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  onClick={() => handleApproveUser(user.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleSuspendUser(user.id)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
            
            {user.status === 'Active' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleSuspendUser(user.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Suspend
              </Button>
            )}
            
            {user.status === 'Suspended' && (
              <Button
                size="sm"
                onClick={() => handleApproveUser(user.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout user={user} currentPage="admin/users/approve" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Approvals</h1>
          <p className="text-gray-600">Review and approve new member registrations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Users</p>
                  <p className="text-2xl font-bold text-green-600">{approvedUsers.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspended Users</p>
                  <p className="text-2xl font-bold text-red-600">{suspendedUsers.length}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, or member number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
          
          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                View comprehensive information about this user including personal details, financial status, and vehicles.
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Number</label>
                    <p className="text-sm text-gray-900">{selectedUser.memberNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                    <p className="text-sm text-gray-900">{selectedUser.idNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>

                {/* Financial Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Financial Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Share Capital</p>
                      <p className="font-semibold">KSh {selectedUser.shareCapital.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Savings</p>
                      <p className="font-semibold">KSh {selectedUser.savingsBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Loan Balance</p>
                      <p className="font-semibold">KSh {selectedUser.loanBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Deposits</p>
                      <p className="font-semibold">KSh {selectedUser.totalDeposits.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicles (if applicable) */}
                {selectedUser.vehicles && selectedUser.vehicles.length > 0 && (
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
                                <p className="text-sm text-gray-600">{vehicle.model} ({vehicle.year})</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{vehicle.route}</p>
                              <Badge className={getStatusColor(vehicle.status as any)}>
                                {vehicle.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  {selectedUser.status === 'Pending' && (
                    <>
                      <Button
                        onClick={() => {
                          handleApproveUser(selectedUser.id);
                          setShowDetailsDialog(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve User
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleSuspendUser(selectedUser.id);
                          setShowDetailsDialog(false);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject User
                      </Button>
                    </>
                  )}
                  
                  {selectedUser.status === 'Active' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleSuspendUser(selectedUser.id);
                        setShowDetailsDialog(false);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend User
                    </Button>
                  )}
                  
                  {selectedUser.status === 'Suspended' && (
                    <Button
                      onClick={() => {
                        handleApproveUser(selectedUser.id);
                        setShowDetailsDialog(false);
                      }}
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
    </AdminLayout>
  );
}