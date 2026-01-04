import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PermissionButton } from '../auth/PermissionButton';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import {
  CreditCard,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import {
  AdminLoanSummary,
  fetchAdminLoans,
  updateAdminLoan,
  LoanStatusCode,
  LoanTypeCode
} from '../../services/admin';
import { usePermission } from '../../context/AccessContext';

interface LoanApplicationsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<LoanLayoutProps>;
  currentPage?: string;
}

interface LoanLayoutProps {
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

const isSameDay = (value: string | null | undefined) => {
  if (!value) return false;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return false;
  const today = new Date();
  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  );
};

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) {
    return '—';
  }
  return `KSh ${amount.toLocaleString()}`;
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString();
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
};

const getStatusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'approved' || normalized === 'disbursed') return 'bg-green-100 text-green-800';
  if (normalized === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (normalized === 'rejected' || normalized === 'defaulted') return 'bg-red-100 text-red-800';
  return 'bg-blue-100 text-blue-800';
};

const getUrgencyColor = (urgency: string | null | undefined) => {
  const normalized = urgency?.toLowerCase();
  if (normalized === 'high') return 'bg-red-100 text-red-800';
  if (normalized === 'medium') return 'bg-yellow-100 text-yellow-800';
  if (normalized === 'low') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
};

const matchesSearch = (loan: AdminLoanSummary, term: string) => {
  if (!term) return true;
  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;

  const candidateValues = [
    loan.applicant?.name,
    loan.purpose ?? undefined,
    loan.vehicle?.plateNumber,
    loan.status,
    loan.type
  ];

  return candidateValues.some(value => value?.toLowerCase().includes(normalized));
};

export function LoanApplications({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/loans'
}: LoanApplicationsProps) {
  const canApproveLoan = usePermission('LOANS:APPROVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<LoanTypeCode>('NORMAL');
  const [loans, setLoans] = useState<AdminLoanSummary[]>([]);
  const [totals, setTotals] = useState<{ total: number; byStatus: Record<LoanStatusCode, number>; byType: Record<LoanTypeCode, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingLoanId, setUpdatingLoanId] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminLoans();
      setLoans(response.items);
      setTotals(response.totals);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load loan applications.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const handleApproveLoan = async (loan: AdminLoanSummary) => {
    try {
      setUpdatingLoanId(loan.id);
      await updateAdminLoan(loan.id, { status: 'APPROVED' });
      toast.success(`Approved loan for ${loan.applicant?.name ?? 'member'}.`);
      await loadLoans();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to approve loan.';
      toast.error(message);
    } finally {
      setUpdatingLoanId(null);
    }
  };

  const handleRejectLoan = async (loan: AdminLoanSummary) => {
    try {
      setUpdatingLoanId(loan.id);
      await updateAdminLoan(loan.id, { status: 'REJECTED' });
      toast.success(`Rejected loan for ${loan.applicant?.name ?? 'member'}.`);
      await loadLoans();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reject loan.';
      toast.error(message);
    } finally {
      setUpdatingLoanId(null);
    }
  };

  const handleViewApplicant = (applicantId: string) => {
    onNavigate(`app/members/profiles/${applicantId}`);
  };

  const filteredLoans = useMemo(
    () => loans.filter(loan => matchesSearch(loan, searchTerm)),
    [loans, searchTerm]
  );

  const filteredNormalLoans = useMemo(
    () => filteredLoans.filter(loan => loan.typeCode === 'NORMAL'),
    [filteredLoans]
  );
  const filteredEmergencyLoans = useMemo(
    () => filteredLoans.filter(loan => loan.typeCode === 'EMERGENCY'),
    [filteredLoans]
  );

  const totalApplications = totals?.total ?? loans.length;
  const pendingReviewCount = useMemo(
    () => loans.filter(loan => loan.statusCode === 'PENDING').length,
    [loans]
  );
  const emergencyPendingCount = useMemo(
    () => loans.filter(loan => loan.typeCode === 'EMERGENCY' && loan.statusCode === 'PENDING').length,
    [loans]
  );
  const approvedTodayCount = useMemo(
    () => loans.filter(loan => loan.approvedAt && isSameDay(loan.approvedAt)).length,
    [loans]
  );

  const renderLoadingRow = (colSpan: number) => (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <div className="flex items-center justify-center py-8 text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading loan applications...
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
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
            <p className="text-gray-600 mt-1">Review and manage pending loan applications.</p>
          </div>
          <PermissionButton
            onClick={() => onNavigate('app/insurance')}
            variant="outline"
            rule={{ anyOf: ['INSURANCE:VIEW', 'INSURANCE:WRITE'] }}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Financial Overview
          </PermissionButton>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(totalApplications)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatNumber(pendingReviewCount)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emergency Loans</p>
                  <p className="text-2xl font-bold text-red-600">{formatNumber(emergencyPendingCount)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(approvedTodayCount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-start gap-4 justify-between sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={selectedTab === 'NORMAL' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('NORMAL')}
              className={
                selectedTab === 'NORMAL'
                  ? 'bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90'
                  : ''
              }
            >
              Normal Loans ({formatNumber(filteredNormalLoans.length)})
            </Button>
            <Button
              variant={selectedTab === 'EMERGENCY' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('EMERGENCY')}
              className={
                selectedTab === 'EMERGENCY'
                  ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--hot-pink)] hover:opacity-90'
                  : ''
              }
            >
              Emergency ({formatNumber(filteredEmergencyLoans.length)})
            </Button>
          </div>
        </div>

        {selectedTab === 'NORMAL' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Normal Loan Applications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Guarantors</TableHead>
                    <TableHead>Credit Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? renderLoadingRow(8)
                    : filteredNormalLoans.length === 0
                    ? renderEmptyRow(8, 'No normal loan applications found.')
                    : filteredNormalLoans.map(loan => (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <div>
                              <button
                                onClick={() => handleViewApplicant(loan.applicantId)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {loan.applicant?.name ?? 'Unknown member'}
                              </button>
                              <p className="text-sm text-gray-500">{formatDate(loan.applicationDate)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{loan.purpose ?? '—'}</TableCell>
                          <TableCell>{formatCurrency(loan.savingsAtApplication)}</TableCell>
                          <TableCell>
                            {loan.guarantors.length > 0
                              ? loan.guarantors.map(guarantor => guarantor.name).join(', ')
                              : '—'}
                          </TableCell>
                          <TableCell>{loan.creditScore ?? '—'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canApproveLoan && (
                                  <DropdownMenuItem
                                    disabled={updatingLoanId === loan.id}
                                    onClick={() => handleApproveLoan(loan)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {canApproveLoan && (
                                  <DropdownMenuItem
                                    disabled={updatingLoanId === loan.id}
                                    onClick={() => handleRejectLoan(loan)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleViewApplicant(loan.applicantId)}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Applicant
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'EMERGENCY' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Emergency Loan Applications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Guarantors</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Repayment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? renderLoadingRow(9)
                    : filteredEmergencyLoans.length === 0
                    ? renderEmptyRow(9, 'No emergency loan applications found.')
                    : filteredEmergencyLoans.map(loan => (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <div>
                              <button
                                onClick={() => handleViewApplicant(loan.applicantId)}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {loan.applicant?.name ?? 'Unknown member'}
                              </button>
                              <p className="text-sm text-gray-500">{loan.id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{loan.purpose ?? '—'}</TableCell>
                          <TableCell>{formatCurrency(loan.savingsAtApplication)}</TableCell>
                          <TableCell>
                            {loan.guarantors.length > 0
                              ? loan.guarantors.map(guarantor => guarantor.name).join(', ')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getUrgencyColor(loan.urgency)}>{loan.urgency ?? 'Not provided'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(loan.expectedRepaymentDate)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(loan.status)}>{loan.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canApproveLoan && (
                                  <DropdownMenuItem
                                    disabled={updatingLoanId === loan.id}
                                    onClick={() => handleApproveLoan(loan)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {canApproveLoan && (
                                  <DropdownMenuItem
                                    disabled={updatingLoanId === loan.id}
                                    onClick={() => handleRejectLoan(loan)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleViewApplicant(loan.applicantId)}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Applicant
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutComponent>
  );
}
