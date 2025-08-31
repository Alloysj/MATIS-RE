import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  User, 
  Car, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StaffDashboardProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function StaffDashboard({ user, onNavigate, onLogout }: StaffDashboardProps) {
  // Mock data for charts
  const userStatusData = [
    { name: 'Active', value: 150, color: '#14F195' },
    { name: 'Pending', value: 25, color: '#FFE838' },
    { name: 'Suspended', value: 10, color: '#FF6B35' }
  ];

  const vehicleStatusData = [
    { name: 'Active', value: 85, color: '#14F195' },
    { name: 'Maintenance', value: 12, color: '#FFE838' },
    { name: 'Inactive', value: 8, color: '#FF6B35' }
  ];

  const monthlyData = [
    { month: 'Jan', loans: 45000, savings: 120000 },
    { month: 'Feb', loans: 52000, savings: 135000 },
    { month: 'Mar', loans: 48000, savings: 128000 },
    { month: 'Apr', loans: 61000, savings: 145000 },
    { month: 'May', loans: 55000, savings: 152000 },
    { month: 'Jun', loans: 58000, savings: 160000 }
  ];

  const quickLinks = [
    {
      title: 'Add Expense',
      description: 'Record new SACCO expense',
      icon: Receipt,
      action: () => onNavigate('staff/expensetracking'),
      color: 'from-[var(--neon-orange)] to-[var(--neon-yellow)]'
    },
    {
      title: 'Pending Loans',
      description: 'Review loan applications',
      icon: CreditCard,
      action: () => onNavigate('staff/loanmanagement'),
      color: 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]'
    },
    {
      title: 'Salary Advance',
      description: 'Apply for salary advance',
      icon: DollarSign,
      action: () => onNavigate('staff/salary'),
      color: 'from-[var(--neon-purple)] to-[var(--hot-pink)]'
    },
    {
      title: 'Vehicle Reports',
      description: 'Generate fleet reports',
      icon: Car,
      action: () => onNavigate('staff/reports'),
      color: 'from-[var(--lime-green)] to-[var(--neon-turquoise)]'
    }
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <StaffLayout user={user} currentPage="staff/dashboard" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 rounded-xl p-6 border border-[var(--neon-turquoise)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
                <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                  {user?.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
                <p className="text-gray-600">Here's what's happening with MATIS SACCO today</p>
              </div>
            </div>
            <Button 
              onClick={() => onNavigate('staff/update')}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
            >
              <User className="w-4 h-4 mr-2" />
              Update Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-[var(--neon-turquoise)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-[var(--neon-turquoise)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">185</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-yellow)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Car className="h-8 w-8 text-[var(--neon-orange)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">105</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-purple)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-[var(--neon-purple)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-bold text-gray-900">KES 2.4M</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-orange)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-[var(--neon-orange)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Loans</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Status Distribution</CardTitle>
              <CardDescription>Current status of all SACCO members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                {userStatusData.map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Status Distribution</CardTitle>
              <CardDescription>Current status of fleet vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vehicleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                {vehicleStatusData.map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Monthly loans and savings summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KES ${value.toLocaleString()}`, '']} />
                      <Bar dataKey="loans" fill="var(--neon-orange)" name="Loans" />
                      <Bar dataKey="savings" fill="var(--neon-turquoise)" name="Savings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--electric-blue)]/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Income</p>
                      <p className="text-xl font-bold text-gray-900">KES 14.2M</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-[var(--neon-turquoise)]" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-[var(--neon-orange)]/10 to-[var(--neon-yellow)]/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-xl font-bold text-gray-900">KES 8.7M</p>
                    </div>
                    <Receipt className="h-8 w-8 text-[var(--neon-orange)]" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-[var(--neon-purple)]/10 to-[var(--hot-pink)]/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Outstanding Loans</p>
                      <p className="text-xl font-bold text-gray-900">KES 3.2M</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-[var(--neon-purple)]" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common staff operations and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <Button
                  key={link.title}
                  onClick={link.action}
                  className={`h-auto p-4 bg-gradient-to-r ${link.color} text-black hover:opacity-90 flex flex-col items-center space-y-2`}
                >
                  <link.icon className="h-8 w-8" />
                  <div className="text-center">
                    <p className="font-semibold">{link.title}</p>
                    <p className="text-xs opacity-80">{link.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest SACCO operations and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Salary payment processed for June 2024</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New loan application from John Kamau</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Vehicle KCA 123A insurance expires in 10 days</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Alert</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}