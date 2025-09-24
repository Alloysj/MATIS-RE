import { useEffect, useMemo } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  PiggyBank,
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign,
  Shield
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useVehicleOwnerData } from '../../context/VehicleOwnerDataContext';

interface FinancialStatusProps {
  user: { id?: string; name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface AllocationChartDatum {
  name: string;
  value: number;
  color: string;
}

interface DisplayTransaction {
  id: string;
  date: string;
  type: string;
  label: string;
  amount: number;
  balanceAfter: number | null;
  vehiclePlate: string | null;
  paymentId: string | null;
  displayAmount: number;
  isDebit: boolean;
}

const MONTHS_WINDOW = 7;
const TRANSACTION_DEBIT_TYPES = new Set([
  'LOAN_REPAYMENT',
  'INSURANCE_PAYMENT',
  'OPERATIONS_FEE',
  'EXPENSE'
]);

const ALLOCATION_COLOR_MAP: Record<string, string> = {
  Savings: 'var(--neon-turquoise)',
  'Loan Repayment': 'var(--neon-orange)',
  Insurance: 'var(--lime-green)',
  Operations: 'var(--neon-yellow)'
};

const ALLOCATION_FALLBACK_COLORS = [
  'var(--neon-purple)',
  'var(--hot-pink)',
  'var(--electric-blue)',
  'var(--neon-orange)'
];

const compactFormatter = new Intl.NumberFormat('en-KE', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1
});

const dateFormatter = new Intl.DateTimeFormat('en-KE', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const formatCurrency = (value: number) =>
  `KES ${value.toLocaleString('en-KE', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;

const formatPercent = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const computePercentChange = (current: number, previous?: number | null) => {
  if (previous === undefined || previous === null) return null;
  if (Math.abs(previous) < 0.001) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
};

const getAllocationColor = (label: string, index: number) =>
  ALLOCATION_COLOR_MAP[label] ?? ALLOCATION_FALLBACK_COLORS[index % ALLOCATION_FALLBACK_COLORS.length];

const isDebitTransaction = (type: string) => TRANSACTION_DEBIT_TYPES.has(type);

export function FinancialStatus({ user, onNavigate, onLogout }: FinancialStatusProps) {
  const { finance, loadFinance } = useVehicleOwnerData();

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const financeData = finance.data;
  const isInitialLoading = finance.status === 'loading' && !financeData;
  const error = finance.error;

  const savingsTrend = financeData?.savingsTrend ?? [];
  const loanTrend = financeData?.loanTrend ?? [];
  const allocation = financeData?.allocation ?? null;
  const transactions = financeData?.transactions ?? [];
  const totals = financeData?.totals ?? { savings: 0, loans: 0 };

  const latestSavings = savingsTrend.length ? savingsTrend[savingsTrend.length - 1].amount : 0;
  const previousSavings = savingsTrend.length > 1 ? savingsTrend[savingsTrend.length - 2].amount : null;

  const latestLoanOutstanding = loanTrend.length
    ? loanTrend[loanTrend.length - 1].amount
    : totals.loans;
  const previousLoanOutstanding = loanTrend.length > 1 ? loanTrend[loanTrend.length - 2].amount : null;

  const savingsChange = computePercentChange(latestSavings, previousSavings);
  const loanChange = computePercentChange(latestLoanOutstanding, previousLoanOutstanding);

  const totalSavingsDisplay = Math.max(totals.savings, 0);
  const totalLoansDisplay = Math.max(totals.loans, 0);

  const netWorth = totalSavingsDisplay - totalLoansDisplay;
  const previousNetWorth =
    previousSavings !== null && previousLoanOutstanding !== null
      ? previousSavings - previousLoanOutstanding
      : null;
  const netWorthChange = computePercentChange(netWorth, previousNetWorth);

  const netWorthBadge =
    netWorthChange === null
      ? 'Stable Position'
      : netWorthChange >= 0
        ? 'Healthy Growth'
        : 'Monitor Position';

  const riskRatio = totalSavingsDisplay === 0 ? Infinity : totalLoansDisplay / totalSavingsDisplay;
  const riskLevel =
    riskRatio === Infinity || Number.isNaN(riskRatio)
      ? 'Unknown'
      : riskRatio <= 0.5
        ? 'Low'
        : riskRatio <= 0.8
          ? 'Moderate'
          : 'High';

  const riskBadgeClass =
    riskLevel === 'High'
      ? 'bg-red-500/20 text-red-200 border-red-500/30'
      : riskLevel === 'Moderate'
        ? 'bg-yellow-500/20 text-yellow-100 border-yellow-500/30'
        : 'bg-green-500/20 text-green-200 border-green-500/30';

  const allocationItems = useMemo<AllocationChartDatum[]>(() => {
    if (!allocation?.allocations?.length) return [];
    return allocation.allocations.map((item, index) => ({
      name: item.label,
      value: item.value,
      color: getAllocationColor(item.label, index)
    }));
  }, [allocation]);

  const lastPayment = allocation?.payment ?? null;

  const displayTransactions = useMemo<DisplayTransaction[]>(
    () =>
      transactions.map((transaction) => {
        const isDebit = isDebitTransaction(transaction.type);
        const amount = Math.abs(transaction.amount);
        return {
          ...transaction,
          displayAmount: isDebit ? -amount : amount,
          isDebit
        };
      }),
    [transactions]
  );

  const savingsTrendEmpty = !isInitialLoading && savingsTrend.length === 0;
  const loanTrendEmpty = !isInitialLoading && loanTrend.length === 0;
  const allocationEmpty = !isInitialLoading && allocationItems.length === 0;
  const transactionsEmpty = !isInitialLoading && displayTransactions.length === 0;

  return (
    <VehicleOwnerLayout
      currentPage="users/financial-status"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Financial Status</h1>
          <p className="text-white/70">
            Complete overview of your SACCO financial position
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-500/40 bg-red-500/10 text-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && isInitialLoading && (
          <Alert className="mb-6 border-white/20 bg-white/10 text-white/80">
            <AlertDescription>Loading your latest financial data…</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Savings</p>
                  <p className="text-3xl font-bold text-[var(--neon-turquoise)]">
                    {formatCurrency(totalSavingsDisplay)}
                  </p>
                  <p
                    className={`text-sm flex items-center mt-1 ${
                      savingsChange === null
                        ? 'text-white/60'
                        : savingsChange >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                    }`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 mr-1 ${savingsChange !== null && savingsChange < 0 ? 'rotate-180' : ''}`}
                    />
                    {savingsChange === null
                      ? 'No previous data'
                      : `${formatPercent(savingsChange)} vs previous month`}
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
                    {formatCurrency(totalLoansDisplay)}
                  </p>
                  <p
                    className={`text-sm flex items-center mt-1 ${
                      loanChange === null
                        ? 'text-white/60'
                        : loanChange <= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                    }`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 mr-1 ${loanChange !== null && loanChange <= 0 ? 'rotate-180' : ''}`}
                    />
                    {loanChange === null
                      ? 'No previous data'
                      : `${formatPercent(loanChange)} vs previous month`}
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
                  <p className="text-white/80 text-sm">Net Position</p>
                  <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-[var(--neon-purple)]' : 'text-red-400'}`}>
                    {formatCurrency(netWorth)}
                  </p>
                  <p
                    className={`text-sm flex items-center mt-1 ${
                      netWorthChange === null
                        ? 'text-white/60'
                        : netWorthChange >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                    }`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 mr-1 ${netWorthChange !== null && netWorthChange < 0 ? 'rotate-180' : ''}`}
                    />
                    {netWorthChange === null
                      ? 'Awaiting trend data'
                      : `${formatPercent(netWorthChange)} vs previous month`}
                  </p>
                </div>
                <div className="p-4 bg-[var(--neon-purple)]/20 rounded-full">
                  <Shield className="w-8 h-8 text-[var(--neon-purple)]" />
                </div>
              </div>
              <div className="mt-4">
                <Badge className="bg-white/10 border-white/20 text-white/80">
                  {netWorthBadge}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-white text-xl">Savings Growth</CardTitle>
                <CardDescription className="text-white/70">
                  Monthly deposits recorded through remittances
                </CardDescription>
              </div>
              <Badge className="bg-white/10 border-white/20 text-white/70">Last {MONTHS_WINDOW} months</Badge>
            </CardHeader>
            <CardContent className="h-80">
              {savingsTrendEmpty ? (
                <div className="flex h-full items-center justify-center text-white/60">
                  No savings transactions recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={savingsTrend.slice(-MONTHS_WINDOW)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="rgba(255,255,255,0.6)"
                      tickFormatter={(value) => compactFormatter.format(value)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      labelStyle={{ color: '#fff' }}
                      contentStyle={{
                        backgroundColor: 'rgba(8,15,40,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--neon-turquoise)"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: 'var(--electric-blue)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Loan Health</CardTitle>
              <CardDescription className="text-white/70">
                Outstanding balance and repayment momentum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Risk Level</p>
                  <p className="text-lg font-semibold text-white">{riskLevel}</p>
                </div>
                <Badge className={riskBadgeClass}>Risk Level</Badge>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Outstanding</span>
                  <span className="text-white font-medium">{formatCurrency(totalLoansDisplay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Trend</span>
                  <span className={loanChange === null ? 'text-white/60' : loanChange <= 0 ? 'text-green-400' : 'text-red-400'}>
                    {loanChange === null ? 'No previous data' : formatPercent(loanChange)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Coverage</span>
                  <span className="text-white font-medium">
                    {totalSavingsDisplay === 0
                      ? 'N/A'
                      : `${Math.max(Math.min((totalLoansDisplay / totalSavingsDisplay) * 100, 999), 0).toFixed(0)}% of savings`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[var(--neon-yellow)]" />
                Payment Allocation Breakdown
              </CardTitle>
              <CardDescription className="text-white/70">
                {lastPayment
                  ? `Last payment ${formatDateLabel(lastPayment.date)} • ${formatCurrency(lastPayment.totalAmount)}`
                  : 'No payments recorded yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastPayment && (
                <div className="flex justify-end mb-4">
                  <Badge className="bg-white/10 border-white/30 text-white/70 uppercase">
                    {lastPayment.status}
                  </Badge>
                </div>
              )}

              {allocationEmpty ? (
                <div className="text-center text-white/60 py-10">
                  Awaiting first payment allocation.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={allocationItems}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {allocationItems.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{
                            backgroundColor: 'rgba(8,15,40,0.9)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {allocationItems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-white/80 text-sm">{item.name}</span>
                        </div>
                        <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
              {transactionsEmpty ? (
                <div className="text-center text-white/60 py-10">
                  No recent transactions available.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {displayTransactions.map((transaction) => {
                    const formattedAmount = formatCurrency(Math.abs(transaction.displayAmount));
                    const amountPrefix = transaction.displayAmount >= 0 ? '+' : '-';
                    return (
                      <div key={transaction.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-1.5 rounded ${
                                transaction.isDebit ? 'bg-red-500/20' : 'bg-green-500/20'
                              }`}
                            >
                              {transaction.isDebit ? (
                                <CreditCard className="w-4 h-4 text-red-400" />
                              ) : (
                                <PiggyBank className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{transaction.label}</p>
                              <p className="text-white/60 text-xs">
                                {transaction.vehiclePlate || 'Unassigned Vehicle'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${transaction.isDebit ? 'text-red-400' : 'text-green-400'}`}>
                              {`${amountPrefix}${formattedAmount}`}
                            </p>
                            <p className="text-white/60 text-xs">{formatDateLabel(transaction.date)}</p>
                          </div>
                        </div>
                        {transaction.balanceAfter !== null && (
                          <p className="text-white/60 text-xs">
                            Balance after transaction: {formatCurrency(transaction.balanceAfter)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Loan Balance Trend</CardTitle>
              <CardDescription className="text-white/70">
                Outstanding balance tracked across recent months
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {loanTrendEmpty ? (
                <div className="flex h-full items-center justify-center text-white/60">
                  No loan data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loanTrend.slice(-MONTHS_WINDOW)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="rgba(255,255,255,0.6)"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => compactFormatter.format(value)}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Outstanding']}
                      labelStyle={{ color: '#fff' }}
                      contentStyle={{
                        backgroundColor: 'rgba(8,15,40,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="amount" fill="var(--neon-orange)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </VehicleOwnerLayout>
  );
}
