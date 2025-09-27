import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { UserDataService, User } from '../../services/userData';
import { 
  Users, 
  Building, 
  UserCheck, 
  Search, 
  Filter,
  BarChart3,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Car,
  ArrowLeft,
  MessageCircle,
  IdCard,
  Shield,
  Banknote,
  PiggyBank,
  Calculator,
  Clock,
  UserPlus
} from 'lucide-react';

interface UserProfilesProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  selectedUserId?: string;
}

interface ProfileStats {
  category: User['profileCategory'];
  count: number;
  percentage: number;
  totalShareCapital: number;
  totalSavings: number;
  totalLoans: number;
  averageAge: number;
}

export function UserProfiles({ user, onNavigate, onLogout, selectedUserId }: UserProfilesProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profileStats, setProfileStats] = useState<ProfileStats[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const allUsers = UserDataService.getAllUsers();
    setUsers(allUsers);
    calculateProfileStats(allUsers);
    
    // If selectedUserId is provided, find and set the selected user
    if (selectedUserId) {
      const user = UserDataService.getUserById(selectedUserId);
      setSelectedUser(user || null);
    }
  }, [selectedUserId]);

  const calculateProfileStats = (userList: User[]) => {
    const categories: User['profileCategory'][] = ['Individual', 'Corporate', 'Cooperative'];
    
    const stats = categories.map(category => {
      const categoryUsers = userList.filter(u => u.profileCategory === category);
      const count = categoryUsers.length;
      const percentage = userList.length > 0 ? (count / userList.length) * 100 : 0;
      
      const totalShareCapital = categoryUsers.reduce((sum, u) => sum + u.shareCapital, 0);
      const totalSavings = categoryUsers.reduce((sum, u) => sum + u.savingsBalance, 0);
      const totalLoans = categoryUsers.reduce((sum, u) => sum + u.loanBalance, 0);
      
      // Calculate average age
      const currentYear = new Date().getFullYear();
      const averageAge = categoryUsers.length > 0 
        ? categoryUsers.reduce((sum, u) => {
            const birthYear = new Date(u.dateOfBirth).getFullYear();
            return sum + (currentYear - birthYear);
          }, 0) / categoryUsers.length
        : 0;

      return {
        category,
        count,
        percentage,
        totalShareCapital,
        totalSavings,
        totalLoans,
        averageAge: Math.round(averageAge)
      };
    });

    setProfileStats(stats);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || user.profileCategory === categoryFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: User['profileCategory']) => {
    switch (category) {
      case 'Individual': return Users;
      case 'Corporate': return Building;
      case 'Cooperative': return UserCheck;
      default: return Users;
    }
  };

  const getCategoryColor = (category: User['profileCategory']) => {
    switch (category) {
      case 'Individual': return 'from-blue-500 to-cyan-500';
      case 'Corporate': return 'from-purple-500 to-pink-500';
      case 'Cooperative': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const ProfileStatsCard = ({ stat }: { stat: ProfileStats }) => {
    const Icon = getCategoryIcon(stat.category);
    const colorClass = getCategoryColor(stat.category);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`h-12 w-12 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{stat.category}</h3>
                <p className="text-sm text-gray-600">{stat.count} members</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{stat.percentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">of total</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Share Capital</p>
              <p className="font-semibold">KSh {stat.totalShareCapital.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Savings</p>
              <p className="font-semibold">KSh {stat.totalSavings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Loans</p>
              <p className="font-semibold">KSh {stat.totalLoans.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Avg Age</p>
              <p className="font-semibold">{stat.averageAge} years</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const UserProfileCard = ({ user }: { user: User }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
            <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <Badge className={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                {user.profileCategory}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{user.memberNumber} • {user.role}</span>
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
                <MapPin className="h-4 w-4" />
                <span>{user.address}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Share Capital</p>
                  <p className="font-semibold">KSh {user.shareCapital.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Savings</p>
                  <p className="font-semibold">KSh {user.savingsBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Loans</p>
                  <p className="font-semibold">KSh {user.loanBalance.toLocaleString()}</p>
                </div>
              </div>
              
              {user.vehicles && user.vehicles.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Car className="h-3 w-3" />
                  <span>{user.vehicles.length} vehicle{user.vehicles.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show detailed user profile if selectedUserId is provided
  if (selectedUser) {
    const handleSendMessage = () => {
      // In a real application, this would open a messaging interface
      alert(`Message feature would open for ${selectedUser.name}`);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const calculateAge = (dateOfBirth: string) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    return (
      <AdminLayout user={user} currentPage="admin/users/profiles" onNavigate={onNavigate} onLogout={onLogout}>
        <div className="space-y-6">
          {/* Header with Back Button */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => onNavigate('admin/users/profiles')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profiles</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile Details</h1>
              <p className="text-gray-600">Comprehensive member information</p>
            </div>
          </div>

          {/* User Profile Header */}
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
                    <div className="flex items-center space-x-3 mt-1">
                      <Badge className={getStatusColor(selectedUser.status)}>
                        {selectedUser.status}
                      </Badge>
                      <Badge variant="outline">{selectedUser.role}</Badge>
                      <Badge variant="outline">{selectedUser.profileCategory}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Member #{selectedUser.memberNumber}</p>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] hover:opacity-90"
                  onClick={handleSendMessage}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IdCard className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-sm text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID Number</p>
                    <p className="text-sm text-gray-900">{selectedUser.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.dateOfBirth)} ({calculateAge(selectedUser.dateOfBirth)} years old)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Occupation</p>
                    <p className="text-sm text-gray-900">{selectedUser.occupation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{selectedUser.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Next of Kin</p>
                    <p className="text-sm text-gray-900">{selectedUser.nextOfKin}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Next of Kin Phone</p>
                    <p className="text-sm text-gray-900">{selectedUser.nextOfKinPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration Date</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.registrationDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Login</p>
                    <p className="text-sm text-gray-900">{selectedUser.lastLogin === 'Never' ? 'Never' : formatDate(selectedUser.lastLogin)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="text-sm text-gray-900">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created By</p>
                    <p className="text-sm text-gray-900">{selectedUser.createdBy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Share Capital</p>
                    <p className="text-2xl font-bold text-blue-600">KSh {selectedUser.shareCapital.toLocaleString()}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Savings Balance</p>
                    <p className="text-2xl font-bold text-green-600">KSh {selectedUser.savingsBalance.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-red-600">KSh {selectedUser.loanBalance.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-purple-600">KSh {selectedUser.totalDeposits.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicles Information */}
          {selectedUser.vehicles && selectedUser.vehicles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Registered Vehicles ({selectedUser.vehicles.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{vehicle.plateNumber}</h4>
                        <Badge className={vehicle.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                        vehicle.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'}>
                          {vehicle.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Model:</span> {vehicle.model} ({vehicle.year})</p>
                        <p><span className="font-medium">Route:</span> {vehicle.route}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Vehicles Message */}
          {(!selectedUser.vehicles || selectedUser.vehicles.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Registered Vehicles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Vehicles Registered</h3>
                <p className="text-gray-500">This member has not registered any vehicles yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} currentPage="admin/users/profiles" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profiles & Categories</h1>
          <p className="text-gray-600">Overview of member profiles and demographic analysis</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="corporate">Corporate</TabsTrigger>
            <TabsTrigger value="cooperative">Cooperative</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profileStats.map((stat) => (
                <ProfileStatsCard key={stat.category} stat={stat} />
              ))}
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                      <p className="text-2xl font-bold text-green-600">
                        {users.filter(u => u.status === 'Active').length}
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vehicle Owners</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {users.filter(u => u.role === 'Vehicle Owner').length}
                      </p>
                    </div>
                    <Car className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Capital</p>
                      <p className="text-2xl font-bold text-orange-600">
                        KSh {users.reduce((sum, u) => sum + u.shareCapital, 0).toLocaleString()}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
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
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Vehicle Owner">Vehicle Owner</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Chairperson">Chairperson</SelectItem>
                      <SelectItem value="Treasurer">Treasurer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <UserProfileCard key={user.id} user={user} />
              ))}
              
              {filteredUsers.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No members found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Individual Category Tab */}
          <TabsContent value="individual" className="space-y-6">
            <div className="space-y-4">
              {users.filter(u => u.profileCategory === 'Individual').map((user) => (
                <UserProfileCard key={user.id} user={user} />
              ))}
            </div>
          </TabsContent>

          {/* Corporate Category Tab */}
          <TabsContent value="corporate" className="space-y-6">
            <div className="space-y-4">
              {users.filter(u => u.profileCategory === 'Corporate').map((user) => (
                <UserProfileCard key={user.id} user={user} />
              ))}
              
              {users.filter(u => u.profileCategory === 'Corporate').length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No corporate members</h3>
                    <p className="text-gray-500">No corporate profile members have been registered yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Cooperative Category Tab */}
          <TabsContent value="cooperative" className="space-y-6">
            <div className="space-y-4">
              {users.filter(u => u.profileCategory === 'Cooperative').map((user) => (
                <UserProfileCard key={user.id} user={user} />
              ))}
              
              {users.filter(u => u.profileCategory === 'Cooperative').length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No cooperative members</h3>
                    <p className="text-gray-500">No cooperative profile members have been registered yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}