import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Car, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data for charts
const financialData = [
  { month: 'Jan', loans: 45000, savings: 28000, insurance: 12000 },
  { month: 'Feb', loans: 52000, savings: 31000, insurance: 14000 },
  { month: 'Mar', loans: 48000, savings: 29000, insurance: 13000 },
  { month: 'Apr', loans: 61000, savings: 35000, insurance: 16000 },
  { month: 'May', loans: 55000, savings: 33000, insurance: 15000 },
  { month: 'Jun', loans: 67000, savings: 38000, insurance: 18000 }
];

const userRoleData = [
  { name: 'Vehicle Owners', value: 156, color: 'var(--neon-turquoise)' },
  { name: 'Drivers', value: 89, color: 'var(--neon-yellow)' },
  { name: 'Staff', value: 12, color: 'var(--neon-orange)' },
  { name: 'Admins', value: 3, color: 'var(--neon-purple)' }
];

export function AdminDashboard({ user, onNavigate, onLogout }: AdminDashboardProps) {
  const stats = [
    {
      title: 'Total Users',
      value: '260',
      change: '+12%',
      icon: Users,
      color: 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]',
      description: '15 new this month'
    },
    {
      title: 'Active Vehicles',
      value: '142',
      change: '+8%',
      icon: Car,
      color: 'from-[var(--neon-yellow)] to-[var(--neon-orange)]',
      description: '8 pending approval'
    },
    {
      title: 'Total Loans',
      value: 'KSh 2.4M',
      change: '+15%',
      icon: DollarSign,
      color: 'from-[var(--neon-orange)] to-[var(--hot-pink)]',
      description: '23 applications pending'
    },
    {
      title: 'Insurance Active',
      value: '134',
      change: '+5%',
      icon: Shield,
      color: 'from-[var(--neon-purple)] to-[var(--neon-turquoise)]',
      description: '12 expiring soon'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or approve user accounts',
      icon: Users,
      color: 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]',
      action: () => onNavigate('admin/users')
    },
    {
      title: 'Fleet Management',
      description: 'Oversee vehicle registrations and status',
      icon: Car,
      color: 'from-[var(--neon-yellow)] to-[var(--neon-orange)]',
      action: () => onNavigate('admin/fleet')
    },
    {
      title: 'Approve Loans',
      description: 'Review and approve loan applications',
      icon: DollarSign,
      color: 'from-[var(--neon-orange)] to-[var(--hot-pink)]',
      action: () => onNavigate('admin/loans')
    },
    {
      title: 'Generate Reports',
      description: 'Create financial and operational reports',
      icon: FileText,
      color: 'from-[var(--neon-purple)] to-[var(--neon-turquoise)]',
      action: () => onNavigate('admin/reports/users')
    }
  ];

  const recentActivities = [
    {
      type: 'user',
      message: 'New user registration: John Kamau',
      time: '2 minutes ago',
      status: 'pending',
      icon: UserCheck
    },
    {
      type: 'loan',
      message: 'Loan application submitted: KSh 50,000',
      time: '15 minutes ago',
      status: 'review',
      icon: DollarSign
    },
    {
      type: 'vehicle',
      message: 'Vehicle registration: KCA 123X',
      time: '1 hour ago',
      status: 'approved',
      icon: Car
    },
    {
      type: 'alert',
      message: 'Insurance expiring for KBD 456Y',
      time: '2 hours ago',
      status: 'warning',
      icon: AlertTriangle
    }
  ];

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/dashboard" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 rounded-xl p-6 border border-[var(--neon-turquoise)]/20">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your SACCO operations today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm font-medium text-green-500">
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Activity (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`KSh ${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="loans" fill="var(--neon-turquoise)" name="Loans" />
                  <Bar dataKey="savings" fill="var(--neon-yellow)" name="Savings" />
                  <Bar dataKey="insurance" fill="var(--neon-orange)" name="Insurance" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex-col items-start space-y-2 hover:shadow-lg transition-all"
                  onClick={action.action}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {action.description}
                    </p>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${
                    activity.status === 'approved' ? 'bg-green-100' :
                    activity.status === 'pending' ? 'bg-yellow-100' :
                    activity.status === 'warning' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    <activity.icon className={`h-4 w-4 ${
                      activity.status === 'approved' ? 'text-green-600' :
                      activity.status === 'pending' ? 'text-yellow-600' :
                      activity.status === 'warning' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <Badge variant={
                    activity.status === 'approved' ? 'default' :
                    activity.status === 'pending' ? 'secondary' :
                    activity.status === 'warning' ? 'destructive' :
                    'outline'
                  }>
                    {activity.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {activity.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {activity.status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}