import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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

interface UsersManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const pendingUsers = [
  {
    id: 'PU001',
    name: 'John Kamau',
    email: 'john.kamau@gmail.com',
    phone: '+254 712 345 678',
    role: 'Vehicle Owner',
    dateSubmitted: '2024-01-15',
    idDocument: 'valid'
  },
  {
    id: 'PU002',
    name: 'Mary Wanjiku',
    email: 'mary.w@yahoo.com',
    phone: '+254 723 456 789',
    role: 'Driver',
    dateSubmitted: '2024-01-14',
    idDocument: 'valid'
  },
  {
    id: 'PU003',
    name: 'Peter Ochieng',
    email: 'p.ochieng@gmail.com',
    phone: '+254 734 567 890',
    role: 'Vehicle Owner',
    dateSubmitted: '2024-01-13',
    idDocument: 'pending'
  }
];

const approvedUsers = [
  {
    id: 'AU001',
    name: 'James Mutua',
    email: 'james.mutua@gmail.com',
    phone: '+254 701 234 567',
    role: 'Vehicle Owner',
    dateJoined: '2023-12-20',
    status: 'Active',
    vehicles: 2
  },
  {
    id: 'AU002',
    name: 'Grace Akinyi',
    email: 'grace.akinyi@gmail.com',
    phone: '+254 712 345 678',
    role: 'Staff',
    dateJoined: '2023-11-15',
    status: 'Active',
    position: 'Secretary'
  },
  {
    id: 'AU003',
    name: 'Samuel Kiprop',
    email: 'sam.kiprop@gmail.com',
    phone: '+254 723 456 789',
    role: 'Driver',
    dateJoined: '2023-10-10',
    status: 'Active',
    assignedVehicle: 'KCA 123X'
  },
  {
    id: 'AU004',
    name: 'Catherine Muthoni',
    email: 'cate.muthoni@gmail.com',
    phone: '+254 734 567 890',
    role: 'Vehicle Owner',
    dateJoined: '2023-09-05',
    status: 'Inactive',
    vehicles: 1
  }
];

export function UsersManagement({ user, onNavigate, onLogout }: UsersManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved'>('pending');

  const handleApproveUser = (userId: string) => {
    console.log('Approving user:', userId);
    // Add approval logic here
  };

  const handleRejectUser = (userId: string) => {
    console.log('Rejecting user:', userId);
    // Add rejection logic here
  };

  const handleEditUser = (userId: string) => {
    onNavigate(`admin/users/user_profile/${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
    // Add deletion logic here
  };

  const filteredPendingUsers = pendingUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApprovedUsers = approvedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/users" 
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
          <Button 
            onClick={() => onNavigate('admin/users/create')}
            className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90"
          >
            <Users className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('admin/users/approve')}>
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('admin/users/roles')}>
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('admin/users/create')}>
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('admin/users/profiles')}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Info</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>ID Document</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {user.dateSubmitted}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.idDocument === 'valid' ? 'default' : 'secondary'}>
                          {user.idDocument}
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
                            <DropdownMenuItem onClick={() => handleApproveUser(user.id)}>
                              <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectUser(user.id)}>
                              <UserX className="h-4 w-4 mr-2 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onNavigate('admin/users/approve')}>
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
                <div className="text-center py-8 text-gray-500">
                  No pending users found
                </div>
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
                  {filteredApprovedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {user.dateJoined}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {user.vehicles && `${user.vehicles} vehicles`}
                          {user.position && user.position}
                          {user.assignedVehicle && `Assigned: ${user.assignedVehicle}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onNavigate('admin/users/roles')}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredApprovedUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No approved users found
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}