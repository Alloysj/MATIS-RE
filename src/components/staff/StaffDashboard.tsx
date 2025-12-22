import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  User,
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner@2.0.3';
import {
  getReports,
  getSalaries,
  getStaffDetails,
  StaffDetails
} from '../../services/staff';

interface StaffDashboardProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<StaffDashboardLayoutProps>;
  currentPage?: string;
}

interface StaffDashboardLayoutProps {
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

type ReportsResponse = {
  salaries?: any[];
  advances?: any[];
  expenses?: any[];
};

type ActivityItem = {
  id: string;
  description: string;
  timestamp: string | null;
  status: string;
  type: 'salary' | 'advance' | 'expense';
};

const chartPalette = ['#14F195', '#FFE838', '#FF6B35', '#9945FF', '#00D4FF'];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Something went wrong while loading staff data.';
};

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && 'toString' in value) {
    const parsed = Number((value as { toString(): string }).toString());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value);

const formatMonthLabel = (value: string | Date | null | undefined): string => {
  if (!value) return 'Unknown';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date?.getTime?.())) return 'Unknown';
  return new Intl.DateTimeFormat('en-KE', { month: 'short', year: 'numeric' }).format(date as Date);
};

const formatRelativeTime = (value: string | Date | null): string => {
  if (!value) return 'Unknown';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date?.getTime?.())) return 'Unknown';
  const diff = Date.now() - (date as Date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
};

const formatStatusLabel = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const getActivityBadgeVariant = (type: ActivityItem['type']) => {
  switch (type) {
    case 'salary':
      return 'secondary';
    case 'advance':
      return 'outline';
    case 'expense':
    default:
      return 'secondary';
  }
};

export function StaffDashboard({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = StaffLayout,
  currentPage = 'staff/dashboard'
}: StaffDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<StaffDetails | null>(null);
  const [reports, setReports] = useState<ReportsResponse>({});
  const [personalSalary, setPersonalSalary] = useState<any | null>(null);

  const loadData = useCallback(async (lifecycle?: { current: boolean }) => {
    const canUpdate = () => (lifecycle ? lifecycle.current : true);
    if (canUpdate()) {
      setLoading(true);
      setError(null);
    }
    try {
      const [detailsResponse, reportsResponse, salaryResponse] = await Promise.all([
        getStaffDetails().catch(() => null),
        getReports().catch(() => null),
        getSalaries().catch(() => null)
      ]);
      if (!canUpdate()) return;
      setDetails(detailsResponse ?? null);
      setReports(reportsResponse ?? {});
      setPersonalSalary(salaryResponse ?? null);
    } catch (err) {
      if (!canUpdate()) return;
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      if (canUpdate()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const lifecycle = { current: true };
    loadData(lifecycle);
    return () => {
      lifecycle.current = false;
    };
  }, [loadData]);

  const salaryRecords = useMemo(() => reports.salaries ?? [], [reports.salaries]);
  const advanceRecords = useMemo(() => reports.advances ?? [], [reports.advances]);
  const expenseRecords = useMemo(() => reports.expenses ?? [], [reports.expenses]);

  const totalPayrollAmount = useMemo(
    () => salaryRecords.reduce((sum, record) => sum + toNumber(record.netSalary ?? record.basicSalary), 0),
    [salaryRecords]
  );

  const totalExpensesAmount = useMemo(
    () => expenseRecords.reduce((sum, record) => sum + toNumber(record.amount), 0),
    [expenseRecords]
  );

  const outstandingAdvanceAmount = useMemo(
    () =>
      advanceRecords
        .filter((advance) => {
          const status = (advance.status ?? '').toUpperCase();
          return status === 'PENDING' || status === 'APPROVED';
        })
        .reduce((sum, advance) => sum + toNumber(advance.amount), 0),
    [advanceRecords]
  );

  const pendingAdvanceCount = useMemo(
    () =>
      advanceRecords.reduce((count, advance) => {
        const status = (advance.status ?? '').toUpperCase();
        return status === 'PENDING' ? count + 1 : count;
      }, 0),
    [advanceRecords]
  );

  const salaryStatusData = useMemo(() => {
    if (!salaryRecords.length) return [];
    const counts = salaryRecords.reduce<Record<string, number>>((acc, record) => {
      const status = formatStatusLabel(record.status ?? 'UNKNOWN');
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: chartPalette[index % chartPalette.length]
    }));
  }, [salaryRecords]);

  const advanceStatusData = useMemo(() => {
    if (!advanceRecords.length) return [];
    const counts = advanceRecords.reduce<Record<string, number>>((acc, record) => {
      const status = formatStatusLabel(record.status ?? 'UNKNOWN');
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: chartPalette[(index + 2) % chartPalette.length]
    }));
  }, [advanceRecords]);

  const monthlySummary = useMemo(() => {
    const bucket = new Map<string, { payroll: number; expenses: number }>();

    salaryRecords.forEach((record) => {
      const key = formatMonthLabel(record.payDate ?? record.createdAt ?? record.updatedAt ?? null);
      if (!bucket.has(key)) bucket.set(key, { payroll: 0, expenses: 0 });
      bucket.get(key)!.payroll += toNumber(record.netSalary ?? record.basicSalary);
    });

    expenseRecords.forEach((record) => {
      const key = formatMonthLabel(record.date ?? record.createdAt ?? record.updatedAt ?? null);
      if (!bucket.has(key)) bucket.set(key, { payroll: 0, expenses: 0 });
      bucket.get(key)!.expenses += toNumber(record.amount);
    });

    const entries = Array.from(bucket.entries()).map(([month, values]) => ({
      month,
      payroll: values.payroll,
      expenses: values.expenses
    }));

    return entries.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [salaryRecords, expenseRecords]);

  const recentActivities = useMemo(() => {
    const items: ActivityItem[] = [];

    salaryRecords.forEach((record) => {
      items.push({
        id: `salary-${record.id}`,
        description: `Salary payment of ${formatCurrency(
          toNumber(record.netSalary ?? record.basicSalary)
        )} processed`,
        timestamp: record.payDate ?? record.createdAt ?? null,
        status: formatStatusLabel(record.status ?? 'UNKNOWN'),
        type: 'salary'
      });
    });

    advanceRecords.forEach((record) => {
      items.push({
        id: `advance-${record.id}`,
        description: `Advance request for ${formatCurrency(toNumber(record.amount))}`,
        timestamp: record.applicationDate ?? record.createdAt ?? null,
        status: formatStatusLabel(record.status ?? 'UNKNOWN'),
        type: 'advance'
      });
    });

    expenseRecords.forEach((record) => {
      items.push({
        id: `expense-${record.id}`,
        description: `Expense recorded: ${record.category ?? 'General'} (${formatCurrency(
          toNumber(record.amount)
        )})`,
        timestamp: record.date ?? record.createdAt ?? null,
        status: formatStatusLabel(record.status ?? 'UNKNOWN'),
        type: 'expense'
      });
    });

    return items
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [salaryRecords, advanceRecords, expenseRecords]);

  const latestNetSalary = useMemo(() => {
    if (!personalSalary) return null;
    return formatCurrency(toNumber(personalSalary.netSalary ?? personalSalary.basicSalary));
  }, [personalSalary]);

  const quickStats = useMemo(
    () => [
      {
        title: 'Payroll Records',
        value: formatNumber(salaryRecords.length),
        icon: Users,
        accent: 'border-[var(--neon-turquoise)]',
        iconColor: 'text-[var(--neon-turquoise)]'
      },
      {
        title: 'Pending Advances',
        value: formatNumber(pendingAdvanceCount),
        icon: Clock,
        accent: 'border-[var(--neon-yellow)]',
        iconColor: 'text-[var(--neon-orange)]'
      },
      {
        title: 'Total Expenses',
        value: formatCurrency(totalExpensesAmount),
        icon: Receipt,
        accent: 'border-[var(--neon-purple)]',
        iconColor: 'text-[var(--neon-purple)]'
      },
      {
        title: 'Net Payroll',
        value: formatCurrency(totalPayrollAmount),
        icon: DollarSign,
        accent: 'border-[var(--neon-orange)]',
        iconColor: 'text-[var(--neon-orange)]'
      }
    ],
    [salaryRecords.length, pendingAdvanceCount, totalExpensesAmount, totalPayrollAmount]
  );

  const quickLinks = useMemo(
    () => [
      {
        title: 'Add Expense',
        description: 'Record new SACCO expense',
        icon: Receipt,
        action: () => onNavigate('app/expenses'),
        color: 'from-[var(--neon-orange)] to-[var(--neon-yellow)]'
      },
      {
        title: 'Pending Loans',
        description: 'Review loan applications',
        icon: CreditCard,
        action: () => onNavigate('app/loans/manage'),
        color: 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]'
      },
      {
        title: 'Salary Advance',
        description: 'Apply for salary advance',
        icon: DollarSign,
        action: () => onNavigate('app/payroll'),
        color: 'from-[var(--neon-purple)] to-[var(--hot-pink)]'
      },
      {
        title: 'Financial Reports',
        description: 'Generate financial summaries',
        icon: TrendingUp,
        action: () => onNavigate('app/reports'),
        color: 'from-[var(--lime-green)] to-[var(--neon-turquoise)]'
      }
    ],
    [onNavigate]
  );

  const renderPieLegend = (data: { name: string; color: string }[]) => (
    <div className="flex justify-center flex-wrap gap-4 mt-4">
      {data.map((item) => (
        <div key={item.name} className="flex items-center text-sm text-gray-600">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
          {item.name}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      </LayoutComponent>
    );
  }

  if (error) {
    return (
      <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
        <Card className="max-w-xl mx-auto mt-24">
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => loadData()}>Retry</Button>
          </CardContent>
        </Card>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 rounded-xl p-6 border border-[var(--neon-turquoise)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-[var(--neon-turquoise)]">
                <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                  {(details?.name ?? user?.name ?? 'S').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Welcome back, {details?.name ?? user?.name ?? 'Staff'}!</h2>
                <p className="text-gray-600">
                  {details?.position ? `Your current position is ${details.position}.` : "Here's what’s happening with MATIS SACCO today."}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('app/staff/profile')}
              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
            >
              <User className="w-4 h-4 mr-2" />
              Update Profile
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat) => (
            <Card key={stat.title} className={`border-l-4 ${stat.accent}`}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Salary Status Distribution</CardTitle>
              <CardDescription>Overview of payroll processing states</CardDescription>
            </CardHeader>
            <CardContent>
              {salaryStatusData.length ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salaryStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {salaryStatusData.map((entry, index) => (
                            <Cell key={`salary-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {renderPieLegend(salaryStatusData)}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">No payroll records available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advance Status Distribution</CardTitle>
              <CardDescription>Tracking outstanding salary advances</CardDescription>
            </CardHeader>
            <CardContent>
              {advanceStatusData.length ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={advanceStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {advanceStatusData.map((entry, index) => (
                            <Cell key={`advance-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {renderPieLegend(advanceStatusData)}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">No advance requests have been submitted.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Monthly payroll versus expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-80">
                  {monthlySummary.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySummary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                        <Bar dataKey="payroll" fill="var(--neon-orange)" name="Payroll" />
                        <Bar dataKey="expenses" fill="var(--neon-turquoise)" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">
                      Insufficient data to generate monthly trends.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--electric-blue)]/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Payroll Processed</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPayrollAmount)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-[var(--neon-turquoise)]" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-[var(--neon-orange)]/10 to-[var(--neon-yellow)]/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpensesAmount)}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-[var(--neon-orange)]" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-[var(--neon-purple)]/10 to-[var(--hot-pink)]/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Outstanding Advances</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(outstandingAdvanceAmount)}</p>
                      {latestNetSalary && (
                        <p className="text-xs text-gray-500 mt-1">Latest net salary: {latestNetSalary}</p>
                      )}
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
            <CardDescription>Latest payroll, advances, and expense updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {activity.type === 'salary' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {activity.type === 'advance' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    {activity.type === 'expense' && <Receipt className="h-5 w-5 text-blue-500" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
                    </div>
                    <Badge variant={getActivityBadgeVariant(activity.type)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutComponent>
  );
}
