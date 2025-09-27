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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  DollarSign, 
  Download, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Building,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface FinancialReportsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock financial data
const revenueData = [
  {
    month: 'January',
    totalRevenue: 1250000,
    subscriptionFees: 180000,
    loanInterest: 95000,
    insurancePremiums: 145000,
    membershipFees: 85000,
    penalties: 12000,
    other: 33000
  },
  {
    month: 'February',
    totalRevenue: 1320000,
    subscriptionFees: 185000,
    loanInterest: 102000,
    insurancePremiums: 150000,
    membershipFees: 90000,
    penalties: 15000,
    other: 28000
  },
  {
    month: 'March',
    totalRevenue: 1180000,
    subscriptionFees: 175000,
    loanInterest: 88000,
    insurancePremiums: 135000,
    membershipFees: 82000,
    penalties: 8000,
    other: 42000
  },
  {
    month: 'April',
    totalRevenue: 1450000,
    subscriptionFees: 195000,
    loanInterest: 118000,
    insurancePremiums: 160000,
    membershipFees: 95000,
    penalties: 18000,
    other: 64000
  },
  {
    month: 'May',
    totalRevenue: 1380000,
    subscriptionFees: 188000,
    loanInterest: 108000,
    insurancePremiums: 152000,
    membershipFees: 88000,
    penalties: 14000,
    other: 30000
  },
  {
    month: 'June',
    totalRevenue: 1265000,
    subscriptionFees: 182000,
    loanInterest: 96000,
    insurancePremiums: 148000,
    membershipFees: 85000,
    penalties: 11000,
    other: 43000
  }
];

const expensesData = [
  {
    category: 'Staff Salaries',
    amount: 420000,
    percentage: 35,
    lastMonth: 410000,
    trend: 'up'
  },
  {
    category: 'Office Rent',
    amount: 180000,
    percentage: 15,
    lastMonth: 180000,
    trend: 'stable'
  },
  {
    category: 'Vehicle Maintenance',
    amount: 145000,
    percentage: 12,
    lastMonth: 165000,
    trend: 'down'
  },
  {
    category: 'Insurance',
    amount: 125000,
    percentage: 10,
    lastMonth: 125000,
    trend: 'stable'
  },
  {
    category: 'Marketing',
    amount: 95000,
    percentage: 8,
    lastMonth: 85000,
    trend: 'up'
  },
  {
    category: 'Utilities',
    amount: 85000,
    percentage: 7,
    lastMonth: 90000,
    trend: 'down'
  },
  {
    category: 'Legal & Compliance',
    amount: 65000,
    percentage: 5,
    lastMonth: 60000,
    trend: 'up'
  },
  {
    category: 'Technology',
    amount: 55000,
    percentage: 5,
    lastMonth: 50000,
    trend: 'up'
  },
  {
    category: 'Other',
    amount: 35000,
    percentage: 3,
    lastMonth: 40000,
    trend: 'down'
  }
];

const loanPortfolioData = [
  {
    id: 'L001',
    borrower: 'James Mutua',
    principal: 500000,
    outstanding: 320000,
    interestRate: 12,
    monthlyPayment: 45000,
    status: 'Current',
    disbursedDate: '2024-01-15',
    dueDate: '2025-01-15'
  },
  {
    id: 'L002',
    borrower: 'Catherine Muthoni',
    principal: 750000,
    outstanding: 580000,
    interestRate: 10,
    monthlyPayment: 68000,
    status: 'Current',
    disbursedDate: '2023-11-20',
    dueDate: '2024-11-20'
  },
  {
    id: 'L003',
    borrower: 'Peter Kimani',
    principal: 300000,
    outstanding: 85000,
    interestRate: 14,
    monthlyPayment: 32000,
    status: 'Current',
    disbursedDate: '2023-08-10',
    dueDate: '2024-08-10'
  },
  {
    id: 'L004',
    borrower: 'Mary Njeri',
    principal: 450000,
    outstanding: 225000,
    interestRate: 11,
    monthlyPayment: 41000,
    status: 'Overdue',
    disbursedDate: '2023-12-05',
    dueDate: '2024-12-05'
  },
  {
    id: 'L005',
    borrower: 'John Kamau',
    principal: 600000,
    outstanding: 465000,
    interestRate: 13,
    monthlyPayment: 58000,
    status: 'Current',
    disbursedDate: '2024-02-28',
    dueDate: '2025-02-28'
  }
];

const membershipData = [
  {
    id: 'M001',
    member: 'James Mutua',
    type: 'Vehicle Owner',
    contributionPaid: 125000,
    contributionRequired: 150000,
    monthlyFee: 5000,
    status: 'Active',
    joinDate: '2023-06-15'
  },
  {
    id: 'M002',
    member: 'Catherine Muthoni',
    type: 'Vehicle Owner',
    contributionPaid: 150000,
    contributionRequired: 150000,
    monthlyFee: 5000,
    status: 'Active',
    joinDate: '2023-04-20'
  },
  {
    id: 'M003',
    member: 'Peter Kimani',
    type: 'Vehicle Owner',
    contributionPaid: 150000,
    contributionRequired: 150000,
    monthlyFee: 5000,
    status: 'Active',
    joinDate: '2023-03-10'
  },
  {
    id: 'M004',
    member: 'Mary Njeri',
    type: 'Vehicle Owner',
    contributionPaid: 75000,
    contributionRequired: 150000,
    monthlyFee: 5000,
    status: 'Pending',
    joinDate: '2024-01-05'
  },
  {
    id: 'M005',
    member: 'John Kamau',
    type: 'Vehicle Owner',
    contributionPaid: 100000,
    contributionRequired: 150000,
    monthlyFee: 5000,
    status: 'Active',
    joinDate: '2023-12-28'
  }
];

const profitLossData = [
  { month: 'Jan', revenue: 1250000, expenses: 1205000, profit: 45000 },
  { month: 'Feb', revenue: 1320000, expenses: 1170000, profit: 150000 },
  { month: 'Mar', revenue: 1180000, expenses: 1230000, profit: -50000 },
  { month: 'Apr', revenue: 1450000, expenses: 1185000, profit: 265000 },
  { month: 'May', revenue: 1380000, expenses: 1225000, profit: 155000 },
  { month: 'Jun', revenue: 1265000, expenses: 1205000, profit: 60000 }
];

const revenueBreakdownData = [
  { name: 'Subscription Fees', value: 182000, color: '#10B981' },
  { name: 'Loan Interest', value: 96000, color: '#3B82F6' },
  { name: 'Insurance Premiums', value: 148000, color: '#F59E0B' },
  { name: 'Membership Fees', value: 85000, color: '#EF4444' },
  { name: 'Penalties', value: 11000, color: '#8B5CF6' },
  { name: 'Other', value: 43000, color: '#6B7280' }
];

export function FinancialReports({ user, onNavigate, onLogout }: FinancialReportsProps) {
  const [dateRange, setDateRange] = useState('last-6-months');

  const handleExportRevenue = () => {
    const headers = ['Month', 'Total Revenue', 'Subscription Fees', 'Loan Interest', 'Insurance Premiums', 'Membership Fees', 'Penalties', 'Other'];
    const csvContent = [
      headers.join(','),
      ...revenueData.map(item => [
        item.month,
        item.totalRevenue,
        item.subscriptionFees,
        item.loanInterest,
        item.insurancePremiums,
        item.membershipFees,
        item.penalties,
        item.other
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExpenses = () => {
    const headers = ['Category', 'Amount', 'Percentage', 'Last Month', 'Trend'];
    const csvContent = [
      headers.join(','),
      ...expensesData.map(expense => [
        expense.category,
        expense.amount,
        expense.percentage,
        expense.lastMonth,
        expense.trend
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportLoans = () => {
    const headers = ['Loan ID', 'Borrower', 'Principal', 'Outstanding', 'Interest Rate (%)', 'Monthly Payment', 'Status', 'Disbursed Date', 'Due Date'];
    const csvContent = [
      headers.join(','),
      ...loanPortfolioData.map(loan => [
        loan.id,
        loan.borrower,
        loan.principal,
        loan.outstanding,
        loan.interestRate,
        loan.monthlyPayment,
        loan.status,
        loan.disbursedDate,
        loan.dueDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loan_portfolio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportMembership = () => {
    const headers = ['Member ID', 'Member Name', 'Type', 'Contribution Paid', 'Contribution Required', 'Monthly Fee', 'Status', 'Join Date'];
    const csvContent = [
      headers.join(','),
      ...membershipData.map(member => [
        member.id,
        member.member,
        member.type,
        member.contributionPaid,
        member.contributionRequired,
        member.monthlyFee,
        member.status,
        member.joinDate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `membership_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = revenueData[revenueData.length - 1]?.totalRevenue || 0;
  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalOutstandingLoans = loanPortfolioData.reduce((sum, loan) => sum + loan.outstanding, 0);

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/reports/financials" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive financial analysis and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="date-range">Period:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-month">Last month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 months</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    KSh {totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -8.3% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    KSh {totalExpenses.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -2.1% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    KSh {Math.abs(netProfit).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                  <BarChart3 className={`h-6 w-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding Loans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    KSh {totalOutstandingLoans.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <CreditCard className="h-3 w-3 mr-1" />
                    5 active loans
                  </p>
                </div>
                <Building className="h-8 w-8 text-[var(--neon-purple)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Reports Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="profit-loss">P&L</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Revenue Trends</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleExportRevenue}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                          <Legend />
                          <Area type="monotone" dataKey="totalRevenue" stackId="1" stroke="#10B981" fill="#10B981" name="Total Revenue" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueBreakdownData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {revenueBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {revenueBreakdownData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">KSh {item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Expense Breakdown</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportExpenses}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Last Month</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesData.map((expense, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{expense.category}</TableCell>
                        <TableCell>KSh {expense.amount.toLocaleString()}</TableCell>
                        <TableCell>{expense.percentage}%</TableCell>
                        <TableCell>KSh {expense.lastMonth.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {expense.trend === 'up' ? (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            ) : expense.trend === 'down' ? (
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-gray-400" />
                            )}
                            <span className={`text-sm ${
                              expense.trend === 'up' ? 'text-red-600' : 
                              expense.trend === 'down' ? 'text-green-600' : 
                              'text-gray-600'
                            }`}>
                              {expense.trend === 'up' ? 'Increased' : 
                               expense.trend === 'down' ? 'Decreased' : 
                               'Stable'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Loss Tab */}
          <TabsContent value="profit-loss" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitLossData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                      <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                      <Bar dataKey="profit" fill="#3B82F6" name="Net Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Loan Portfolio</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportLoans}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Monthly Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanPortfolioData.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.borrower}</TableCell>
                        <TableCell>KSh {loan.principal.toLocaleString()}</TableCell>
                        <TableCell>KSh {loan.outstanding.toLocaleString()}</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                        <TableCell>KSh {loan.monthlyPayment.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              loan.status === 'Current' 
                                ? 'bg-green-100 text-green-800'
                                : loan.status === 'Overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{loan.dueDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Tab */}
          <TabsContent value="membership" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Membership Financial Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportMembership}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contribution Paid</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Monthly Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membershipData.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.member}</TableCell>
                        <TableCell>{member.type}</TableCell>
                        <TableCell>KSh {member.contributionPaid.toLocaleString()}</TableCell>
                        <TableCell>KSh {member.contributionRequired.toLocaleString()}</TableCell>
                        <TableCell>KSh {member.monthlyFee.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              member.status === 'Active' 
                                ? 'bg-green-100 text-green-800'
                                : member.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.joinDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}