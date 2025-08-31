import { useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Receipt, 
  Search, 
  Download, 
  DollarSign, 
  Calendar, 
  Filter,
  FileText,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface ExpenseTrackingProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ExpenseTracking({ user, onNavigate, onLogout }: ExpenseTrackingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Check if user is treasurer
  const isTreasurer = user?.role === 'Treasurer' || user?.name === 'Admin User';

  // Mock data for salary expenses
  const salaryExpenses = [
    {
      id: 1,
      staffName: 'John Kamau',
      position: 'Accountant',
      type: 'Basic Salary',
      amount: 45000,
      date: '2024-06-01',
      status: 'Paid'
    },
    {
      id: 2,
      staffName: 'Mary Wanjiku',
      position: 'Secretary',
      type: 'Basic Salary',
      amount: 35000,
      date: '2024-06-01',
      status: 'Paid'
    },
    {
      id: 3,
      staffName: 'Peter Mwangi',
      position: 'Field Officer',
      type: 'Salary Advance',
      amount: 15000,
      date: '2024-06-15',
      status: 'Pending'
    }
  ];

  // Mock data for office expenses
  const officeExpenses = [
    {
      id: 1,
      category: 'Rent',
      description: 'Office rent for June 2024',
      amount: 25000,
      date: '2024-06-01',
      status: 'Paid',
      vendor: 'Property Management Ltd'
    },
    {
      id: 2,
      category: 'Utilities',
      description: 'Electricity bill',
      amount: 8500,
      date: '2024-06-05',
      status: 'Paid',
      vendor: 'Kenya Power'
    },
    {
      id: 3,
      category: 'Stationery',
      description: 'Office supplies',
      amount: 3200,
      date: '2024-06-10',
      status: 'Paid',
      vendor: 'Office Mart'
    },
    {
      id: 4,
      category: 'Internet',
      description: 'Internet & phone services',
      amount: 4500,
      date: '2024-06-01',
      status: 'Paid',
      vendor: 'Safaricom Business'
    },
    {
      id: 5,
      category: 'Maintenance',
      description: 'Office cleaning services',
      amount: 6000,
      date: '2024-06-15',
      status: 'Pending',
      vendor: 'Clean Pro Services'
    }
  ];

  // Mock data for budget vs actuals (Treasurer view)
  const budgetData = [
    { category: 'Salaries', budget: 150000, actual: 130000 },
    { category: 'Rent', budget: 30000, actual: 25000 },
    { category: 'Utilities', budget: 12000, actual: 8500 },
    { category: 'Maintenance', budget: 8000, actual: 6000 },
    { category: 'Stationery', budget: 5000, actual: 3200 },
    { category: 'Internet', budget: 5000, actual: 4500 }
  ];

  // Expense distribution for pie chart
  const expenseDistribution = [
    { name: 'Salaries', value: 130000, color: '#14F195' },
    { name: 'Rent', value: 25000, color: '#FFE838' },
    { name: 'Utilities', value: 8500, color: '#FF6B35' },
    { name: 'Maintenance', value: 6000, color: '#9945FF' },
    { name: 'Others', value: 7700, color: '#00D4FF' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExport = (format: string) => {
    // Simulate export functionality
    console.log(`Exporting data in ${format} format`);
  };

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
    <StaffLayout user={user} currentPage="staff/expensetracking" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
            <p className="text-gray-600">Track SACCO salary and office expenses</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              className="border-[var(--neon-turquoise)] text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              className="border-[var(--neon-orange)] text-[var(--neon-orange)] hover:bg-[var(--neon-orange)]/10"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('excel')}
              className="border-[var(--neon-purple)] text-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-[var(--neon-turquoise)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-[var(--neon-turquoise)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">KES 177.2K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-yellow)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Receipt className="h-8 w-8 text-[var(--neon-orange)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Salary Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">KES 130K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-purple)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Receipt className="h-8 w-8 text-[var(--neon-purple)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Office Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">KES 47.2K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-orange)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-[var(--neon-orange)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                  <p className="text-2xl font-bold text-gray-900">+8.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        {isTreasurer && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget vs Actuals */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actuals</CardTitle>
                <CardDescription>Comparison of budgeted vs actual expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KES ${value.toLocaleString()}`, '']} />
                      <Bar dataKey="budget" fill="var(--neon-turquoise)" name="Budget" />
                      <Bar dataKey="actual" fill="var(--neon-orange)" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={expenseDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`KES ${value.toLocaleString()}`, '']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center flex-wrap gap-4 mt-4">
                  {expenseDistribution.map((item) => (
                    <div key={item.name} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Salary Expenses Table */}
        <Card className="border-l-4 border-[var(--neon-turquoise)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-[var(--neon-turquoise)]" />
              <span>Salary & Advance Expenses</span>
            </CardTitle>
            <CardDescription>Staff salary payments and advance disbursements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.staffName}</TableCell>
                    <TableCell>{expense.position}</TableCell>
                    <TableCell>{expense.type}</TableCell>
                    <TableCell>KES {expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Office Expenses Table */}
        <Card className="border-l-4 border-[var(--neon-orange)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-[var(--neon-orange)]" />
              <span>Office Expenses</span>
            </CardTitle>
            <CardDescription>Rent, utilities, maintenance, and other office expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {officeExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell>KES {expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}