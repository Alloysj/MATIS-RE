import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Receipt,
  Search,
  Download,
  DollarSign,
  Calendar,
  Filter,
  FileText,
  PieChart,
  TrendingUp,
  Loader2,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner@2.0.3';
import { addExpenses, getExpenses } from '../../services/staff';

interface ExpenseTrackingProps {
  user: {
    id?: string;
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<ExpenseTrackingLayoutProps>;
  currentPage?: string;
}

interface ExpenseTrackingLayoutProps {
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

type ExpenseRecord = {
  id: string;
  category: string | null;
  description: string | null;
  amount: number;
  date: string;
  status: string;
  vendor: string | null;
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
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'PAID':
      return 'Paid';
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'FAILED':
      return 'Failed';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
};

const downloadCsv = (filename: string, rows: string[][]) => {
  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function ExpenseTracking({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = StaffLayout,
  currentPage = 'staff/expensetracking'
}: ExpenseTrackingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    vendor: ''
  });

  const resetAddExpenseForm = useCallback(() => {
    setNewExpense({
      category: '',
      description: '',
      amount: '',
      vendor: ''
    });
  }, []);

  const handleAddDialogChange = useCallback(
    (open: boolean) => {
      setAddDialogOpen(open);
      if (!open) {
        resetAddExpenseForm();
        setAddingExpense(false);
      }
    },
    [resetAddExpenseForm]
  );

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExpenses();
      const normalized: ExpenseRecord[] = Array.isArray(response)
        ? response.map((item: any) => ({
            id: item.id ?? crypto.randomUUID(),
            category: item.category ?? 'General',
            description: item.description ?? '',
            amount: Number(item.amount) || 0,
            date: item.date ?? item.createdAt ?? new Date().toISOString(),
            status: item.status ?? 'PENDING',
            vendor: item.vendor ?? null
          }))
        : [];
      setExpenses(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAddExpense = async () => {
    const description = newExpense.description.trim();
    const category = newExpense.category.trim();
    const vendor = newExpense.vendor.trim();
    const amountValue = Number(newExpense.amount);

    if (!description) {
      toast.error('Please provide a description for the expense.');
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }

    try {
      setAddingExpense(true);
      await addExpenses({
        description,
        amount: amountValue,
        category: category || undefined,
        vendor: vendor || undefined
      });
      toast.success('Expense recorded successfully.');
      handleAddDialogChange(false);
      await loadExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record expense.';
      toast.error(message);
    } finally {
      setAddingExpense(false);
    }
  };
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (expense.category ?? 'General').toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (expense.status ?? 'PENDING').toLowerCase() === statusFilter.toLowerCase();
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (expense.description ?? '').toLowerCase().includes(term) ||
        (expense.vendor ?? '').toLowerCase().includes(term) ||
        (expense.category ?? '').toLowerCase().includes(term);
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [expenses, searchTerm, selectedCategory, statusFilter]);

  const totalsByCategory = useMemo(() => {
    return filteredExpenses.reduce<Record<string, number>>((acc, expense) => {
      const key = (expense.category ?? 'General').toUpperCase();
      acc[key] = (acc[key] ?? 0) + expense.amount;
      return acc;
    }, {});
  }, [filteredExpenses]);

  const pieData = useMemo(
    () =>
      Object.entries(totalsByCategory).map(([name, value], index) => ({
        name,
        value,
        color: ['#14F195', '#FFE838', '#FF6B35', '#9945FF', '#00D4FF'][index % 5]
      })),
    [totalsByCategory]
  );

  const monthlyExpenses = useMemo(() => {
    const bucket = new Map<string, number>();
    filteredExpenses.forEach((expense) => {
      const monthLabel = formatDate(expense.date).slice(0, 8);
      bucket.set(monthLabel, (bucket.get(monthLabel) ?? 0) + expense.amount);
    });
    return Array.from(bucket.entries()).map(([month, total]) => ({ month, total }));
  }, [filteredExpenses]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses]
  );

  const handleExport = (format: 'csv') => {
    if (!expenses.length) {
      toast.info('No expenses available to export.');
      return;
    }

    if (format === 'csv') {
      const rows = [
        ['ID', 'Date', 'Category', 'Description', 'Amount', 'Status', 'Vendor'],
        ...expenses.map((expense) => [
          expense.id,
          formatDate(expense.date),
          expense.category ?? 'General',
          expense.description ?? '',
          expense.amount.toString(),
          expense.status ?? 'PENDING',
          expense.vendor ?? ''
        ])
      ];
      downloadCsv(`expenses_${new Date().toISOString().slice(0, 10)}.csv`, rows);
      toast.success('Expenses exported as CSV.');
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const normalized = (status ?? '').toUpperCase();
    const label = formatStatus(status);
    switch (normalized) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">{label}</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">{label}</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800">{label}</Badge>;
      case 'REJECTED':
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">{label}</Badge>;
      default:
        return <Badge variant="secondary">{label}</Badge>;
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
            <CardTitle>Unable to load expenses</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onNavigate('app/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={loadExpenses}>Retry</Button>
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
            <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
            <p className="text-gray-600">Track SACCO salary and office expenses</p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => handleAddDialogChange(true)}
              className="bg-[var(--neon-purple)] text-white hover:bg-[var(--neon-purple)]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Expense
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              className="border-[var(--neon-turquoise)] text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={handleAddDialogChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Capture a new expense to keep the SACCO ledger up to date.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseCategory">Category</Label>
                  <Input
                    id="expenseCategory"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Operations"
                    disabled={addingExpense}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount (KES)</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    min="0"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    disabled={addingExpense}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseVendor">Vendor / Payee</Label>
                <Input
                  id="expenseVendor"
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, vendor: e.target.value }))}
                  placeholder="Who was paid?"
                  disabled={addingExpense}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDescription">Description</Label>
                <Textarea
                  id="expenseDescription"
                  rows={4}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add details about the expense"
                  disabled={addingExpense}
                />
              </div>
            </div>
            <DialogFooter className="space-x-2 pt-2">
              <Button variant="outline" onClick={() => handleAddDialogChange(false)} disabled={addingExpense}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense} disabled={addingExpense}>
                {addingExpense && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <Input
                  placeholder="Search description, vendor, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-gray-500 mr-2" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {Array.from(new Set(expenses.map((expense) => expense.category ?? 'General'))).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Badge className="mr-2 bg-[var(--neon-orange)]/20 text-[var(--neon-orange)]">Status</Badge>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                >
                  <option value="all">All</option>
                  {Array.from(new Set(expenses.map((expense) => expense.status ?? 'PENDING'))).map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center border rounded-lg px-3 py-2 justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Spend</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalExpenses)}</p>
                </div>
                <DollarSign className="w-5 h-5 text-[var(--neon-turquoise)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses</CardTitle>
              <CardDescription>Trend across recent recorded months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {monthlyExpenses.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyExpenses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total']} />
                      <Bar dataKey="total" fill="var(--neon-turquoise)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500">
                    Not enough data to display a trend.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {pieData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500">
                    No expenses recorded for the selected filters.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center text-sm text-gray-600">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-[var(--neon-purple)]" />
              <span>Expense Log</span>
            </CardTitle>
            <CardDescription>Detailed list of recorded expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-gray-600">{formatDate(expense.date)}</TableCell>
                      <TableCell>{expense.category ?? 'General'}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {expense.description ?? 'No description'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {expense.vendor ?? 'Not specified'}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    </TableRow>
                  ))}
                  {!filteredExpenses.length && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="text-center text-sm text-gray-500 py-6">
                          No expenses match the current filters.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutComponent>
  );
}
