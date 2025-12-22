import { useCallback, useEffect, useMemo, useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Car, 
  CreditCard, 
  PiggyBank, 
  Receipt, 
  Download, 
  Search, 
  Filter,
  Smartphone,
  Banknote,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Send,
  Shield,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  fetchFinanceAuditLog,
  fetchFinanceDailySummary,
  fetchFinanceTransactions,
  FinanceAuditLogEntry,
  FinanceDailySummaryResponse,
  FinanceMemberSuggestion,
  FinanceRecentRemittance,
  FinanceTransactionRecord,
  searchFinanceMembers,
  submitFinancePayment
} from '../../services/staff';
import { processPayment } from '../../services/finance';

const emptySummary: FinanceDailySummaryResponse = {
  date: new Date().toISOString(),
  totals: {
    operations: 0,
    insurance: 0,
    loanRepayments: 0,
    savings: 0,
    expenditures: 0,
    netFlow: 0
  },
  trend: [],
  expectations: {
    expectedTrips: 0,
    actualTrips: 0,
    expectedOps: 0,
    expectedInsurance: 0
  },
  routeSummary: [],
  recentRemittances: []
};

interface TreasurerDashboardProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function TreasurerDashboard({ user, onNavigate, onLogout }: TreasurerDashboardProps) {
  const [dailySummary, setDailySummary] = useState<FinanceDailySummaryResponse>(emptySummary);
  const [recentRemittances, setRecentRemittances] = useState<FinanceRecentRemittance[]>([]);
  const [memberResults, setMemberResults] = useState<FinanceMemberSuggestion[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransactionRecord[]>([]);
  const [auditLog, setAuditLog] = useState<FinanceAuditLogEntry[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');
  const [selectedMember, setSelectedMember] = useState<FinanceMemberSuggestion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMode, setPaymentMode] = useState<'stk' | 'offline'>('stk');
  const [paymentType, setPaymentType] = useState('full-remittance');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transactionFilter, setTransactionFilter] = useState({
    category: 'all',
    method: 'all',
    status: 'all',
    dateRange: 'today'
  });

  const summaryTotals = dailySummary?.totals ?? emptySummary.totals;
  const summaryExpectations = dailySummary?.expectations ?? emptySummary.expectations;

  const normalizeMember = useCallback(
    (entry: FinanceMemberSuggestion | Record<string, any>): FinanceMemberSuggestion => {
      if (!entry) {
        return {
          id: `${Date.now()}-${Math.random()}`,
          name: 'Unknown Member',
          phone: ''
        };
      }

      return {
        id: String(
          entry.id ??
            entry.userId ??
            entry.user?.id ??
            entry.paymentId ??
            `${entry.memberNumber ?? 'member'}-${Date.now()}`
        ),
        name: entry.name ?? entry.user?.name ?? 'Unknown Member',
        phone: entry.phone ?? entry.user?.phone ?? '',
        memberNumber: entry.memberNumber ?? entry.user?.memberNumber ?? entry.memberNo ?? 'N/A',
        vehicleId: entry.vehicleId ?? entry.vehicle?.id,
        vehiclePlate: entry.vehiclePlate ?? entry.vehicle?.plateNumber ?? entry.vehiclePlateNumber ?? 'N/A',
        route: entry.route ?? entry.vehicle?.route ?? entry.routeName ?? 'Unspecified'
      };
    },
    []
  );

  const loadDailySummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchFinanceDailySummary({ date: selectedDate });
      if (data) {
        setDailySummary({
          ...emptySummary,
          ...data,
          totals: { ...emptySummary.totals, ...data.totals },
          trend: data.trend ?? [],
          expectations: data.expectations ?? emptySummary.expectations
        });

        const remittanceSource =
          data.recentRemittances && data.recentRemittances.length ? data.recentRemittances : [];

        setRecentRemittances(
          remittanceSource.map((remit) => ({
            id: remit.id,
            member: remit.member ?? 'Unknown Member',
            memberNumber: remit.memberNumber ?? 'N/A',
            vehiclePlate: remit.vehiclePlate ?? 'Unassigned',
            vehicleId: remit.vehicleId,
            route: remit.route ?? 'Primary Route',
            amount: remit.amount ?? 0,
            method: remit.method ?? 'M-PESA',
            time: remit.time ?? new Date().toISOString(),
            status: remit.status ?? 'COMPLETED'
          }))
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load finance summary.';
      toast.error('Finance summary unavailable', { description: message });
      setDailySummary((current) => current ?? emptySummary);
      setRecentRemittances((current) => (current.length ? current : []));
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedDate]);

  const { category, method, status, dateRange } = transactionFilter;

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const response = await fetchFinanceTransactions({
        date: selectedDate,
        category: category !== 'all' ? category : undefined,
        method: method !== 'all' ? method : undefined,
        status: status !== 'all' ? status : undefined,
        range: dateRange,
        limit: 100
      });
      const items = response.transactions ?? response.items ?? [];
      setTransactions(items.length ? items : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load finance transactions.';
      toast.error('Transactions unavailable', { description: message });
      setTransactions((current) => (current.length ? current : []));
    } finally {
      setTransactionsLoading(false);
    }
  }, [selectedDate, category, method, status, dateRange]);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const log = await fetchFinanceAuditLog({ date: selectedDate, limit: 10 });
      setAuditLog(log.length ? log : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load finance activity log.';
      toast.error('Audit log unavailable', { description: message });
      setAuditLog((current) => (current.length ? current : []));
    } finally {
      setAuditLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDailySummary();
  }, [loadDailySummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadTransactions]);

  useEffect(() => {
    loadAuditLog();
  }, [loadAuditLog]);

  useEffect(() => {
    if (!searchTerm) {
      setMemberResults([]);
      setMemberLookupLoading(false);
      return;
    }

    setMemberLookupLoading(true);
    const handle = setTimeout(async () => {
      try {
        const response = await searchFinanceMembers({ search: searchTerm, limit: 10 });
        const members =
          response.members && response.members.length
            ? response.members
            : response.payments?.map((entry) =>
                normalizeMember({
                  id: entry.id,
                  name: entry.user?.name,
                  phone: entry.user?.phone,
                  memberNumber: entry.memberNumber,
                  vehicleId: entry.vehicle?.id,
                  vehiclePlate: entry.vehicle?.plateNumber,
                  route: entry.vehicle?.route
                })
              ) ?? [];

        setMemberResults(members.length ? members.map((member) => normalizeMember(member)) : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to search members right now.';
        toast.error('Member lookup failed', { description: message });
        setMemberResults([]);
      } finally {
        setMemberLookupLoading(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [normalizeMember, searchTerm]);

  const allocationData = useMemo(() => {
    const totals = summaryTotals;
    return [
      { name: 'Operations', value: totals.operations, color: '#0EA5E9' },
      { name: 'Insurance', value: totals.insurance, color: '#F97316' },
      { name: 'Loan Repayment', value: totals.loanRepayments, color: '#8B5CF6' },
      { name: 'Savings', value: totals.savings, color: '#10B981' }
    ];
  }, [summaryTotals]);

  const trendData = useMemo(() => dailySummary?.trend ?? [], [dailySummary]);

  const tripProgress = useMemo(() => {
    const expected = summaryExpectations.expectedTrips || 0;
    const actual = summaryExpectations.actualTrips || 0;
    if (!expected || expected <= 0) {
      return 0;
    }
    return Math.min((actual / expected) * 100, 100);
  }, [summaryExpectations]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return [];
    const query = searchTerm.toLowerCase();
    return memberResults.filter((member) => {
      const target = [
        member.name,
        member.phone,
        member.vehiclePlate,
        member.memberNumber,
        member.route
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return target.includes(query);
    });
  }, [memberResults, searchTerm]);

  const filteredTransactions = useMemo(() => {
    const normalizedCategory = category.toLowerCase();
    return transactions.filter((txn) => {
      if (category !== 'all' && !(txn.category ?? '').toLowerCase().includes(normalizedCategory)) return false;
      if (method !== 'all' && txn.method !== method) return false;
      if (status !== 'all' && txn.status !== status) return false;
      return true;
    });
  }, [transactions, category, method, status]);

  // Filter members based on search
  // Calculate allocation preview - Backend: GET /finance/summary/daily?preview=true
  const calculateAllocationPreview = (amt: number, type: string) => {
    const numAmt = Number(amt) || 0;
    
    if (type === 'operations-only') {
      return { operations: 250, insurance: 250, loan: 0, savings: 0, total: 500 };
    } else if (type === 'full-remittance') {
      return { operations: 250, insurance: 250, loan: 0, savings: 0, total: 500 };
    } else if (type === 'loan-topup') {
      const loanAmount = numAmt - 500;
      return { operations: 250, insurance: 250, loan: loanAmount, savings: 0, total: numAmt };
    } else if (type === 'insurance-premium') {
      const insuranceExtra = numAmt - 500;
      return { operations: 250, insurance: 250 + insuranceExtra, loan: 0, savings: 0, total: numAmt };
    } else if (type === 'savings-deposit') {
      const savingsAmount = numAmt - 500;
      return { operations: 250, insurance: 250, loan: 0, savings: savingsAmount, total: numAmt };
    }
    return { operations: 0, insurance: 0, loan: 0, savings: 0, total: 0 };
  };

  const allocationPreview = calculateAllocationPreview(Number(amount), paymentType);

  // Handle payment submission - Backend: POST /finance/processPayment
  const handleSubmitPayment = async () => {
    if (!selectedMember) {
      toast.error('Please select a member');
      return;
    }

    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentMode === 'stk' && !selectedMember.phone) {
      toast.error('Selected member does not have a phone number on file.');
      return;
    }

    setPaymentSubmitting(true);

    try {
      if (paymentMode === 'stk') {
        const response = await processPayment({
          phone: selectedMember.phone!,
          vehicleId: selectedMember.vehicleId,
          amount: numericAmount
        });

        toast.success(response?.message ?? 'STK Push initiated', {
          description:
            response?.checkoutRequestId ??
            `Customer ${selectedMember.phone} will receive an M-PESA prompt shortly.`
        });
      } else {
        await submitFinancePayment({
          userId: selectedMember.id,
          vehicleId: selectedMember.vehicleId,
          amount: numericAmount
        });

        toast.success('Cash payment recorded successfully', {
          description: `KES ${numericAmount.toLocaleString()} recorded for ${selectedMember.name}`
        });
      }

      setAmount('');
      setSelectedMember(null);
      setSearchTerm('');

      // Refresh dashboard data in the background
      loadDailySummary();
      loadTransactions();
      loadAuditLog();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment submission failed.';
      toast.error('Failed to record payment', { description: message });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <StaffLayout
      user={user}
      currentPage="staff/treasurer"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="space-y-6">
      {/* Header with date picker and quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-gray-900">Finance Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage daily collections, payments, and financial tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0"
            />
          </div>
          <Badge variant="outline" className="px-3 py-2 bg-green-50 text-green-700 border-green-200">
            <DollarSign className="h-3 w-3 mr-1" />
            Today: KES {summaryTotals.netFlow.toLocaleString()}
          </Badge>
          {summaryLoading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" aria-label="Loading summary" />}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Payment Processing</span>
            <span className="sm:hidden">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Finance Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions & Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* Payment Processing Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Process Payment
                  </CardTitle>
                  <CardDescription>Initiate M-PESA STK Push or record offline cash payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Payment Mode Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={paymentMode === 'stk' ? 'default' : 'outline'}
                      onClick={() => setPaymentMode('stk')}
                      className="justify-start"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      STK Push
                    </Button>
                    <Button
                      variant={paymentMode === 'offline' ? 'default' : 'outline'}
                      onClick={() => setPaymentMode('offline')}
                      className="justify-start"
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Cash/Offline
                    </Button>
                  </div>

                  <Separator />

                  {/* Member Search */}
                  <div className="space-y-2">
                    <Label>Search Member</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, phone, vehicle plate, or member ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {memberLookupLoading && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Searching members...
                      </p>
                    )}
                    {/* Search Results */}
                    {searchTerm && !memberLookupLoading && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map(member => (
                            <button
                              key={member.id}
                              onClick={() => {
                                setSelectedMember(member);
                                setSearchTerm('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm">{member.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(member.memberNumber ?? 'N/A')} - {member.vehiclePlate ?? 'N/A'}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">{member.route}</Badge>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">No members found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Member Display */}
                  {selectedMember && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Users className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{selectedMember.name}</p>
                            <p className="text-sm text-blue-700">
                              {(selectedMember.memberNumber ?? 'N/A')} - {(selectedMember.vehiclePlate ?? 'N/A')} -{' '}
                              {selectedMember.phone ?? 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMember(null)}
                          >
                            Change
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Payment Type */}
                  <div className="space-y-2">
                    <Label>Payment Category</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operations-only">Operations Only (KES 250)</SelectItem>
                        <SelectItem value="full-remittance">Full Remittance (Ops + Insurance)</SelectItem>
                        <SelectItem value="loan-topup">Loan Top-up</SelectItem>
                        <SelectItem value="insurance-premium">Insurance Premium</SelectItem>
                        <SelectItem value="savings-deposit">Savings Deposit</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {paymentType === 'operations-only' && 'Daily operations fee only'}
                      {paymentType === 'full-remittance' && 'Operations (250) + Insurance (250) = KES 500'}
                      {paymentType === 'loan-topup' && 'Full remittance + loan repayment amount'}
                      {paymentType === 'insurance-premium' && 'Full remittance + additional insurance'}
                      {paymentType === 'savings-deposit' && 'Full remittance + savings contribution'}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label>Amount (KES)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0"
                    />
                  </div>

                  {/* Allocation Preview */}
                  {amount && Number(amount) > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Allocation Preview</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Operations:</span>
                          <span>KES {allocationPreview.operations}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Insurance:</span>
                          <span>KES {allocationPreview.insurance}</span>
                        </div>
                        {allocationPreview.loan > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loan Repayment:</span>
                            <span>KES {allocationPreview.loan}</span>
                          </div>
                        )}
                        {allocationPreview.savings > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Savings:</span>
                            <span>KES {allocationPreview.savings}</span>
                          </div>
                        )}
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>KES {allocationPreview.total}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={handleSubmitPayment}
                    className="w-full"
                    size="lg"
                    disabled={paymentSubmitting}
                  >
                    {paymentSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {paymentSubmitting
                      ? 'Processing...'
                      : paymentMode === 'stk'
                      ? 'Send STK Push'
                      : 'Record Payment'}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity Log */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Your last finance actions today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLoading && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading recent actions...
                      </p>
                    )}
                    {!auditLoading && auditLog.length === 0 && (
                      <p className="text-xs text-gray-500">No recent finance actions.</p>
                    )}
                    {auditLog.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm">{log.action}</p>
                            <p className="text-xs text-gray-500">
                              {(log.member ?? 'Unknown Member')} - KES {log.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Today's Collections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Operations</span>
                      <span className="font-medium">KES {summaryTotals.operations.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Insurance</span>
                      <span className="font-medium">KES {summaryTotals.insurance.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Loan Repayments</span>
                      <span className="font-medium">KES {summaryTotals.loanRepayments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Savings</span>
                      <span className="font-medium">KES {summaryTotals.savings.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expenditures</span>
                      <span className="font-medium text-red-600">- KES {summaryTotals.expenditures.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-medium">Net Flow</span>
                      <span className="text-lg font-bold text-green-600">
                        KES {summaryTotals.netFlow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expected vs Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Trips Today</span>
                        <span>
                          {summaryExpectations.actualTrips}/{summaryExpectations.expectedTrips || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${tripProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Target Met</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Finance Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Operations</p>
                    <p className="text-2xl mt-1">KES {(summaryTotals.operations / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>+12% from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Insurance</p>
                    <p className="text-2xl mt-1">KES {(summaryTotals.insurance / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>+8% from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Loan Repayments</p>
                    <p className="text-2xl mt-1">KES {(summaryTotals.loanRepayments / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      <span>-5% from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Savings</p>
                    <p className="text-2xl mt-1">KES {(summaryTotals.savings / 1000).toFixed(0)}K</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span>+18% from yesterday</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <PiggyBank className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>7-Day Trend</CardTitle>
                <CardDescription>Collections vs Expenditures</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="collections" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="expenditures" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Allocation Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Allocation</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Remittances */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Remittances</CardTitle>
              <CardDescription>Latest payments captured for today</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRemittances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500">
                        No remittances recorded for this date.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentRemittances.map((remittance) => (
                      <TableRow key={remittance.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm">{remittance.member}</p>
                            <p className="text-xs text-gray-500">{remittance.memberNumber ?? 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{remittance.vehiclePlate ?? 'Unassigned'}</TableCell>
                        <TableCell>{remittance.route ?? 'Primary Route'}</TableCell>
                        <TableCell>
                          <Badge variant={remittance.method === 'M-PESA' ? 'default' : 'secondary'} className="text-xs">
                            {remittance.method ?? 'M-PESA'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={remittance.status === 'COMPLETED' ? 'default' : 'secondary'}
                            className={remittance.status === 'COMPLETED' ? 'bg-green-500' : ''}
                          >
                            {remittance.status ?? 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          KES {Number(remittance.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {remittance.time
                            ? new Date(remittance.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions & Reports Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={transactionFilter.category} 
                    onValueChange={(val) => setTransactionFilter({ ...transactionFilter, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="full">Full Remittance</SelectItem>
                      <SelectItem value="operations">Operations Only</SelectItem>
                      <SelectItem value="loan">Loan Payments</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select 
                    value={transactionFilter.method} 
                    onValueChange={(val) => setTransactionFilter({ ...transactionFilter, method: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="M-PESA">M-PESA</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={transactionFilter.status} 
                    onValueChange={(val) => setTransactionFilter({ ...transactionFilter, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select 
                    value={transactionFilter.dateRange} 
                    onValueChange={(val) => setTransactionFilter({ ...transactionFilter, dateRange: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction Ledger</CardTitle>
                  <CardDescription>
                    {transactionsLoading ? 'Loading transactions...' : `${filteredTransactions.length} transactions found`}
                  </CardDescription>
                </div>
                <Badge variant="outline">{selectedDate}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-sm text-gray-500">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading transactions...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-sm text-gray-500">
                          No transactions match the applied filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((txn) => {
                        const displayTime =
                          txn.time ??
                          (txn.date
                            ? new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--');
                        return (
                        <TableRow key={txn.id}>
                          <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                          <TableCell className="text-sm">{displayTime}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{txn.member ?? 'Unknown Member'}</p>
                              <p className="text-xs text-gray-500">{txn.memberNumber ?? '—'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{txn.vehicle ?? '—'}</p>
                              <p className="text-xs text-gray-500">{txn.route ?? '—'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{txn.category ?? 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={txn.method === 'M-PESA' ? 'default' : 'secondary'} className="text-xs">
                              {txn.method ?? 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            KES {Number(txn.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={txn.status === 'Completed' ? 'default' : 'secondary'}
                              className={txn.status === 'Completed' ? 'bg-green-500' : ''}
                            >
                              {txn.status ?? 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </StaffLayout>
  );
}
