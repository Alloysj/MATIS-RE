import { ComponentType, ReactNode, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter,
  Users,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';

interface UserReportsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<UserReportsLayoutProps>;
  currentPage?: string;
}

interface UserReportsLayoutProps {
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

// Mock data
const userReportsData = [
  {
    id: 'AU001',
    name: 'James Mutua',
    email: 'james.mutua@gmail.com',
    phone: '+254 701 234 567',
    role: 'Vehicle Owner',
    status: 'Active',
    dateJoined: '2023-12-20',
    vehicles: 2,
    totalSavings: 45000,
    totalLoans: 50000,
    lastLogin: '2024-01-16'
  },
  {
    id: 'AU002',
    name: 'Grace Akinyi',
    email: 'grace.akinyi@gmail.com',
    phone: '+254 712 345 678',
    role: 'Staff',
    status: 'Active',
    dateJoined: '2023-11-15',
    vehicles: 0,
    totalSavings: 30000,
    totalLoans: 0,
    lastLogin: '2024-01-15',
    position: 'Secretary'
  },
  {
    id: 'AU003',
    name: 'Samuel Kiprop',
    email: 'sam.kiprop@gmail.com',
    phone: '+254 723 456 789',
    role: 'Driver',
    status: 'Active',
    dateJoined: '2023-10-10',
    vehicles: 0,
    totalSavings: 18000,
    totalLoans: 25000,
    lastLogin: '2024-01-14',
    assignedVehicle: 'KCA 123X'
  },
  {
    id: 'AU004',
    name: 'Catherine Muthoni',
    email: 'cate.muthoni@gmail.com',
    phone: '+254 734 567 890',
    role: 'Vehicle Owner',
    status: 'Inactive',
    dateJoined: '2023-09-05',
    vehicles: 1,
    totalSavings: 25000,
    totalLoans: 75000,
    lastLogin: '2024-01-01'
  },
  {
    id: 'PU001',
    name: 'John Kamau',
    email: 'john.kamau@gmail.com',
    phone: '+254 712 345 678',
    role: 'Vehicle Owner',
    status: 'Pending',
    dateJoined: '2024-01-15',
    vehicles: 0,
    totalSavings: 15000,
    totalLoans: 0,
    lastLogin: 'Never'
  }
];

export function UserReports({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/reports/users'
}: UserReportsProps) {
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    // Add PDF export logic here
  };

  const handleExportCSV = () => {
    console.log('Exporting to CSV...');
    // Add CSV export logic here
  };

  const handlePrint = () => {
    console.log('Printing report...');
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter data based on selected filters and search
  const filteredData = userReportsData.filter(userData => {
    const matchesSearch = userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userData.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filters.role === 'all' || userData.role === filters.role;
    const matchesStatus = filters.status === 'all' || userData.status === filters.status;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate totals
  const totals = {
    users: filteredData.length,
    activeUsers: filteredData.filter(u => u.status === 'Active').length,
    totalSavings: filteredData.reduce((sum, u) => sum + u.totalSavings, 0),
    totalLoans: filteredData.reduce((sum, u) => sum + u.totalLoans, 0),
    totalVehicles: filteredData.reduce((sum, u) => sum + u.vehicles, 0)
  };

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Reports</h1>
            <p className="text-gray-600 mt-1">Generate comprehensive user activity reports</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <Input
                  id="search"
                  placeholder="Name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Vehicle Owner">Vehicle Owner</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totals.users}</p>
                </div>
                <Users className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{totals.activeUsers}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.totalSavings)}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">KSh</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Loans</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totals.totalLoans)}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">L</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-purple-600">{totals.totalVehicles}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">V</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>User Report Data</span>
              </div>
              <span className="text-sm font-normal text-gray-500">
                Showing {filteredData.length} of {userReportsData.length} users
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Info</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{userData.name}</p>
                        <p className="text-sm text-gray-500">{userData.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {userData.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {userData.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{userData.role}</Badge>
                      {userData.position && (
                        <p className="text-xs text-gray-500 mt-1">{userData.position}</p>
                      )}
                      {userData.assignedVehicle && (
                        <p className="text-xs text-gray-500 mt-1">Assigned: {userData.assignedVehicle}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(userData.status)}>
                        {userData.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {userData.dateJoined}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                          {userData.vehicles}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatCurrency(userData.totalSavings)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-orange-600">
                        {formatCurrency(userData.totalLoans)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {userData.lastLogin}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching the current filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Footer */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-sm text-gray-500">
              <p>Report generated on {new Date().toLocaleDateString()} by {user?.name}</p>
              <p className="mt-1">MATIS SACCO Management System - User Reports</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutComponent>
  );
}
