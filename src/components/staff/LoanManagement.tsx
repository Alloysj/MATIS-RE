import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PermissionButton } from '../auth/PermissionButton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { applyLoan, getLoans, getPendingLoans } from '../../services/staff';
import { usePermission } from '../../context/AccessContext';

interface LoanManagementProps {
  user: {
    id?: string;
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<LoanManagementLayoutProps>;
  currentPage?: string;
}

interface LoanManagementLayoutProps {
  children: ReactNode;
  user: {
    id?: string;
    name: string;
    role: string;
    phone: string;
  } | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return 'Not recorded';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date?.getTime?.())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }).format(date as Date);
};

const formatStatus = (status: string | null | undefined) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const calculateExpectedDate = (months: number) => {
  if (!Number.isFinite(months) || months <= 0) return undefined;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

export function LoanManagement({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = StaffLayout,
  currentPage = 'staff/loanmanagement'
}: LoanManagementProps) {
  const canApplyLoan = usePermission('LOANS:APPLY');
  const [loanType, setLoanType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [repaymentPeriod, setRepaymentPeriod] = useState('');

  const [loans, setLoans] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isChairperson =
    user?.role?.toLowerCase() === 'chairperson' ||
    user?.role?.toLowerCase() === 'admin' ||
    user?.name === 'Admin User';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loansResponse, pendingResponse] = await Promise.all([
        getLoans().catch(() => []),
        getPendingLoans().catch(() => [])
      ]);
      setLoans(Array.isArray(loansResponse) ? loansResponse : []);
      setPendingLoans(Array.isArray(pendingResponse) ? pendingResponse : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load loan data.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentUserId = user?.id;

  const personalLoans = useMemo(() => {
    if (isChairperson) return loans;
    if (!currentUserId) return loans;
    return loans.filter((loan) => loan.applicantId === currentUserId || loan.applicant?.id === currentUserId);
  }, [loans, isChairperson, currentUserId]);

  const currentLoans = useMemo(
    () =>
      personalLoans.filter(
        (loan) => (loan.status ?? '').toUpperCase() !== 'REPAID'
      ),
    [personalLoans]
  );

  const repaymentHistory = useMemo(
    () =>
      personalLoans
        .map((loan) => ({
          id: loan.id,
          date: loan.applicationDate,
          amount: loan.monthlyPayment ?? loan.repaymentAmount ?? loan.amount,
          loanType: formatStatus(loan.type),
          status: formatStatus(loan.status),
          balance: loan.balance ?? loan.outstandingBalance ?? null
        }))
        .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime()),
    [personalLoans]
  );

  const totalOutstanding = useMemo(
    () =>
      currentLoans.reduce(
        (sum, loan) => sum + toNumber(loan.balance ?? loan.outstandingBalance ?? loan.amount), 0
      ),
    [currentLoans]
  );

  const totalLoans = useMemo(() => loans.reduce((sum, loan) => sum + toNumber(loan.amount), 0), [loans]);

  const handleLoanApplication = async () => {
    if (!loanType || !loanAmount || !loanPurpose || !repaymentPeriod) {
      toast.error('Please complete all required fields.');
      return;
    }

    const amountValue = Number(loanAmount);
    const periodValue = Number(repaymentPeriod);

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid loan amount.');
      return;
    }

    if (!Number.isFinite(periodValue) || periodValue <= 0) {
      toast.error('Select a valid repayment period.');
      return;
    }

    try {
      setSubmitting(true);
      await applyLoan({
        amount: amountValue,
        purpose: loanPurpose,
        type: loanType === 'emergency' ? 'EMERGENCY' : 'NORMAL',
        expectedRepaymentDate: calculateExpectedDate(periodValue),
        urgency: periodValue > 12 ? 'STANDARD' : 'URGENT'
      });
      toast.success('Loan application submitted successfully.');
      setLoanType('');
      setLoanAmount('');
      setLoanPurpose('');
      setRepaymentPeriod('');
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit loan application.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getLoanBadge = (status: string) => {
    const normalized = (status ?? '').toUpperCase();
    switch (normalized) {
      case 'APPROVED':
      case 'DISBURSED':
        return <Badge className="bg-green-100 text-green-800">{formatStatus(status)}</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">{formatStatus(status)}</Badge>;
      case 'REJECTED':
      case 'DEFAULTED':
        return <Badge className="bg-red-100 text-red-800">{formatStatus(status)}</Badge>;
      default:
        return <Badge variant="secondary">{formatStatus(status)}</Badge>;
    }
  };

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
            <CardTitle>Unable to load loan data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end space-x-2">
            <PermissionButton
              variant="outline"
              onClick={() => onNavigate('app/dashboard')}
              rule={{ anyOf: ['FINANCE:VIEW', 'VEHICLES:READ', 'LOANS:VIEW', 'MEMBERS:READ'] }}
            >
              Back to Dashboard
            </PermissionButton>
            <Button onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600">
            {isChairperson
              ? 'Review active loans and pending applications'
              : 'Apply for loans and track repayment status'}
          </p>
        </div>

        {!isChairperson && canApplyLoan && (
          <Card className="border-l-4 border-[var(--neon-turquoise)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-[var(--neon-turquoise)]" />
                <span>Apply for Loan</span>
              </CardTitle>
              <CardDescription>Submit a new loan application for review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="loanType">Loan Type *</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal Loan (Up to KES 100,000)</SelectItem>
                      <SelectItem value="emergency">Emergency Loan (Up to KES 25,000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Loan Amount (KES) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    max={loanType === 'emergency' ? '25000' : '100000'}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum: {loanType === 'emergency' ? 'KES 25,000' : 'KES 100,000'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Repayment Period (months) *</Label>
                  <Select value={repaymentPeriod} onValueChange={setRepaymentPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repayment period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="18">18 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      {loanType === 'normal' && <SelectItem value="36">36 Months</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purpose">Purpose of Loan *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Explain the purpose of this loan"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3">
                  <PermissionButton
                    variant="outline"
                    onClick={() => onNavigate('app/dashboard')}
                    rule={{ anyOf: ['FINANCE:VIEW', 'VEHICLES:READ', 'LOANS:VIEW', 'MEMBERS:READ'] }}
                  >
                    Cancel
                  </PermissionButton>
                  <Button
                    onClick={handleLoanApplication}
                    disabled={submitting}
                    className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:opacity-90"
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Loan Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Loans */}
        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-[var(--neon-purple)]" />
              <span>{isChairperson ? 'All Loans Overview' : 'My Loans'}</span>
            </CardTitle>
            <CardDescription>
              {isChairperson
                ? 'Monitor loan portfolio and outstanding balances'
                : 'Track outstanding balances and repayment progress'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentLoans.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentLoans.map((loan) => {
                  const progress =
                    loan.progress ??
                    (() => {
                      const original = toNumber(loan.amount);
                      const balance = toNumber(loan.balance ?? loan.outstandingBalance);
                      if (!original) return 0;
                      return Math.min(Math.max(((original - balance) / original) * 100, 0), 100);
                    })();

                  return (
                    <Card key={loan.id} className="border border-gray-200">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">{formatStatus(loan.type)}</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {formatCurrency(toNumber(loan.amount))}
                            </p>
                          </div>
                          {getLoanBadge(loan.status)}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            Outstanding Balance: {formatCurrency(toNumber(loan.balance ?? loan.outstandingBalance))}
                          </p>
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Repayment Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} />
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(loan.applicationDate)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                {isChairperson ? 'No active loans found.' : 'You do not have any active loans.'}
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--electric-blue)]/10 rounded-lg border border-[var(--neon-turquoise)]/20">
                <p className="text-sm text-gray-600">Total Loans</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalLoans)}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-[var(--neon-orange)]/10 to-[var(--neon-yellow)]/10 rounded-lg border border-[var(--neon-orange)]/20">
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-[var(--neon-purple)]/10 to-[var(--hot-pink)]/10 rounded-lg border border-[var(--neon-purple)]/20">
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-xl font-bold text-gray-900">{pendingLoans.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-[var(--lime-green)]/10 to-[var(--neon-turquoise)]/10 rounded-lg border border-[var(--lime-green)]/20">
                <p className="text-sm text-gray-600">Recent Disbursed</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    loans
                      .filter((loan) => (loan.status ?? '').toUpperCase() === 'DISBURSED')
                      .reduce((sum, loan) => sum + toNumber(loan.amount), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repayment History */}
        <Card className="border-l-4 border-[var(--neon-yellow)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-[var(--neon-yellow)]" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest loan applications and repayment updates</CardDescription>
          </CardHeader>
          <CardContent>
            {repaymentHistory.length ? (
              <div className="space-y-4">
                {repaymentHistory.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                      <p className="font-medium text-gray-900">{formatCurrency(toNumber(entry.amount))}</p>
                      <p className="text-xs text-gray-500">{entry.loanType}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{entry.status}</Badge>
                      {entry.balance != null && (
                        <p className="text-xs text-gray-500 mt-1">
                          Balance: {formatCurrency(toNumber(entry.balance))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent loan activity recorded.</p>
            )}
          </CardContent>
        </Card>

        {isChairperson && (
          <Card className="border-l-4 border-[var(--neon-orange)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-[var(--neon-orange)]" />
                <span>Pending Approvals</span>
              </CardTitle>
              <CardDescription>Loan requests awaiting committee review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoans.length ? (
                <div className="space-y-4">
                  {pendingLoans.map((loan) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <p className="font-medium text-gray-900">
                          {loan.applicant?.name ?? 'Applicant'} — {formatCurrency(toNumber(loan.amount))}
                        </p>
                        <p className="text-sm text-gray-500">Applied on {formatDate(loan.applicationDate)}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No pending loan applications.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutComponent>
  );
}

