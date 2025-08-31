import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  DollarSign, 
  PiggyBank, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface FinancialOverviewProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const loansSummary = {
  totalLoans: 2400000,
  activeLoans: 45,
  defaultedLoans: 3,
  pendingApplications: 12,
  monthlyCollection: 180000
};

const savingsSummary = {
  totalSavings: 4800000,
  activeAccounts: 156,
  monthlyDeposits: 320000,
  averageBalance: 30769,
  newAccounts: 8
};

const insuranceSummary = {
  totalPremiums: 180000,
  activePolicies: 134,
  expiringPolicies: 12,
  monthlyPremiums: 45000,
  claims: 2
};

const recentLoans = [
  {
    id: 'L001',
    member: 'James Mutua',
    amount: 50000,
    type: 'Normal',
    status: 'Active',
    disbursed: '2024-01-10',
    nextPayment: '2024-02-10',
    balance: 35000
  },
  {
    id: 'L002',
    member: 'Mary Wanjiku',
    amount: 25000,
    type: 'Emergency',
    status: 'Active',
    disbursed: '2024-01-08',
    nextPayment: '2024-02-08',
    balance: 20000
  },
  {
    id: 'L003',
    member: 'Peter Ochieng',
    amount: 100000,
    type: 'Normal',
    status: 'Pending',
    disbursed: null,
    nextPayment: null,
    balance: 100000
  }
];

const recentSavings = [
  {
    id: 'S001',
    member: 'James Mutua',
    accountType: 'Regular Savings',
    balance: 45000,
    lastDeposit: '2024-01-15',
    depositAmount: 5000,
    monthlyTarget: 10000
  },
  {
    id: 'S002',
    member: 'Catherine Muthoni',
    accountType: 'Share Capital',
    balance: 25000,
    lastDeposit: '2024-01-12',
    depositAmount: 2500,
    monthlyTarget: 5000
  },
  {
    id: 'S003',
    member: 'Grace Akinyi',
    accountType: 'Emergency Fund',
    balance: 15000,
    lastDeposit: '2024-01-14',
    depositAmount: 3000,
    monthlyTarget: 7500
  }
];

const recentInsurance = [
  {
    id: 'I001',
    member: 'James Mutua',
    vehicle: 'KCA 123X',
    policyType: 'Comprehensive',
    premium: 15000,
    expiry: '2024-06-15',
    status: 'Active'
  },
  {
    id: 'I002',
    member: 'Catherine Muthoni',
    vehicle: 'KBD 456Y',
    policyType: 'Third Party',
    premium: 8000,
    expiry: '2024-01-10',
    status: 'Expired'
  },
  {
    id: 'I003',
    member: 'Samuel Kiprop',
    vehicle: 'KCE 789Z',
    policyType: 'Comprehensive',
    premium: 12000,
    expiry: '2024-08-20',
    status: 'Active'
  }
];

export function FinancialOverview({ user, onNavigate, onLogout }: FinancialOverviewProps) {
  const [activeTab, setActiveTab] = useState('loans');

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Defaulted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/financials" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
            <p className="text-gray-600 mt-1">Monitor loans, savings, and insurance activities</p>
          </div>
          <Button 
            onClick={() => onNavigate('admin/reports/financials')}
            className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90"
          >
            <FileText className="h-4 w-4 mr-2" />
            Financial Reports
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Loans Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Loans Overview</h3>
                <DollarSign className="h-6 w-6 text-[var(--neon-turquoise)]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Portfolio</span>
                  <span className="font-medium">{formatCurrency(loansSummary.totalLoans)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Loans</span>
                  <span className="font-medium">{loansSummary.activeLoans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Collection</span>
                  <span className="font-medium text-green-600">{formatCurrency(loansSummary.monthlyCollection)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Defaulted</span>
                  <span className="font-medium text-red-600">{loansSummary.defaultedLoans}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savings Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Savings Overview</h3>
                <PiggyBank className="h-6 w-6 text-[var(--neon-yellow)]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Savings</span>
                  <span className="font-medium">{formatCurrency(savingsSummary.totalSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Accounts</span>
                  <span className="font-medium">{savingsSummary.activeAccounts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Deposits</span>
                  <span className="font-medium text-green-600">{formatCurrency(savingsSummary.monthlyDeposits)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Balance</span>
                  <span className="font-medium">{formatCurrency(savingsSummary.averageBalance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Insurance Overview</h3>
                <Shield className="h-6 w-6 text-[var(--neon-orange)]" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Premiums</span>
                  <span className="font-medium">{formatCurrency(insuranceSummary.totalPremiums)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Policies</span>
                  <span className="font-medium">{insuranceSummary.activePolicies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Premiums</span>
                  <span className="font-medium text-green-600">{formatCurrency(insuranceSummary.monthlyPremiums)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expiring Soon</span>
                  <span className="font-medium text-red-600">{insuranceSummary.expiringPolicies}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="loans">Loans</TabsTrigger>
                <TabsTrigger value="savings">Savings</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
              </TabsList>

              {/* Loans Tab */}
              <TabsContent value="loans" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Loan Activities</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => onNavigate('admin/loans')}
                  >
                    View All Loans
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disbursed</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {loan.member}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(loan.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{loan.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {loan.disbursed ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {loan.disbursed}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(loan.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Savings Tab */}
              <TabsContent value="savings" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Savings Activities</h3>
                  <Button variant="outline">
                    View All Accounts
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Last Deposit</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Monthly Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSavings.map((saving) => (
                      <TableRow key={saving.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {saving.member}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{saving.accountType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(saving.balance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {saving.lastDeposit}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(saving.depositAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(saving.monthlyTarget)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Insurance Activities</h3>
                  <Button variant="outline">
                    View All Policies
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Policy Type</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInsurance.map((insurance) => (
                      <TableRow key={insurance.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            {insurance.member}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {insurance.vehicle}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{insurance.policyType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(insurance.premium)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {insurance.expiry}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(insurance.status)}>
                            {insurance.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}