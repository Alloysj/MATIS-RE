import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PermissionButton } from '../auth/PermissionButton';
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
  Clock,
  RefreshCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import {
  DashboardUsersResponse,
  DashboardVehiclesResponse,
  DashboardLoansResponse,
  DashboardInsuranceResponse,
  fetchDashboardUsers,
  fetchDashboardVehicles,
  fetchDashboardLoans,
  fetchDashboardInsurance
} from '../../services/admin';

interface AdminDashboardProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<AdminDashboardLayoutProps>;
  currentPage?: string;
}

interface AdminDashboardLayoutProps {
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

type PanelState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

const createInitialState = <T,>(): PanelState<T> => ({
  data: null,
  loading: true,
  error: null
});

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MonthBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const createMonthBuckets = (months = 6): MonthBucket[] => {
  const normalized = clamp(Math.floor(months), 1, 24);
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const buckets: MonthBucket[] = [];

  for (let i = normalized - 1; i >= 0; i -= 1) {
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    buckets.push({
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      label: MONTH_NAMES[start.getUTCMonth()],
      start,
      end
    });
  }

  return buckets;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return `KSh ${value.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return value.toLocaleString('en-KE');
};

const roleCategoryColors: Record<string, string> = {
  'Vehicle Owners': 'var(--neon-turquoise)',
  Drivers: 'var(--neon-yellow)',
  Staff: 'var(--neon-orange)',
  Admins: 'var(--neon-purple)',
  Other: 'var(--electric-blue)',
  Unassigned: 'var(--hot-pink)'
};

export function AdminDashboard({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/dashboard'
}: AdminDashboardProps) {
  const [usersState, setUsersState] = useState<PanelState<DashboardUsersResponse>>(createInitialState);
  const [vehiclesState, setVehiclesState] = useState<PanelState<DashboardVehiclesResponse>>(createInitialState);
  const [loansState, setLoansState] = useState<PanelState<DashboardLoansResponse>>(createInitialState);
  const [insuranceState, setInsuranceState] = useState<PanelState<DashboardInsuranceResponse>>(createInitialState);

  const loadUsers = useCallback(async () => {
    setUsersState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDashboardUsers();
      setUsersState({ data, loading: false, error: null });
    } catch (error) {
      console.error('Failed to load admin dashboard users data', error);
      setUsersState({
        data: null,
        loading: false,
        error: null
      });
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    setVehiclesState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDashboardVehicles();
      setVehiclesState({ data, loading: false, error: null });
    } catch (error) {
      console.error('Failed to load admin dashboard vehicles data', error);
      setVehiclesState({
        data: null,
        loading: false,
        error: null
      });
    }
  }, []);

  const loadLoans = useCallback(async () => {
    setLoansState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDashboardLoans();
      setLoansState({ data, loading: false, error: null });
    } catch (error) {
      console.error('Failed to load admin dashboard loans data', error);
      setLoansState({
        data: null,
        loading: false,
        error: null
      });
    }
  }, []);

  const loadInsurance = useCallback(async () => {
    setInsuranceState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDashboardInsurance();
      setInsuranceState({ data, loading: false, error: null });
    } catch (error) {
      console.error('Failed to load admin dashboard insurance data', error);
      setInsuranceState({
        data: null,
        loading: false,
        error: null
      });
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadVehicles();
    loadLoans();
    loadInsurance();
  }, [loadUsers, loadVehicles, loadLoans, loadInsurance]);

  const newUsersThisMonth = useMemo(() => {
    if (!usersState.data) return 0;
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    return usersState.data.items.filter(userItem => {
      const created = new Date(userItem.createdAt);
      return created.getUTCFullYear() === currentYear && created.getUTCMonth() === currentMonth;
    }).length;
  }, [usersState.data]);

  const stats = useMemo(() => {
    const totalUsers = usersState.data?.totals.total ?? null;
    const activeVehicles = vehiclesState.data?.totals.byStatus.ACTIVE ?? null;
    const totalLoanAmount = loansState.data?.totals.sum ?? null;
    const pendingLoans = loansState.data?.totals.byStatus.PENDING ?? 0;
    const activePolicies = insuranceState.data?.totals.byStatus.ACTIVE ?? null;
    const expiringPolicies = insuranceState.data?.totals.expiringSoon ?? 0;
    const pendingUsers = usersState.data?.totals.byStatus.PENDING ?? 0;
    const vehiclesPendingRegistration = vehiclesState.data?.totals.byRegistrationStatus.PENDING ?? 0;

    return [
      {
        key: 'users',
        title: 'Total Users',
        value: formatNumber(totalUsers),
        change: usersState.loading ? 'Loading...' : `${newUsersThisMonth} new this month`,
        icon: Users,
        color: 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]',
        description: `${pendingUsers} pending approval`
      },
      {
        key: 'vehicles',
        title: 'Active Vehicles',
        value: formatNumber(activeVehicles),
        change: vehiclesState.loading ? 'Loading...' : `${vehiclesPendingRegistration} pending approval`,
        icon: Car,
        color: 'from-[var(--neon-yellow)] to-[var(--neon-orange)]',
        description: 'Fleet overview'
      },
      {
        key: 'loans',
        title: 'Total Loans',
        value: formatCurrency(totalLoanAmount),
        change: loansState.loading ? 'Loading...' : `${pendingLoans} applications pending`,
        icon: DollarSign,
        color: 'from-[var(--neon-orange)] to-[var(--hot-pink)]',
        description: 'Loan portfolio'
      },
      {
        key: 'insurance',
        title: 'Insurance Active',
        value: formatNumber(activePolicies),
        change: insuranceState.loading ? 'Loading...' : `${expiringPolicies} expiring soon`,
        icon: Shield,
        color: 'from-[var(--neon-purple)] to-[var(--neon-turquoise)]',
        description: 'Policy monitoring'
      }
    ];
  }, [
    usersState.data,
    usersState.loading,
    usersState.error,
    newUsersThisMonth,
    vehiclesState.data,
    vehiclesState.loading,
    vehiclesState.error,
    loansState.data,
    loansState.loading,
    loansState.error,
    insuranceState.data,
    insuranceState.loading,
    insuranceState.error
  ]);

  const financialData = useMemo(() => {
    const buckets = createMonthBuckets(6);
    const mapped = new Map(
      buckets.map(bucket => [
        bucket.key,
        {
          month: bucket.label,
          loans: 0,
          savings: 0,
          insurance: 0
        }
      ])
    );

    const assignToBucket = (date: string | null | undefined, amount: number | null | undefined, key: 'loans' | 'savings' | 'insurance') => {
      if (!date || amount === null || amount === undefined || Number.isNaN(amount)) return;
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return;
      const bucketKey = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
      const bucket = mapped.get(bucketKey);
      if (bucket) {
        bucket[key] += amount;
      }
    };

    loansState.data?.items.forEach(loan => {
      assignToBucket(loan.applicationDate, loan.amount ?? 0, 'loans');
    });

    vehiclesState.data?.items.forEach(vehicle => {
      const savingsAmount = vehicle.metrics.savingsBalance ?? 0;
      assignToBucket(vehicle.lastPayment?.date ?? null, savingsAmount, 'savings');
    });

    insuranceState.data?.items.forEach(policy => {
      assignToBucket(policy.startDate ?? policy.expiryDate, policy.premiumAmount ?? 0, 'insurance');
    });

    return Array.from(mapped.values());
  }, [loansState.data, vehiclesState.data, insuranceState.data]);

  const userRoleData = useMemo(() => {
    if (!usersState.data) return [];

    const counts: Record<string, number> = {
      'Vehicle Owners': 0,
      Drivers: 0,
      Staff: 0,
      Admins: 0,
      Other: 0,
      Unassigned: 0
    };

    const categorize = (roleName: string | null | undefined): keyof typeof counts => {
      if (!roleName) return 'Unassigned';
      const normalized = roleName.trim().toLowerCase();
      if (normalized.includes('admin')) return 'Admins';
      if (normalized.includes('owner')) return 'Vehicle Owners';
      if (normalized.includes('driver')) return 'Drivers';
      if (normalized.includes('staff') || normalized.includes('employee')) return 'Staff';
      return 'Other';
    };

    usersState.data.items.forEach(item => {
      const category = categorize(item.role?.name);
      counts[category] += 1;
    });

    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: roleCategoryColors[name] ?? 'var(--electric-blue)'
      }));
  }, [usersState.data]);

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or approve user accounts',
      icon: Users,
      color: 'from-[var(--neon-turquoise)] to-[var(--electric-blue)]',
      action: () => onNavigate('app/members'),
      rule: { anyOf: ['MEMBERS:READ', 'MEMBERS:READ_SELF', 'MEMBERS:CREATE', 'MEMBERS:APPROVE'] }
    },
    {
      title: 'Fleet Management',
      description: 'Oversee vehicle registrations and status',
      icon: Car,
      color: 'from-[var(--neon-yellow)] to-[var(--neon-orange)]',
      action: () => onNavigate('app/vehicles'),
      rule: { anyOf: ['VEHICLES:READ', 'VEHICLES:READ_SELF'] }
    },
    {
      title: 'Approve Loans',
      description: 'Review and approve loan applications',
      icon: DollarSign,
      color: 'from-[var(--neon-orange)] to-[var(--hot-pink)]',
      action: () => onNavigate('app/loans'),
      rule: { anyOf: ['LOANS:VIEW', 'LOANS:APPLY', 'LOANS:APPROVE'] }
    },
    {
      title: 'Generate Reports',
      description: 'Create financial and operational reports',
      icon: FileText,
      color: 'from-[var(--neon-purple)] to-[var(--neon-turquoise)]',
      action: () => onNavigate('app/reports/users'),
      rule: { anyOf: ['FINANCE:VIEW', 'MEMBERS:READ', 'VEHICLES:READ'] }
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
      message: 'Vehicle KCA 123A added to fleet',
      time: '25 minutes ago',
      status: 'approved',
      icon: Car
    },
    {
      type: 'insurance',
      message: 'Policy renewal required: KCB 456B',
      time: '1 hour ago',
      status: 'warning',
      icon: Shield
    }
  ];

  const renderLoadingState = (label: string) => (
    <div className="flex items-center justify-center h-[300px] text-sm text-gray-500">
      Loading {label}...
    </div>
  );

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.key} className="relative overflow-hidden">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
                  <div className="p-2 rounded-lg bg-gray-50">
                    <stat.icon className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4 mr-1 text-[var(--neon-turquoise)]" />
                  <span>{stat.change}</span>
                </div>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Financial Activity (6 Months)</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { loadLoans(); loadVehicles(); loadInsurance(); }} aria-label="Refresh financial data">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loansState.loading || vehiclesState.loading || insuranceState.loading ? (
                renderLoadingState('financial data')
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`KSh ${value.toLocaleString()}`, '']} />
                    <Bar dataKey="loans" fill="var(--neon-turquoise)" name="Loans" />
                    <Bar dataKey="savings" fill="var(--neon-yellow)" name="Savings" />
                    <Bar dataKey="insurance" fill="var(--neon-orange)" name="Insurance" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Distribution</CardTitle>
                <Button variant="ghost" size="icon" onClick={loadUsers} aria-label="Refresh user distribution">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersState.loading ? (
                renderLoadingState('user distribution')
              ) : userRoleData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-sm text-gray-500">
                  No user role data available.
                </div>
              ) : (
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
                    <Tooltip formatter={(value: number) => [`${value} users`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quick Actions</CardTitle>
              <PermissionButton
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('app/members')}
                rule={{ anyOf: ['MEMBERS:READ', 'MEMBERS:READ_SELF', 'MEMBERS:CREATE', 'MEMBERS:APPROVE'] }}
              >
                <FileText className="h-4 w-4" />
              </PermissionButton>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <PermissionButton
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex-col items-start space-y-2 hover:shadow-lg transition-all"
                  onClick={action.action}
                  rule={action.rule}
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
                </PermissionButton>
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
                  <div
                    className={`p-2 rounded-full ${
                      activity.status === 'approved'
                        ? 'bg-green-100'
                        : activity.status === 'pending'
                          ? 'bg-yellow-100'
                          : activity.status === 'warning'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                    }`}
                  >
                    <activity.icon
                      className={`h-4 w-4 ${
                        activity.status === 'approved'
                          ? 'text-green-600'
                          : activity.status === 'pending'
                            ? 'text-yellow-600'
                            : activity.status === 'warning'
                              ? 'text-red-600'
                              : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <Badge
                    variant={
                      activity.status === 'approved'
                        ? 'default'
                        : activity.status === 'pending'
                          ? 'secondary'
                          : activity.status === 'warning'
                            ? 'destructive'
                            : 'outline'
                    }
                  >
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
    </LayoutComponent>
  );
}


