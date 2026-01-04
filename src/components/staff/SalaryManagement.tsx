import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PermissionButton } from '../auth/PermissionButton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  DollarSign,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Calendar,
  User,
  Building,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  applyAdvance,
  approveAdvance,
  rejectAdvance,
  paySalary,
  getReports,
  getSalaries,
  getSalaryAdvanceApplications
} from '../../services/staff';

interface SalaryManagementProps {
  user: {
    id?: string;
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<SalaryManagementLayoutProps>;
  currentPage?: string;
}

interface SalaryManagementLayoutProps {
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

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return 'Not recorded';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date?.getTime?.())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }).format(date as Date);
};

const formatStatus = (status: string | null | undefined) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export function SalaryManagement({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = StaffLayout,
  currentPage = 'staff/salary'
}: SalaryManagementProps) {
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');

  const [payroll, setPayroll] = useState<any[]>([]);
  const [advanceApplications, setAdvanceApplications] = useState<any[]>([]);
  const [personalSalary, setPersonalSalary] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advanceSubmitting, setAdvanceSubmitting] = useState(false);
  const [processingAdvanceId, setProcessingAdvanceId] = useState<string | null>(null);
  const [processingSalaryId, setProcessingSalaryId] = useState<string | null>(null);

  const isChairperson =
    user?.role?.toLowerCase() === 'chairperson' ||
    user?.role?.toLowerCase() === 'admin' ||
    user?.name === 'Admin User';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsResponse, salaryResponse, advanceResponse] = await Promise.all([
        getReports().catch(() => null),
        getSalaries().catch(() => null),
        getSalaryAdvanceApplications().catch(() => null)
      ]);

      setPayroll(reportsResponse?.salaries ?? []);
      setAdvanceApplications(advanceResponse ?? reportsResponse?.advances ?? []);
      setPersonalSalary(salaryResponse ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load salary data.';
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

  const staffPayroll = useMemo(() => {
    if (isChairperson) return payroll;
    if (!currentUserId) return payroll;
    return payroll.filter(
      (record) => record.staffId === currentUserId || record.staff?.id === currentUserId
    );
  }, [isChairperson, payroll, currentUserId]);

  const staffAdvances = useMemo(() => {
    if (isChairperson) return advanceApplications;
    if (!currentUserId) return advanceApplications;
    return advanceApplications.filter(
      (advance) => advance.staffId === currentUserId || advance.staff?.id === currentUserId
    );
  }, [advanceApplications, isChairperson, currentUserId]);

  const personalSummary = useMemo(() => {
    const source = personalSalary ?? staffPayroll[0] ?? null;
    const basicSalary = toNumber(source?.basicSalary);
    const allowances = toNumber(source?.allowances);
    const nhif = toNumber(source?.nhif);
    const nssf = toNumber(source?.nssf);
    const paye = toNumber(source?.paye);
    const netSalary =
      toNumber(source?.netSalary) || Math.max(basicSalary + allowances - (nhif + nssf + paye), 0);
    return {
      basicSalary,
      allowances,
      grossSalary: basicSalary + allowances,
      nhif,
      nssf,
      paye,
      netSalary,
      bankName: source?.bankName ?? '',
      accountNumber: source?.accountNumber ?? '',
      lastPayDate: source?.payDate ?? source?.lastPayDate ?? null,
      nextPayDate: source?.nextPayDate ?? null
    };
  }, [personalSalary, staffPayroll]);

  const totalDeductions = personalSummary.nhif + personalSummary.nssf + personalSummary.paye;

  const handleAdvanceApplication = async () => {
    if (!advanceAmount || !advanceReason) {
      toast.error('Please provide amount and reason for the advance.');
      return;
    }

    const amountValue = Number(advanceAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid amount for the advance.');
      return;
    }

    if (amountValue > personalSummary.basicSalary * 0.5) {
      toast.error('Advance amount exceeds 50% of your basic salary.');
      return;
    }

    try {
      setAdvanceSubmitting(true);
      await applyAdvance({ amount: amountValue, reason: advanceReason });
      toast.success('Salary advance application submitted successfully.');
      setAdvanceDialogOpen(false);
      setAdvanceAmount('');
      setAdvanceReason('');
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit salary advance.';
      toast.error(message);
    } finally {
      setAdvanceSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (advanceId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingAdvanceId(advanceId);
      if (action === 'approve') {
        await approveAdvance(advanceId);
        toast.success('Salary advance approved successfully.');
      } else {
        await rejectAdvance(advanceId);
        toast.success('Salary advance rejected.');
      }
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update advance.';
      toast.error(message);
    } finally {
      setProcessingAdvanceId(null);
    }
  };

  const handlePaySalary = async (record: any) => {
    const staffId = record?.staffId ?? record?.staff?.id;
    if (!staffId) {
      toast.error('Unable to determine staff member for payment.');
      return;
    }
    try {
      setProcessingSalaryId(staffId);
      await paySalary({
        staffId,
        basicSalary: toNumber(record.basicSalary),
        netSalary: toNumber(record.netSalary || record.basicSalary),
        nhif: toNumber(record.nhif),
        nssf: toNumber(record.nssf),
        paye: toNumber(record.paye),
        allowances: toNumber(record.allowances),
        bankName: record.bankName,
        accountNumber: record.accountNumber,
        payDate: new Date().toISOString(),
        status: 'PAID'
      });
      toast.success('Salary payment recorded successfully.');
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process salary payment.';
      toast.error(message);
    } finally {
      setProcessingSalaryId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'PAID':
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
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
            <CardTitle>Unable to load salary data</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
            <p className="text-gray-600">
              {isChairperson
                ? 'Manage staff salaries and advances'
                : 'View your salary information and apply for advances'}
            </p>
          </div>
          {!isChairperson && (
            <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Advance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Salary Advance Application</DialogTitle>
                  <DialogDescription>
                    Apply for a salary advance. Maximum allowed is 50% of your basic salary.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      max={(personalSummary.basicSalary * 0.5).toString()}
                    />
                    <p className="text-xs text-gray-500">
                      Maximum: {formatCurrency(personalSummary.basicSalary * 0.5)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explain why you need the advance"
                      value={advanceReason}
                      onChange={(e) => setAdvanceReason(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)} disabled={advanceSubmitting}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAdvanceApplication}
                      disabled={advanceSubmitting}
                      className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white"
                    >
                      {advanceSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Application
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isChairperson ? (
          <>
            {/* Personal Salary Information */}
            <Card className="border-l-4 border-[var(--neon-turquoise)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-[var(--neon-turquoise)]" />
                  <span>My Salary Information</span>
                </CardTitle>
                <CardDescription>Current salary structure and payment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label>Basic Salary</Label>
                    <div className="p-3 bg-blue-50 rounded-lg border">
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(personalSummary.basicSalary)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Gross Salary</Label>
                    <div className="p-3 bg-green-50 rounded-lg border">
                      <p className="text-xl font-bold text-green-900">{formatCurrency(personalSummary.grossSalary)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Deductions</Label>
                    <div className="p-3 bg-red-50 rounded-lg border">
                      <p className="text-xl font-bold text-red-900">{formatCurrency(totalDeductions)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Net Salary</Label>
                    <div className="p-3 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 rounded-lg border border-[var(--neon-turquoise)]/20">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(personalSummary.netSalary)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Deduction Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">NHIF</span>
                        <span className="font-medium text-gray-900">{formatCurrency(personalSummary.nhif)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NSSF</span>
                        <span className="font-medium text-gray-900">{formatCurrency(personalSummary.nssf)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PAYE</span>
                        <span className="font-medium text-gray-900">{formatCurrency(personalSummary.paye)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Payment Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank Name</span>
                        <span className="font-medium text-gray-900">{personalSummary.bankName || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Number</span>
                        <span className="font-medium text-gray-900">{personalSummary.accountNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Payment Date</span>
                        <span className="font-medium text-gray-900">{formatDate(personalSummary.lastPayDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Payment Date</span>
                        <span className="font-medium text-gray-900">{formatDate(personalSummary.nextPayDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Advance Applications */}
            <Card className="border-l-4 border-[var(--neon-yellow)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-[var(--neon-orange)]" />
                  <span>My Salary Advances</span>
                </CardTitle>
                <CardDescription>Track the status of your salary advance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffAdvances.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(toNumber(application.amount))}
                        </p>
                        <p className="text-sm text-gray-600">{application.reason ?? 'No reason provided'}</p>
                        <p className="text-xs text-gray-500">Applied on {formatDate(application.applicationDate)}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">{formatStatus(application.status)}</Badge>
                    </div>
                  ))}
                  {!staffAdvances.length && (
                    <p className="text-sm text-gray-500 text-center py-4">No advance applications yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Salary Overview */}
            <Card className="border-l-4 border-[var(--neon-turquoise)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-[var(--neon-turquoise)]" />
                  <span>Staff Payroll Overview</span>
                </CardTitle>
                <CardDescription>Disburse salaries and monitor payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead>Pay Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffPayroll.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {record.staff?.name ?? 'Unnamed Staff'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {record.staff?.profileCategory ?? 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(toNumber(record.basicSalary))}
                            </div>
                            <div className="text-sm text-gray-500">
                              NHIF: {formatCurrency(toNumber(record.nhif))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              {record.bankName ?? 'Not provided'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.accountNumber ?? 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{record.payDate ? formatDate(record.payDate) : 'Pending'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(record.status ?? 'Pending')}
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                toast.info(`Viewing salary breakdown for ${record.staff?.name ?? 'staff member'}`)
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              onClick={() => handlePaySalary(record)}
                              disabled={processingSalaryId === (record.staffId ?? record.staff?.id)}
                              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90 disabled:opacity-60"
                            >
                              {processingSalaryId === (record.staffId ?? record.staff?.id) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <DollarSign className="w-4 h-4 mr-2" />
                              )}
                              Process Payment
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!staffPayroll.length && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="text-center text-sm text-gray-500 py-6">
                              No payroll records found.
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Advance Approvals */}
            <Card className="border-l-4 border-[var(--neon-yellow)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-[var(--neon-orange)]" />
                  <span>Advance Requests</span>
                </CardTitle>
                <CardDescription>Review and action pending salary advances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advanceApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {application.staff?.name ?? application.staffName ?? 'Staff Member'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {application.approvedBy?.name
                                  ? `Approved by ${application.approvedBy.name}`
                                  : 'Awaiting approval'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(toNumber(application.amount))}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600">{application.reason ?? 'No reason provided'}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{formatDate(application.applicationDate)}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(application.status)}</TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => handleAdvanceStatus(application.id, 'approve')}
                              disabled={processingAdvanceId === application.id}
                              className="text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-60"
                            >
                              {processingAdvanceId === application.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleAdvanceStatus(application.id, 'reject')}
                              disabled={processingAdvanceId === application.id}
                              className="text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              {processingAdvanceId === application.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!advanceApplications.length && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="text-center text-sm text-gray-500 py-6">
                              No advance requests found.
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LayoutComponent>
  );
}

