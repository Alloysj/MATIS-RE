import { useEffect, useMemo } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Car,
  CreditCard,
  PiggyBank,
  Shield,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useVehicleOwnerData } from '../../context/VehicleOwnerDataContext';

interface HomeDashboardProps {
  user: { id?: string; name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const formatCurrency = (value: number) =>
  `KES ${value.toLocaleString('en-KE', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;

const FALLBACK_RECENT_TRANSACTIONS = 4;

export function HomeDashboard({ user, onNavigate, onLogout }: HomeDashboardProps) {
  const { finance, matatu, loadFinance, loadMatatu } = useVehicleOwnerData();

  const financeData = finance.data;
  const matatuData = matatu.data;
  const financeLoading = finance.status === 'loading' && !financeData;
  const matatuLoading = matatu.status === 'loading' && !matatuData;

  useEffect(() => {
    if (!financeData) {
      void loadFinance();
    }
    if (!matatuData) {
      void loadMatatu();
    }
  }, [financeData, matatuData, loadFinance, loadMatatu]);

  const totalSavings = financeData?.totals.savings ?? 0;
  const totalLoans = financeData?.totals.loans ?? 0;
  const netPosition = totalSavings - totalLoans;
  const latestAllocation = financeData?.allocation;
  const recentTransactions = financeData?.transactions ?? [];
  const vehicles = matatuData?.dashboardCards ?? [];

  const savingsTrend = useMemo(
    () => financeData?.savingsTrend.slice(-6) ?? [],
    [financeData?.savingsTrend]
  );

  const paymentsTrend = useMemo(
    () => savingsTrend.map((point) => ({
      month: point.month,
      savings: point.amount,
      payments: point.amount * 0.25
    })),
    [savingsTrend]
  );

  const riskCoverage = totalSavings <= 0 ? null : Math.min((totalLoans / totalSavings) * 100, 999);

  return (
    <VehicleOwnerLayout
      currentPage="users/home"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name ?? 'Member'}
          </h1>
          <p className="text-white/70">
            Here's your SACCO dashboard overview
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-orange)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Savings</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalSavings)}
                  </p>
                </div>
                <div className="p-3 bg-[var(--neon-yellow)]/20 rounded-full">
                  <PiggyBank className="w-6 h-6 text-[var(--neon-yellow)]" />
                </div>
              </div>
              {financeLoading && (
                <p className="text-white/60 text-xs mt-3">Updating savings…</p>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Outstanding Loans</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalLoans)}
                  </p>
                </div>
                <div className="p-3 bg-[var(--neon-turquoise)]/20 rounded-full">
                  <CreditCard className="w-6 h-6 text-[var(--neon-turquoise)]" />
                </div>
              </div>
              {financeLoading && (
                <p className="text-white/60 text-xs mt-3">Checking loan balances…</p>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Vehicles</p>
                  <p className="text-2xl font-bold text-white">
                    {vehicles.length}
                  </p>
                </div>
                <div className="p-3 bg-[var(--neon-purple)]/20 rounded-full">
                  <Car className="w-6 h-6 text-[var(--neon-purple)]" />
                </div>
              </div>
              {matatuLoading && (
                <p className="text-white/60 text-xs mt-3">Loading fleet overview…</p>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-[var(--lime-green)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Net Position</p>
                  <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-white' : 'text-red-300'}`}>
                    {formatCurrency(netPosition)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Shield className="w-6 h-6 text-green-300" />
                </div>
              </div>
              {latestAllocation?.payment && (
                <p className="text-white/60 text-xs mt-3">
                  Last remittance: {formatCurrency(latestAllocation.payment.totalAmount)} on{' '}
                  {new Date(latestAllocation.payment.date).toLocaleDateString('en-KE')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-white text-xl">Savings & Payments Trend</CardTitle>
                <CardDescription className="text-white/70">
                  Your contributions across the last six months
                </CardDescription>
              </div>
              <Badge className="bg-white/10 border-white/20 text-white/70">Latest 6 months</Badge>
            </CardHeader>
            <CardContent className="h-80">
              {savingsTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-white/60">
                  {financeLoading ? 'Loading savings history…' : 'No savings data recorded yet.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paymentsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="rgba(255,255,255,0.6)"
                      tickFormatter={(value) => `KES ${Math.round(value / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: number, key: string) => [formatCurrency(value), key]}
                      labelStyle={{ color: '#fff' }}
                      contentStyle={{
                        backgroundColor: 'rgba(8,15,40,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line type="monotone" dataKey="savings" stroke="var(--neon-turquoise)" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="payments" stroke="var(--neon-orange)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Loan Health Snapshot</CardTitle>
              <CardDescription className="text-white/70">
                Monitor outstanding balances and risk level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Outstanding</p>
                  <p className="text-white text-lg font-semibold">{formatCurrency(totalLoans)}</p>
                </div>
                <Badge className="bg-white/10 border-white/20 text-white/70">
                  {riskCoverage === null ? 'Review Required' : `${Math.round(riskCoverage)}% of savings`}
                </Badge>
              </div>
              <div className="text-white/60 text-sm">
                {financeLoading
                  ? 'Refreshing loan information…'
                  : 'Keep remitting daily to reduce outstanding balances and maintain access to emergency funding.'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[var(--neon-orange)]" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Latest financial activities on your account
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('users/financial-status')}
                  className="text-[var(--neon-turquoise)] hover:text-white hover:bg-[var(--neon-turquoise)]/20"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {financeLoading && recentTransactions.length === 0 ? (
                <div className="text-white/60">Loading transactions…</div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-white/60">No transactions recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.slice(0, FALLBACK_RECENT_TRANSACTIONS).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div>
                        <p className="text-white font-medium">{transaction.label}</p>
                        <p className="text-white/60 text-sm">
                          {new Date(transaction.date).toLocaleDateString('en-KE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.amount >= 0 ? 'text-[var(--neon-yellow)]' : 'text-red-400'}`}>
                          {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Car className="w-5 h-5 mr-2 text-[var(--neon-purple)]" />
                    My Vehicles
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Quick overview of your matatu fleet
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('users/vehicles')}
                  className="text-[var(--neon-turquoise)] hover:text-white hover:bg-[var(--neon-turquoise)]/20"
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {matatuLoading && vehicles.length === 0 ? (
                <div className="text-white/60">Loading vehicle summary…</div>
              ) : vehicles.length === 0 ? (
                <div className="text-white/60">No vehicles registered yet.</div>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-bold">{vehicle.plate}</p>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {vehicle.insurance}
                        </Badge>
                      </div>
                      <p className="text-white/70 text-sm mb-2">{vehicle.route}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-white/60">Savings: </span>
                          <span className="text-[var(--neon-turquoise)]">
                            {formatCurrency(vehicle.savings)}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Loan: </span>
                          <span className="text-[var(--neon-orange)]">
                            {formatCurrency(vehicle.loan)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-[var(--neon-yellow)]" />
                  Daily Remittance Performance
                </CardTitle>
                <CardDescription className="text-white/70">
                  Savings growth compared to same period last month
                </CardDescription>
              </div>
              <Badge className="bg-white/10 border-white/20 text-white/70">
                {financeLoading ? 'Refreshing…' : 'Up to date'}
              </Badge>
            </CardHeader>
            <CardContent className="h-72">
              {savingsTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-white/60">
                  {financeLoading ? 'Loading remittance data…' : 'No remittance data recorded yet.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsTrend}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--neon-turquoise)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--neon-turquoise)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="rgba(255,255,255,0.6)"
                      tickFormatter={(value) => `KES ${Math.round(value / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Savings']}
                      labelStyle={{ color: '#fff' }}
                      contentStyle={{
                        backgroundColor: 'rgba(8,15,40,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="var(--neon-turquoise)" fillOpacity={1} fill="url(#colorSavings)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Keep your remittances consistent</h3>
                <p className="text-white/70">
                  Maintaining daily payments keeps your vehicles compliant and eligible for emergency credit facilities.
                </p>
              </div>
              <Button
                onClick={() => onNavigate('users/vehicles')}
                className="bg-gradient-to-r from-green-500/20 to-[var(--lime-green)]/20 text-white border border-green-500/30 hover:from-green-500/30 hover:to-[var(--lime-green)]/30"
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Register New Vehicle
                </div>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </VehicleOwnerLayout>
  );
}
