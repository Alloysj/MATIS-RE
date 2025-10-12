import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, DollarSign, Loader2, PiggyBank, Shield, User } from 'lucide-react';
import {
  DashboardInsuranceResponse,
  DashboardLoansResponse,
  DashboardSavingsResponse,
  fetchDashboardInsurance,
  fetchDashboardLoans,
  fetchDashboardSavings
} from '../../services/admin';

interface FinancialOverviewProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const normalizeSavingsTypeKey = (type: string | null | undefined) => type ?? 'UNSPECIFIED';

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const labelForSavingsType = (key: string) => {
  if (!key || key === 'UNSPECIFIED') {
    return 'Unspecified';
  }
  return toTitleCase(key.replace(/[_-]/g, ' '));
};

export function FinancialOverview({ user, onNavigate, onLogout }: FinancialOverviewProps) {
  const [activeTab, setActiveTab] = useState('loans');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loansData, setLoansData] = useState<DashboardLoansResponse | null>(null);
  const [savingsData, setSavingsData] = useState<DashboardSavingsResponse | null>(null);
  const [insuranceData, setInsuranceData] = useState<DashboardInsuranceResponse | null>(null);
  const [selectedSavingsType, setSelectedSavingsType] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [loans, savings, insurance] = await Promise.all([
          fetchDashboardLoans(),
          fetchDashboardSavings(),
          fetchDashboardInsurance()
        ]);

        if (!isMounted) return;
        setLoansData(loans);
        setSavingsData(savings);
        setInsuranceData(insurance);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load financial data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!savingsData) {
      setSelectedSavingsType('ALL');
      return;
    }

    const availableTypes = Object.keys(savingsData.totals.byType ?? {});
    if (availableTypes.length === 0) {
      setSelectedSavingsType('ALL');
      return;
    }

    if (selectedSavingsType !== 'ALL' && !availableTypes.includes(selectedSavingsType)) {
      setSelectedSavingsType(availableTypes[0]);
    }
  }, [savingsData, selectedSavingsType]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0
      }),
    []
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
    []
  );

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return 'N/A';
    }
    return currencyFormatter.format(amount);
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return value.toLocaleString();
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return 'N/A';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    return dateFormatter.format(date);
  };

  const accountTypeLabel = (type: string | null | undefined) => labelForSavingsType(normalizeSavingsTypeKey(type));

  const getStatusColor = (status: string) => {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'DISBURSED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'IN PROGRESS':
        return 'bg-yellow-100 text-yellow-700';
      case 'EXPIRED':
      case 'DEFAULTED':
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const loansSummary = useMemo(() => {
    const totals = loansData?.totals;
    if (!totals) {
      return {
        totalAmount: null,
        outstanding: null,
        disbursed: 0,
        pending: 0,
        defaulted: 0,
        total: 0
      };
    }

    return {
      totalAmount: totals.sum,
      outstanding: totals.outstanding,
      disbursed: totals.byStatus?.DISBURSED ?? 0,
      pending: totals.byStatus?.PENDING ?? 0,
      defaulted: totals.byStatus?.DEFAULTED ?? 0,
      total: totals.total
    };
  }, [loansData]);

  const savingsSummary = useMemo(() => {
    const totals = savingsData?.totals;
    if (!totals) {
      return {
        totalBalance: null,
        totalAccounts: 0,
        monthlyTarget: null,
        activeRecently: 0,
        averageBalance: null,
        byTypeEntries: [] as Array<[string, { count: number; balance: number }]>
      };
    }

    const averageBalance = totals.total > 0 ? totals.sum / totals.total : null;
    const byTypeEntries = Object.entries(totals.byType ?? {});

    return {
      totalBalance: totals.sum,
      totalAccounts: totals.total,
      monthlyTarget: totals.monthlyTarget,
      activeRecently: totals.activeRecently,
      averageBalance,
      byTypeEntries
    };
  }, [savingsData]);

  const insuranceSummary = useMemo(() => {
    const totals = insuranceData?.totals;
    const premiumPool =
      insuranceData?.items.reduce((sum, policy) => sum + (policy.premiumAmount ?? 0), 0) ?? null;

    if (!totals) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        expired: 0,
        expiringSoon: 0,
        premiumPool
      };
    }

    return {
      total: totals.total,
      active: totals.byStatus?.ACTIVE ?? 0,
      pending: totals.byStatus?.PENDING ?? 0,
      expired: totals.byStatus?.EXPIRED ?? 0,
      expiringSoon: totals.expiringSoon,
      premiumPool
    };
  }, [insuranceData]);

  const savingsTypeOptions = useMemo(
    () =>
      savingsSummary.byTypeEntries
        .map(([key, metrics]) => ({
          key,
          label: labelForSavingsType(key),
          count: metrics.count,
          balance: metrics.balance
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [savingsSummary.byTypeEntries]
  );

  const recentLoans = useMemo(() => {
    if (!loansData) return [];
    return loansData.items.slice(0, 8);
  }, [loansData]);

  const recentInsurance = useMemo(() => {
    if (!insuranceData) return [];
    return insuranceData.items.slice(0, 8);
  }, [insuranceData]);

  const filteredSavings = useMemo(() => {
    if (!savingsData) return [];
    const baseItems =
      selectedSavingsType === 'ALL'
        ? savingsData.items
        : savingsData.items.filter(
            account => normalizeSavingsTypeKey(account.accountType) === selectedSavingsType
          );
    return baseItems.slice(0, 8);
  }, [savingsData, selectedSavingsType]);

  const isLoading = loading;

  const renderLoadingRow = (colSpan: number) => (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <div className="flex items-center justify-center py-8 text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading data...
        </div>
      </TableCell>
    </TableRow>
  );

  const renderEmptyRow = (colSpan: number, message: string) => (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-gray-500">
        {message}
      </TableCell>
    </TableRow>
  );

  return (
    <AdminLayout user={user} currentPage="admin/financial-overview" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-sm text-gray-600">
            Track loans, savings, and insurance performance across the SACCO in real time.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Loan Portfolio</CardTitle>
              <DollarSign className="h-5 w-5 text-[var(--neon-turquoise)]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading metrics...
                </div>
              ) : (
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Value</span>
                    <span className="font-medium text-gray-900">{formatCurrency(loansSummary.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disbursed Loans</span>
                    <span className="font-medium text-gray-900">{formatNumber(loansSummary.disbursed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding Amount</span>
                    <span className="font-medium text-orange-600">{formatCurrency(loansSummary.outstanding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Applications</span>
                    <span className="font-medium text-blue-600">{formatNumber(loansSummary.pending)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Defaulted Loans</span>
                    <span className="font-medium text-red-600">{formatNumber(loansSummary.defaulted)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Savings Performance</CardTitle>
              <PiggyBank className="h-5 w-5 text-[var(--neon-turquoise)]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading metrics...
                </div>
              ) : (
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Balance</span>
                    <span className="font-medium text-gray-900">{formatCurrency(savingsSummary.totalBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Accounts</span>
                    <span className="font-medium text-gray-900">{formatNumber(savingsSummary.totalAccounts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Target</span>
                    <span className="font-medium text-green-600">{formatCurrency(savingsSummary.monthlyTarget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active (30 days)</span>
                    <span className="font-medium text-blue-600">{formatNumber(savingsSummary.activeRecently)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Balance</span>
                    <span className="font-medium text-gray-900">{formatCurrency(savingsSummary.averageBalance)}</span>
                  </div>

                  {savingsSummary.byTypeEntries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase text-gray-500">Account Mix</p>
                      {savingsSummary.byTypeEntries.slice(0, 4).map(([typeKey, metrics]) => (
                        <div key={typeKey} className="flex justify-between">
                          <span>{labelForSavingsType(typeKey)}</span>
                          <span className="font-medium">
                            {formatNumber(metrics.count)} accounts | {formatCurrency(metrics.balance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Insurance Coverage</CardTitle>
              <Shield className="h-5 w-5 text-[var(--neon-turquoise)]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading metrics...
                </div>
              ) : (
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Policies</span>
                    <span className="font-medium text-gray-900">{formatNumber(insuranceSummary.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Policies</span>
                    <span className="font-medium text-gray-900">{formatNumber(insuranceSummary.active)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Policies</span>
                    <span className="font-medium text-blue-600">{formatNumber(insuranceSummary.pending)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiring Soon</span>
                    <span className="font-medium text-orange-600">{formatNumber(insuranceSummary.expiringSoon)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Premium Pool</span>
                    <span className="font-medium text-gray-900">{formatCurrency(insuranceSummary.premiumPool)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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

              <TabsContent value="loans" className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Loan Activity</h3>
                  <Button variant="outline" onClick={() => onNavigate('admin/loans')}>
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
                      <TableHead>Applied On</TableHead>
                      <TableHead>Approved On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? renderLoadingRow(6)
                      : recentLoans.length === 0
                      ? renderEmptyRow(6, 'No loan records available.')
                      : recentLoans.map(loan => (
                          <TableRow key={loan.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-400" />
                                {loan.applicant?.name ?? 'Unknown member'}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{loan.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(loan.applicationDate)}</TableCell>
                            <TableCell>
                              {loan.approvedAt ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {formatDate(loan.approvedAt)}
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="savings" className="mt-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Savings Activity</h3>
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedSavingsType}
                      onValueChange={setSelectedSavingsType}
                      disabled={savingsTypeOptions.length === 0}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="All Account Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Account Types</SelectItem>
                        {savingsTypeOptions.map(option => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label} ({formatNumber(option.count)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => onNavigate('admin/savings')}>
                      View All Accounts
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Monthly Target</TableHead>
                      <TableHead>Last Deposit</TableHead>
                      <TableHead>Vehicle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? renderLoadingRow(6)
                      : filteredSavings.length === 0
                      ? renderEmptyRow(6, 'No savings accounts found.')
                      : filteredSavings.map(account => (
                          <TableRow key={account.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-400" />
                                {account.user?.name ?? 'Unknown member'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{accountTypeLabel(account.accountType)}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(account.balance)}</TableCell>
                            <TableCell>{formatCurrency(account.monthlyTarget)}</TableCell>
                            <TableCell>
                              {account.lastDeposit ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {formatDate(account.lastDeposit)}
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>{account.vehicle?.plateNumber ?? 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="insurance" className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Recent Insurance Activity</h3>
                  <Button variant="outline" onClick={() => onNavigate('admin/insurance')}>
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
                    {isLoading
                      ? renderLoadingRow(6)
                      : recentInsurance.length === 0
                      ? renderEmptyRow(6, 'No insurance policies found.')
                      : recentInsurance.map(policy => (
                          <TableRow key={policy.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-gray-400" />
                                {policy.vehicle?.owner?.name ?? 'Unknown member'}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {policy.vehicle?.plateNumber ?? 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{policy.policyType ?? 'N/A'}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(policy.premiumAmount)}</TableCell>
                            <TableCell>
                              {policy.expiryDate ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {formatDate(policy.expiryDate)}
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(policy.status)}>{policy.status}</Badge>
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
