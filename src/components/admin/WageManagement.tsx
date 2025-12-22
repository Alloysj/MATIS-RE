import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Banknote, Building2, CheckCircle, Edit, Loader2, Search, User, Wallet, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  fetchStaffProfiles,
  recordStaffSalary,
  updateStaffProfile,
  StaffProfile,
  StaffSalaryRecord
} from '../../services/staff';

interface WageManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<WageManagementLayoutProps>;
  currentPage?: string;
}

interface WageManagementLayoutProps {
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

type StaffRow = {
  profile: StaffProfile;
  allowances: number;
  nhif: number;
  nssf: number;
  status: string;
  payDate: string | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);

export function WageManagement({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/wages'
}: WageManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null);
  const [salaryInput, setSalaryInput] = useState('');
  const [allowanceInput, setAllowanceInput] = useState('');
  const [nhifInput, setNhifInput] = useState('');
  const [nssfInput, setNssfInput] = useState('');

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const profiles = await fetchStaffProfiles();
      const mapped: StaffRow[] = profiles.map((profile) => {
        const allowances = profile.latestSalary?.allowances ?? 0;
        const nhif = profile.latestSalary?.nhif ?? 0;
        const nssf = profile.latestSalary?.nssf ?? 0;
        return {
          profile,
          allowances,
          nhif,
          nssf,
          status: profile.latestSalary?.status ?? 'PENDING',
          payDate: profile.latestSalary?.payDate ?? null
        };
      });
      setStaff(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load payroll data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter(
      (item) =>
        item.profile.name.toLowerCase().includes(term) ||
        (item.profile.staffPosition ?? '').toLowerCase().includes(term) ||
        (item.profile.bankName ?? '').toLowerCase().includes(term) ||
        (item.profile.accountNumber ?? '').includes(term)
    );
  }, [staff, searchTerm]);

  const payrollTotals = useMemo(() => {
    const totals = staff.reduce(
      (acc, item) => {
        const net = item.profile.basicSalary + item.allowances - item.nhif - item.nssf;
        acc.gross += item.profile.basicSalary + item.allowances;
        acc.deductions += item.nhif + item.nssf;
        acc.net += net;
        if (item.status !== 'PAID') {
          acc.pending += net;
        }
        return acc;
      },
      { gross: 0, deductions: 0, net: 0, pending: 0 }
    );
    return totals;
  }, [staff]);

  const openEditDialog = (candidate: StaffRow) => {
    setSelectedStaff(candidate);
    setSalaryInput(String(candidate.profile.basicSalary));
    setAllowanceInput(String(candidate.allowances));
    setNhifInput(String(candidate.nhif));
    setNssfInput(String(candidate.nssf));
    setEditDialogOpen(true);
  };

  const handleSaveSalary = async () => {
    if (!selectedStaff) return;
    setSavingEdit(true);
    const salary = Number(salaryInput) || 0;
    const allowances = Number(allowanceInput) || 0;
    const nhif = Number(nhifInput) || 0;
    const nssf = Number(nssfInput) || 0;

    try {
      await updateStaffProfile(selectedStaff.profile.id, { basicSalary: salary });
      setStaff((prev) =>
        prev.map((item) =>
          item.profile.id === selectedStaff.profile.id
            ? { ...item, profile: { ...item.profile, basicSalary: salary }, allowances, nhif, nssf }
            : item
        )
      );
      toast.success(`Updated salary for ${selectedStaff.profile.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update salary';
      toast.error(message);
    } finally {
      setSavingEdit(false);
      setEditDialogOpen(false);
    }
  };

  const handlePaySalary = (candidate: StaffRow) => {
    const net = candidate.profile.basicSalary + candidate.allowances - candidate.nhif - candidate.nssf;
    const payDate = new Date().toISOString().slice(0, 10);
    setPayingId(candidate.profile.id);
    recordStaffSalary(candidate.profile.id, {
      allowances: candidate.allowances,
      nhif: candidate.nhif,
      nssf: candidate.nssf,
      payDate,
      status: 'PAID'
    })
      .then((entry: StaffSalaryRecord) => {
        setStaff((prev) =>
          prev.map((item) =>
            item.profile.id === candidate.profile.id
              ? {
                  ...item,
                  status: entry.status,
                  payDate: entry.payDate,
                  allowances: entry.allowances,
                  nhif: entry.nhif,
                  nssf: entry.nssf
                }
              : item
          )
        );
        toast.success(`Salary queued for payment to ${candidate.profile.name} (${formatCurrency(net)})`);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to record salary payment';
        toast.error(message);
      })
      .finally(() => setPayingId(null));
  };

  const getStatusBadge = (status: StaffRow['status']) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'ON_HOLD':
      default:
        return <Badge className="bg-gray-100 text-gray-800">On Hold</Badge>;
    }
  };

  const netPay = (item: StaffRow) => item.profile.basicSalary + item.allowances - item.nhif - item.nssf;

  const recentPayments = useMemo(
    () =>
      staff
        .filter((item) => item.payDate)
        .map((item) => ({
          id: `${item.profile.id}-${item.payDate}`,
          name: item.profile.name,
          amount: netPay(item),
          date: item.payDate!
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [staff]
  );

  return (
    <LayoutComponent user={user} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll & Wage Management</h1>
            <p className="text-gray-600">Administer salaries, bank details, and payroll expenses.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="border-[var(--neon-purple)] text-[var(--neon-purple)]"
            >
              <Search className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-[var(--neon-turquoise)]">
            <CardContent className="p-6 flex items-center">
              <Wallet className="h-8 w-8 text-[var(--neon-turquoise)]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Monthly Net</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollTotals.net)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-[var(--neon-yellow)]">
            <CardContent className="p-6 flex items-center">
              <Banknote className="h-8 w-8 text-[var(--neon-yellow)]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(payrollTotals.pending)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-[var(--neon-purple)]">
            <CardContent className="p-6 flex items-center">
              <User className="h-8 w-8 text-[var(--neon-purple)]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Staff Records</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-[var(--neon-orange)]">
            <CardContent className="p-6 flex items-center">
              <Building2 className="h-8 w-8 text-[var(--neon-orange)]" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Last Payroll Run</p>
                <p className="text-2xl font-bold text-gray-900">{recentPayments[0]?.date ?? 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">Loading payroll data...</CardContent>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <CardContent className="p-6 text-center text-red-600">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Staff Payroll</CardTitle>
                <p className="text-sm text-gray-600">Bank details, salary amounts, and payment actions.</p>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Search className="absolute h-4 w-4 text-gray-400 ml-3 pointer-events-none" />
                <Input
                  placeholder="Search by name, bank, or account..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>NHIF</TableHead>
                    <TableHead>NSSF</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>NHIF/NSSF Numbers</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.profile.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">{member.profile.name}</p>
                          <p className="text-sm text-gray-600">{member.profile.staffPosition}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">{member.profile.bankName}</div>
                          <div className="text-gray-500">Acct: {member.profile.accountNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(member.profile.basicSalary)}</TableCell>
                      <TableCell>{formatCurrency(member.allowances)}</TableCell>
                      <TableCell>{formatCurrency(member.nhif)}</TableCell>
                      <TableCell>{formatCurrency(member.nssf)}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{formatCurrency(netPay(member))}</TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>NHIF: {member.profile.nhifNumber}</div>
                          <div>NSSF: {member.profile.nssfNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{member.profile.hireDate}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>{member.payDate ? member.payDate : 'Not paid'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(member)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {member.status !== 'PAID' ? (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black"
                            onClick={() => handlePaySalary(member)}
                            disabled={payingId === member.profile.id}
                          >
                            {payingId === member.profile.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Pay
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-500 py-6">
                        No staff match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle>Recent Payroll Payments</CardTitle>
            <p className="text-sm text-gray-600">Latest processed salaries.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0 && <div className="text-sm text-gray-600">No payments recorded yet.</div>}
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{payment.name}</p>
                  <p className="text-sm text-gray-600">{payment.date}</p>
                </div>
                <div className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Salary Details</DialogTitle>
            <DialogDescription>
              Adjust base pay, allowances, and deductions. Changes will reflect in pending payroll totals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-gray-50">
              <p className="font-semibold text-gray-900">{selectedStaff?.profile.name}</p>
              <p className="text-sm text-gray-600">{selectedStaff?.profile.staffPosition}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Base Salary (KES)</Label>
              <Input
                id="salary"
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowances">Allowances (KES)</Label>
              <Input
                id="allowances"
                type="number"
                value={allowanceInput}
                onChange={(e) => setAllowanceInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nhif">NHIF (KES)</Label>
              <Input id="nhif" type="number" value={nhifInput} onChange={(e) => setNhifInput(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nssf">NSSF (KES)</Label>
              <Input id="nssf" type="number" value={nssfInput} onChange={(e) => setNssfInput(e.target.value)} />
            </div>
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveSalary}
                disabled={savingEdit}
                className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutComponent>
  );
}
