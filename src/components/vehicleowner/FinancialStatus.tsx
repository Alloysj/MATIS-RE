import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  PiggyBank,
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign,
  Shield
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinancialStatusProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const savingsData = [
  { month: 'Jul', amount: 35000 },
  { month: 'Aug', amount: 42000 },
  { month: 'Sep', amount: 38000 },
  { month: 'Oct', amount: 46000 },
  { month: 'Nov', amount: 52000 },
  { month: 'Dec', amount: 48000 },
  { month: 'Jan', amount: 56000 }
];

const loanData = [
  { month: 'Jul', amount: 65000 },
  { month: 'Aug', amount: 58000 },
  { month: 'Sep', amount: 51000 },
  { month: 'Oct', amount: 44000 },
  { month: 'Nov', amount: 37000 },
  { month: 'Dec', amount: 30000 },
  { month: 'Jan', amount: 23000 }
];

const allocationData = [
  { name: 'Savings', value: 12000, color: 'var(--neon-turquoise)' },
  { name: 'Loan Repayment', value: 8000, color: 'var(--neon-orange)' },
  { name: 'Insurance', value: 2000, color: 'var(--lime-green)' },
  { name: 'Operations', value: 3000, color: 'var(--neon-yellow)' }
];

const recentTransactions = [
  { id: '1', date: '2024-01-15', type: 'Savings Deposit', amount: 12000, balance: 56000, vehicle: 'KCA 123A' },
  { id: '2', date: '2024-01-15', type: 'Loan Repayment', amount: -8000, balance: 23000, vehicle: 'KCA 123A' },
  { id: '3', date: '2024-01-14', type: 'Savings Deposit', amount: 11500, balance: 44000, vehicle: 'KCB 456B' },
  { id: '4', date: '2024-01-14', type: 'Insurance Payment', amount: -2000, balance: 0, vehicle: 'KCB 456B' },
  { id: '5', date: '2024-01-13', type: 'Savings Deposit', amount: 12200, balance: 32500, vehicle: 'KCA 123A' }
];

export function FinancialStatus({ user, onNavigate, onLogout }: FinancialStatusProps) {
  const totalSavings = 83000; // Sum from both vehicles
  const totalLoans = 40000;
  const netWorth = totalSavings - totalLoans;

  return (
    <VehicleOwnerLayout
      currentPage="users/financial-status"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Financial Status</h1>
          <p className="text-white/70">
            Complete overview of your SACCO financial position
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Savings</p>
                  <p className="text-3xl font-bold text-[var(--neon-turquoise)]">
                    KES {totalSavings.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5% this month
                  </p>
                </div>
                <div className="p-4 bg-[var(--neon-turquoise)]/20 rounded-full">
                  <PiggyBank className="w-8 h-8 text-[var(--neon-turquoise)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-orange)]/20 to-[var(--neon-yellow)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Outstanding Loans</p>
                  <p className="text-3xl font-bold text-[var(--neon-orange)]">
                    KES {totalLoans.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                    -23.3% this month
                  </p>
                </div>
                <div className="p-4 bg-[var(--neon-orange)]/20 rounded-full">
                  <CreditCard className="w-8 h-8 text-[var(--neon-orange)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Net Worth</p>
                  <p className="text-3xl font-bold text-[var(--neon-purple)]">
                    KES {netWorth.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +18.7% this month
                  </p>
                </div>
                <div className="p-4 bg-[var(--neon-purple)]/20 rounded-full">
                  <DollarSign className="w-8 h-8 text-[var(--neon-purple)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Savings Trend */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <PiggyBank className="w-5 h-5 mr-2 text-[var(--neon-turquoise)]" />
                Savings Growth
              </CardTitle>
              <CardDescription className="text-white/70">
                Your savings progression over the last 7 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--neon-turquoise)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--neon-turquoise)', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Loan Repayment Progress */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-[var(--neon-orange)]" />
                Loan Repayment Progress
              </CardTitle>
              <CardDescription className="text-white/70">
                Outstanding loan balance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loanData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="amount" fill="var(--neon-orange)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Allocation */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[var(--neon-yellow)]" />
                Payment Allocation Breakdown
              </CardTitle>
              <CardDescription className="text-white/70">
                How your last payment was distributed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {allocationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-white/80 text-sm">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">
                      KES {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[var(--neon-purple)]" />
                Recent Transactions
              </CardTitle>
              <CardDescription className="text-white/70">
                Latest financial activities on your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${
                          transaction.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {transaction.amount > 0 ? (
                            <PiggyBank className="w-3 h-3 text-green-400" />
                          ) : (
                            <CreditCard className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{transaction.type}</p>
                          <p className="text-white/60 text-xs">{transaction.vehicle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}KES {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-white/60 text-xs">{transaction.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VehicleOwnerLayout>
  );
}