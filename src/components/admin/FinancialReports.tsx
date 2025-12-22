import { ComponentType, ReactNode, useState, useMemo, useEffect, useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  DollarSign, 
  Download, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Building,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Shield,
  Users,
  TrendingUpIcon,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import {
  AdminReportQuery,
  ExportSummaryResponse,
  LoanRepaymentAllocation,
  LoanRepaymentTransaction,
  RemittanceAllocation,
  fetchExportSummary,
  fetchLoanRepaymentReport,
  fetchRemittanceReport
} from '../../services/admin';

interface FinancialReportsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  LayoutComponent?: ComponentType<FinancialReportsLayoutProps>;
  currentPage?: string;
}

interface FinancialReportsLayoutProps {
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

// Generate mock data for the last 60 days
const generateDateRange = (days: number) => {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

type RemittanceRow = {
  id: string;
  date: string;
  vehicleReg: string | null;
  driverName: string | null;
  memberName: string | null;
  routeName: string | null;
  operationsAmount: number;
  insuranceAmount: number;
  loanRepaymentAmount: number;
  savingsAmount: number;
  totalAmount: number;
  mpesaReference: string | null;
};

type LoanRepaymentRow = {
  id: string;
  date: string;
  memberName: string | null;
  vehicleReg: string | null;
  repaymentAmount: number;
  insuranceAmount: number;
  savingsAmount: number;
  operationsAmount: number;
  totalPayment: number;
  transactions: LoanRepaymentTransaction[];
};

const formatDateParam = (date: Date) => date.toISOString().split('T')[0];

const formatRowDate = (iso: string | null | undefined) => {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const mapPersonName = (
  person: { name: string | null; firstName: string | null; lastName: string | null } | null | undefined
) => {
  if (!person) return null;
  if (person.name) return person.name;
  const parts = [person.firstName, person.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
};

const getAllocationAmount = (allocations: RemittanceAllocation['allocations'], category: string) => {
  const entry = allocations.find(allocation => allocation.category === category);
  return entry ? entry.amount : 0;
};

const computeDateRangeParams = (range: string, customStart: string, customEnd: string) => {
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);

  switch (range) {
    case 'last-week':
      start.setDate(end.getDate() - 7);
      break;
    case 'last-3-months':
      start.setDate(end.getDate() - 90);
      break;
    case 'last-6-months':
      start.setDate(end.getDate() - 180);
      break;
    case 'ytd':
      start = new Date(end.getFullYear(), 0, 1);
      break;
    case 'custom': {
      if (customStart && customEnd) {
        const parsedStart = new Date(customStart);
        const parsedEnd = new Date(customEnd);
        if (!Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())) {
          return {
            startDate: formatDateParam(parsedStart),
            endDate: formatDateParam(parsedEnd)
          };
        }
      }
      start.setDate(end.getDate() - 30);
      break;
    }
    case 'last-month':
    default:
      start.setDate(end.getDate() - 30);
      break;
  }

  return {
    startDate: formatDateParam(start),
    endDate: formatDateParam(end)
  };
};

const mapRemittanceRows = (items: RemittanceAllocation[]): RemittanceRow[] =>
  items.map(item => {
    const operationsAmount = item.amount;
    const insuranceAmount = getAllocationAmount(item.allocations, 'INSURANCE');
    const loanAmount = getAllocationAmount(item.allocations, 'LOAN_REPAYMENT');
    const savingsAmount = getAllocationAmount(item.allocations, 'SAVINGS');

    return {
      id: item.allocationId,
      date: formatRowDate(item.payment.date),
      vehicleReg: item.vehicle?.plateNumber ?? null,
      driverName: mapPersonName(item.driver),
      memberName: mapPersonName(item.user),
      routeName: item.route?.name ?? null,
      operationsAmount,
      insuranceAmount,
      loanRepaymentAmount: loanAmount,
      savingsAmount,
      totalAmount: item.payment.totalAmount,
      mpesaReference: item.payment.mpesaReference ?? null
    };
  });

const mapLoanRepaymentRows = (items: LoanRepaymentAllocation[]): LoanRepaymentRow[] =>
  items.map(item => {
    const repaymentAmount = item.amount;
    const insuranceAmount = getAllocationAmount(item.allocations, 'INSURANCE');
    const savingsAmount = getAllocationAmount(item.allocations, 'SAVINGS');
    const operationsAmount = getAllocationAmount(item.allocations, 'OPERATIONS');

    return {
      id: item.allocationId,
      date: formatRowDate(item.payment.date),
      memberName: mapPersonName(item.user),
      vehicleReg: item.vehicle?.plateNumber ?? null,
      repaymentAmount,
      insuranceAmount,
      savingsAmount,
      operationsAmount,
      totalPayment: item.payment.totalAmount,
      transactions: item.transactions ?? []
    };
  });

// Insurance Payments Data
const insurancePaymentsData = generateDateRange(60).map((date, index) => {
  if (index % 7 !== 0) return null; // Insurance payments are not daily
  return {
    id: `INS${String(Math.floor(index / 7) + 1).padStart(4, '0')}`,
    date,
    memberName: ['James Mutua', 'Catherine Muthoni', 'Peter Kimani', 'Mary Njeri', 'John Kamau'][index % 5],
    vehicleReg: `KAA ${100 + (index % 50)}${String.fromCharCode(65 + (index % 26))}`,
    policyNumber: `POL-2024-${1000 + index}`,
    insuranceType: ['Comprehensive', 'Third Party', 'Third Party Fire & Theft'][index % 3],
    premium: Math.round(8000 + Math.random() * 12000),
    coveragePeriod: '12 months',
    status: index % 10 === 0 ? 'Pending' : 'Paid'
  };
}).filter(Boolean);

// Loan Disbursements Data
const loanDisbursementsData = generateDateRange(60).map((date, index) => {
  if (index % 5 !== 0) return null; // Loans are not disbursed daily
  return {
    id: `LOAN${String(Math.floor(index / 5) + 1).padStart(4, '0')}`,
    date,
    borrowerName: ['James Mutua', 'Catherine Muthoni', 'Peter Kimani', 'Mary Njeri', 'John Kamau', 'Grace Akinyi', 'David Otieno'][index % 7],
    membershipId: `MEM${1000 + (index % 50)}`,
    loanType: ['Emergency Loan', 'Development Loan', 'School Fees Loan', 'Business Loan'][index % 4],
    principal: Math.round((50000 + Math.random() * 450000) / 10000) * 10000,
    interestRate: [10, 12, 14, 15][index % 4],
    tenure: [6, 12, 18, 24][index % 4],
    purpose: ['Vehicle Repair', 'Business Expansion', 'Medical Emergency', 'School Fees', 'Home Improvement'][index % 5],
    guarantorName: ['John Doe', 'Jane Smith', 'Mike Johnson'][index % 3],
    approvedBy: 'Admin',
    status: 'Disbursed'
  };
}).filter(Boolean);

// Savings/Deposits Data
const savingsDepositsData = generateDateRange(60).map((date, index) => {
  if (index % 3 !== 0) return null;
  return {
    id: `SAV${String(Math.floor(index / 3) + 1).padStart(4, '0')}`,
    date,
    memberName: ['James Mutua', 'Catherine Muthoni', 'Peter Kimani', 'Mary Njeri', 'John Kamau', 'Grace Akinyi'][index % 6],
    membershipId: `MEM${1000 + (index % 50)}`,
    savingsType: ['Regular Savings', 'Fixed Deposit', 'Target Savings', 'Emergency Fund'][index % 4],
    amount: Math.round((2000 + Math.random() * 18000) / 1000) * 1000,
    cumulativeBalance: Math.round((50000 + index * 1000 + Math.random() * 20000) / 1000) * 1000,
    interestRate: [5, 6, 7, 8][index % 4],
    paymentMethod: ['M-Pesa', 'Bank Transfer', 'Cash', 'Standing Order'][index % 4],
    receiptNo: `SVRCP${String(3000 + index).padStart(6, '0')}`
  };
}).filter(Boolean);

// Member Share Contributions Data
const shareContributionsData = generateDateRange(60).map((date, index) => {
  if (index % 4 !== 0) return null;
  return {
    id: `SHR${String(Math.floor(index / 4) + 1).padStart(4, '0')}`,
    date,
    memberName: ['James Mutua', 'Catherine Muthoni', 'Peter Kimani', 'Mary Njeri', 'John Kamau'][index % 5],
    membershipId: `MEM${1000 + (index % 50)}`,
    contributionAmount: 5000,
    numberOfShares: 5,
    pricePerShare: 1000,
    totalSharesHeld: 50 + (index % 150),
    totalShareCapital: (50 + (index % 150)) * 1000,
    paymentMethod: ['M-Pesa', 'Bank Transfer'][index % 2]
  };
}).filter(Boolean);

// Detailed Expenses Data with Categories
const expenseCategories = [
  {
    name: 'Salaries & Wages',
    subcategories: ['Staff Salaries', 'Overtime Pay', 'Allowances', 'Bonuses']
  },
  {
    name: 'Office Operations',
    subcategories: ['Rent', 'Electricity', 'Water', 'Internet', 'Phone Bills', 'Cleaning Services', 'Security']
  },
  {
    name: 'Stationery & Supplies',
    subcategories: ['Office Supplies', 'Printing & Photocopying', 'Computer Accessories']
  },
  {
    name: 'Vehicle & Transport',
    subcategories: ['Fuel', 'Vehicle Maintenance', 'Vehicle Insurance', 'Parking Fees']
  },
  {
    name: 'Professional Services',
    subcategories: ['Legal Fees', 'Audit Fees', 'Consulting Fees', 'Training & Development']
  },
  {
    name: 'Marketing & Advertising',
    subcategories: ['Promotional Materials', 'Social Media Ads', 'Events & Sponsorships']
  },
  {
    name: 'IT & Technology',
    subcategories: ['Software Licenses', 'Hardware Purchase', 'Website Maintenance', 'IT Support']
  },
  {
    name: 'Bank Charges',
    subcategories: ['Transaction Fees', 'Account Maintenance', 'Loan Processing Fees']
  },
  {
    name: 'Regulatory & Compliance',
    subcategories: ['SACCO License Fees', 'Insurance', 'Government Levies']
  },
  {
    name: 'Miscellaneous',
    subcategories: ['Repairs & Maintenance', 'Staff Welfare', 'Donations', 'Contingency']
  }
];

const expensesData = generateDateRange(60).flatMap((date, dayIndex) => {
  const dailyExpenses = [];
  
  // Generate 2-5 expenses per day
  const numExpenses = 2 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < numExpenses; i++) {
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const subcategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
    
    let amount = 0;
    let vendor = '';
    let description = '';
    
    // Set amounts and descriptions based on subcategory
    switch (subcategory) {
      case 'Staff Salaries':
        amount = Math.round((30000 + Math.random() * 50000) / 1000) * 1000;
        vendor = 'Payroll';
        description = `Monthly salary for ${['John Doe', 'Jane Smith', 'Mike Johnson'][i % 3]} - ${['Accountant', 'Customer Service', 'Operations Manager'][i % 3]}`;
        break;
      case 'Rent':
        amount = 60000;
        vendor = 'Westlands Property Management';
        description = 'Monthly office rent - Westlands Branch';
        break;
      case 'Electricity':
        amount = Math.round(8000 + Math.random() * 7000);
        vendor = 'Kenya Power';
        description = 'Monthly electricity bill';
        break;
      case 'Internet':
        amount = 5000;
        vendor = 'Safaricom Business';
        description = 'Monthly internet and WiFi subscription';
        break;
      case 'Fuel':
        amount = Math.round(3000 + Math.random() * 5000);
        vendor = ['Total Energies', 'Shell', 'Rubis'][i % 3];
        description = `Fuel for company vehicle KAA ${100 + dayIndex}A`;
        break;
      case 'Vehicle Maintenance':
        amount = Math.round((5000 + Math.random() * 15000) / 1000) * 1000;
        vendor = ['City Garage', 'AutoFix Ltd', 'Matatu Mechanics'][i % 3];
        description = ['Oil change and service', 'Brake pad replacement', 'Engine repair', 'Tyre replacement'][i % 4];
        break;
      case 'Office Supplies':
        amount = Math.round(2000 + Math.random() * 5000);
        vendor = 'Stationery World';
        description = 'Office supplies - pens, papers, folders, printer cartridges';
        break;
      case 'Software Licenses':
        amount = Math.round(10000 + Math.random() * 20000);
        vendor = ['Microsoft', 'QuickBooks', 'Zoom'][i % 3];
        description = `Monthly subscription for ${['Office 365', 'Accounting Software', 'Video Conferencing'][i % 3]}`;
        break;
      case 'Legal Fees':
        amount = Math.round((20000 + Math.random() * 80000) / 5000) * 5000;
        vendor = 'Kamau & Associates Advocates';
        description = 'Legal consultation and document review';
        break;
      case 'Audit Fees':
        amount = 50000;
        vendor = 'KPMG Kenya';
        description = 'Quarterly audit services';
        break;
      case 'Marketing & Advertising':
        amount = Math.round((5000 + Math.random() * 20000) / 1000) * 1000;
        vendor = ['Facebook Ads', 'Radio Africa', 'Local Printers'][i % 3];
        description = ['Social media advertising campaign', 'Radio advertisement spot', 'Promotional flyers and banners'][i % 3];
        break;
      case 'Bank Charges':
        amount = Math.round(500 + Math.random() * 2500);
        vendor = ['Equity Bank', 'KCB Bank', 'Co-operative Bank'][i % 3];
        description = 'Monthly transaction and account maintenance fees';
        break;
      case 'Training & Development':
        amount = Math.round((10000 + Math.random() * 30000) / 5000) * 5000;
        vendor = 'Professional Training Institute';
        description = 'Staff training on financial management and customer service';
        break;
      default:
        amount = Math.round((1000 + Math.random() * 10000) / 1000) * 1000;
        vendor = 'Various Vendors';
        description = `${subcategory} expenses`;
    }
    
    dailyExpenses.push({
      id: `EXP${String(dayIndex * 10 + i + 1).padStart(5, '0')}`,
      date,
      category: category.name,
      subcategory,
      description,
      amount,
      vendor,
      paymentMethod: ['Bank Transfer', 'M-Pesa', 'Cash', 'Cheque'][i % 4],
      approvedBy: ['Admin', 'Finance Manager'][i % 2],
      receiptNo: `EXPRCP${String(5000 + dayIndex * 10 + i).padStart(6, '0')}`,
      status: 'Paid'
    });
  }
  
  return dailyExpenses;
});

// Investment Income Data
const investmentIncomeData = generateDateRange(60).map((date, index) => {
  if (index % 10 !== 0) return null;
  return {
    id: `INV${String(Math.floor(index / 10) + 1).padStart(4, '0')}`,
    date,
    investmentType: ['Treasury Bills', 'Fixed Deposit', 'Money Market Fund', 'Government Bonds'][index % 4],
    institution: ['Central Bank of Kenya', 'Equity Bank', 'CIC Asset Management', 'KCB Bank'][index % 4],
    principal: Math.round((500000 + Math.random() * 2000000) / 50000) * 50000,
    interestEarned: Math.round((10000 + Math.random() * 50000) / 1000) * 1000,
    maturityDate: new Date(new Date(date).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    interestRate: [7.5, 8.0, 8.5, 9.0][index % 4]
  };
}).filter(Boolean);

// Dividend Payments Data
const dividendPaymentsData = generateDateRange(60).map((date, index) => {
  if (index % 30 !== 0) return null;
  return {
    id: `DIV${String(Math.floor(index / 30) + 1).padStart(4, '0')}`,
    date,
    memberName: ['James Mutua', 'Catherine Muthoni', 'Peter Kimani', 'Mary Njeri', 'John Kamau'][index % 5],
    membershipId: `MEM${1000 + (index % 50)}`,
    numberOfShares: 50 + (index % 150),
    dividendPerShare: 50,
    totalDividend: (50 + (index % 150)) * 50,
    year: '2024',
    paymentMethod: ['M-Pesa', 'Bank Transfer'][index % 2],
    status: 'Paid'
  };
}).filter(Boolean);

export function FinancialReports({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = AdminLayout,
  currentPage = 'admin/reports/financials'
}: FinancialReportsProps) {
  const [dateRange, setDateRange] = useState('last-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dailyRemittanceData, setDailyRemittanceData] = useState<RemittanceRow[]>([]);
  const [remittanceTotals, setRemittanceTotals] = useState<{ amount: number; paymentCount: number }>({
    amount: 0,
    paymentCount: 0
  });
  const [remittanceTotalCount, setRemittanceTotalCount] = useState(0);
  const [loanRepaymentsData, setLoanRepaymentsData] = useState<LoanRepaymentRow[]>([]);
  const [loanRepaymentTotals, setLoanRepaymentTotals] = useState<{ amount: number; repaymentCount: number }>({
    amount: 0,
    repaymentCount: 0
  });
  const [loanRepaymentTotalCount, setLoanRepaymentTotalCount] = useState(0);

  const [exportSummaryData, setExportSummaryData] = useState<ExportSummaryResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [remittancePage, setRemittancePage] = useState(1);
  const [loanRepaymentPage, setLoanRepaymentPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('financialReports.accountId');
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('financialReports.accountId');
    }
  }, []);

  useEffect(() => {
    setRemittancePage(1);
    setLoanRepaymentPage(1);
  }, [dateRange, customStartDate, customEndDate, accountFilter]);

  const loadReports = useCallback(async () => {
    const { startDate, endDate } = computeDateRangeParams(dateRange, customStartDate, customEndDate);
    const baseParams: AdminReportQuery = {
      startDate,
      endDate,
      accountId: accountFilter ?? undefined,
      pageSize: 50
    };

    try {
      setReportLoading(true);
      setReportError(null);

      const [remittanceRes, loanRes, exportRes] = await Promise.all([
        fetchRemittanceReport({ ...baseParams, page: remittancePage }),
        fetchLoanRepaymentReport({ ...baseParams, page: loanRepaymentPage }),
        fetchExportSummary(baseParams)
      ]);

      setDailyRemittanceData(mapRemittanceRows(remittanceRes.items));
      setRemittanceTotals(remittanceRes.totals);
      setRemittanceTotalCount(remittanceRes.pagination?.totalCount ?? remittanceRes.items.length);
      setLoanRepaymentsData(mapLoanRepaymentRows(loanRes.items));
      setLoanRepaymentTotals(loanRes.totals);
      setLoanRepaymentTotalCount(loanRes.pagination?.totalCount ?? loanRes.items.length);

      setExportSummaryData(exportRes);
    } catch (error) {
      console.error('Failed to load financial reports', error);
      setReportError(error instanceof Error ? error.message : 'Failed to load financial reports');
    } finally {
      setReportLoading(false);
    }
  }, [accountFilter, customEndDate, customStartDate, dateRange, loanRepaymentPage, remittancePage]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Filter data based on date range
  const getFilteredDataByDate = (data: any[]) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'last-week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last-month':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last-3-months':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'last-6-months':
        startDate.setDate(today.getDate() - 180);
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          return data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= endDate;
          });
        }
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= today;
    });
  };

  // Calculate summary statistics
  const filteredRemittances = useMemo(() => getFilteredDataByDate(dailyRemittanceData), [dateRange, customStartDate, customEndDate]);
  const filteredInsurance = useMemo(() => getFilteredDataByDate(insurancePaymentsData), [dateRange, customStartDate, customEndDate]);
  const filteredLoans = useMemo(() => getFilteredDataByDate(loanDisbursementsData), [dateRange, customStartDate, customEndDate]);
  const filteredSavings = useMemo(() => getFilteredDataByDate(savingsDepositsData), [dateRange, customStartDate, customEndDate]);
  const filteredExpenses = useMemo(() => {
    let data = getFilteredDataByDate(expensesData);
    if (categoryFilter !== 'all') {
      data = data.filter(exp => exp.category === categoryFilter);
    }
    if (searchTerm) {
      data = data.filter(exp => 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return data;
  }, [dateRange, customStartDate, customEndDate, categoryFilter, searchTerm]);
  const filteredRepayments = useMemo(() => getFilteredDataByDate(loanRepaymentsData), [dateRange, customStartDate, customEndDate]);
  const filteredShares = useMemo(() => getFilteredDataByDate(shareContributionsData), [dateRange, customStartDate, customEndDate]);
  const filteredInvestments = useMemo(() => getFilteredDataByDate(investmentIncomeData), [dateRange, customStartDate, customEndDate]);
  const filteredDividends = useMemo(() => getFilteredDataByDate(dividendPaymentsData), [dateRange, customStartDate, customEndDate]);

  const DISPLAY_LIMIT = 20;
  const displayedRemittances = filteredRemittances.slice(0, DISPLAY_LIMIT);
  const displayedRepayments = filteredRepayments.slice(0, DISPLAY_LIMIT);

  // Calculate totals
  const totalRemittances = remittanceTotals.amount;
  const fallbackInsurancePayments = filteredInsurance.reduce((sum, item) => sum + item.premium, 0);
  const totalInsurancePayments = exportSummaryData ? exportSummaryData.totals.insurance : fallbackInsurancePayments;
  const totalLoansGiven = filteredLoans.reduce((sum, item) => sum + item.principal, 0);
  const fallbackSavings = filteredSavings.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = exportSummaryData ? exportSummaryData.totals.savings : fallbackSavings;
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalLoanRepayments = loanRepaymentTotals.amount;
  const totalShareContributions = filteredShares.reduce((sum, item) => sum + item.contributionAmount, 0);
  const totalInvestmentIncome = filteredInvestments.reduce((sum, item) => sum + item.interestEarned, 0);
  const totalDividendsPaid = filteredDividends.reduce((sum, item) => sum + item.totalDividend, 0);
  
  // Calculate total income
  const totalIncome = totalRemittances + totalInsurancePayments + totalLoanRepayments + totalSavings + totalShareContributions + totalInvestmentIncome;
  
  // Calculate net position
  const netPosition = totalIncome - totalExpenses - totalLoansGiven - totalDividendsPaid;

  // Expense breakdown by category
  const expensesByCategory = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'][
        Object.keys(categoryTotals).indexOf(name) % 10
      ]
    }));
  }, [filteredExpenses]);

  // Income breakdown
  const incomeBreakdown = [
    { name: 'Daily Remittances', value: totalRemittances, color: '#10B981' },
    { name: 'Insurance Payments', value: totalInsurancePayments, color: '#3B82F6' },
    { name: 'Loan Repayments', value: totalLoanRepayments, color: '#F59E0B' },
    { name: 'Savings Deposits', value: totalSavings, color: '#EF4444' },
    { name: 'Share Contributions', value: totalShareContributions, color: '#8B5CF6' },
    { name: 'Investment Income', value: totalInvestmentIncome, color: '#EC4899' }
  ];

  // Monthly trends data
  const monthlyTrends = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expenses: number; loans: number } } = {};
    
    filteredRemittances.forEach(item => {
      if (!item.date) return;
      const month = item.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, loans: 0 };
      monthlyData[month].income += item.operationsAmount;
    });
    
    filteredExpenses.forEach(item => {
      const month = item.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, loans: 0 };
      monthlyData[month].expenses += item.amount;
    });
    
    filteredLoans.forEach(item => {
      const month = item.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, loans: 0 };
      monthlyData[month].loans += item.principal;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: data.income,
        expenses: data.expenses,
        loans: data.loans,
        net: data.income - data.expenses - data.loans
      }));
  }, [filteredRemittances, filteredExpenses, filteredLoans]);

  // Financial ratios
  const totalAssets = totalSavings + totalLoansGiven + totalShareContributions;
  const totalLiabilities = totalExpenses;
  const liquidityRatio = totalAssets > 0 ? ((totalSavings + totalShareContributions) / totalLiabilities * 100) : 0;
  const loanToDepositRatio = (totalSavings + totalShareContributions) > 0 ? (totalLoansGiven / (totalSavings + totalShareContributions) * 100) : 0;
  const capitalAdequacy = totalAssets > 0 ? (totalShareContributions / totalAssets * 100) : 0;

  // Export functions
  const handleExportRemittances = () => {
    const headers = [
      'Allocation ID',
      'Date',
      'Member',
      'Driver',
      'Vehicle',
      'Route',
      'Operations Amount',
      'Insurance Amount',
      'Loan Repayment Amount',
      'Savings Amount',
      'Total Payment',
      'Mpesa Reference'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredRemittances.map(item => [
        item.id,
        item.date,
        item.memberName ?? '',
        item.driverName ?? '',
        item.vehicleReg ?? '',
        item.routeName ?? '',
        item.operationsAmount,
        item.insuranceAmount,
        item.loanRepaymentAmount,
        item.savingsAmount,
        item.totalAmount,
        item.mpesaReference ?? ''
      ].join(','))
    ].join('\n');
    downloadCSV(csvContent, 'daily_remittances');
  };

  const handleExportLoanRepaymentsReport = () => {
    const headers = [
      'Allocation ID',
      'Date',
      'Member',
      'Vehicle',
      'Loan Repayment Amount',
      'Insurance Amount',
      'Savings Amount',
      'Operations Amount',
      'Total Payment',
      'Transactions'
    ];
    const csvContent = [
      headers.join(','),
      ...filteredRepayments.map(item => [
        item.id,
        item.date,
        item.memberName ?? '',
        item.vehicleReg ?? '',
        item.repaymentAmount,
        item.insuranceAmount,
        item.savingsAmount,
        item.operationsAmount,
        item.totalPayment,
        item.transactions.length
      ].join(','))
    ].join('\n');
    downloadCSV(csvContent, 'loan_repayments');
  };

  const handleExportInsurance = () => {
    const headers = ['ID', 'Date', 'Member', 'Vehicle', 'Policy Number', 'Type', 'Premium', 'Coverage', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredInsurance.map(item => [
        item.id, item.date, item.memberName, item.vehicleReg, item.policyNumber, item.insuranceType, item.premium, item.coveragePeriod, item.status
      ].join(','))
    ].join('\n');
    downloadCSV(csvContent, 'insurance_payments');
  };

  const handleExportLoans = () => {
    const headers = ['ID', 'Date', 'Borrower', 'Membership ID', 'Type', 'Principal', 'Interest Rate', 'Tenure', 'Purpose', 'Guarantor'];
    const csvContent = [
      headers.join(','),
      ...filteredLoans.map(item => [
        item.id, item.date, item.borrowerName, item.membershipId, item.loanType, item.principal, item.interestRate, item.tenure, item.purpose, item.guarantorName
      ].join(','))
    ].join('\n');
    downloadCSV(csvContent, 'loans_disbursed');
  };

  const handleExportSavings = () => {
    const headers = ['ID', 'Date', 'Member', 'Membership ID', 'Type', 'Amount', 'Cumulative Balance', 'Interest Rate', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...filteredSavings.map(item => [
        item.id, item.date, item.memberName, item.membershipId, item.savingsType, item.amount, item.cumulativeBalance, item.interestRate, item.paymentMethod
      ].join(','))
    ].join('\n');
    downloadCSV(csvContent, 'savings_deposits');
  };

  const handleExportExpenses = () => {
    const headers = ['ID', 'Date', 'Category', 'Subcategory', 'Description', 'Amount', 'Vendor', 'Payment Method', 'Approved By', 'Receipt No'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(item => [
        item.id, item.date, item.category, item.subcategory, `"${item.description}"`, item.amount, item.vendor, item.paymentMethod, item.approvedBy, item.receiptNo
      ].join(','))
    ].join('\n');
    downloadCSV(csvContent, 'expenses');
  };

  const handleExportSummary = () => {
    const headers = ['Metric', 'Amount (KSh)'];
    const rows = [
      headers,
      ['Total Income', totalIncome],
      ['- Daily Remittances', totalRemittances],
      ['- Insurance Payments', totalInsurancePayments],
      ['- Loan Repayments', totalLoanRepayments],
      ['- Savings Deposits', totalSavings],
      ['- Share Contributions', totalShareContributions],
      ['- Investment Income', totalInvestmentIncome],
      ['', ''],
      ['Total Expenses', totalExpenses],
      ['', ''],
      ['Loans Disbursed', totalLoansGiven],
      ['Dividends Paid', totalDividendsPaid],
      ['', ''],
      ['Net Position', netPosition],
      ['', ''],
      ['Liquidity Ratio', `${liquidityRatio.toFixed(2)}%`],
      ['Loan-to-Deposit Ratio', `${loanToDepositRatio.toFixed(2)}%`],
      ['Capital Adequacy', `${capitalAdequacy.toFixed(2)}%`]
    ];
    const csvContent = rows.map(row => row.join(',')).join('\n');
    downloadCSV(csvContent, 'financial_summary');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <LayoutComponent 
      user={user} 
      currentPage={currentPage} 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-gray-900 dark:text-white">Financial Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive financial analysis and insights for MATIS SACCO</p>
          </div>
          <Button onClick={handleExportSummary} className="bg-[var(--neon-purple)]">
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
        </div>

        {reportError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {reportError}
          </div>
        )}

        {!reportError && reportLoading && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            Loading latest financial data…
          </div>
        )}

        {accountFilter && (
          <div className="flex items-center justify-between rounded-md border border-purple-200 bg-purple-50 px-4 py-2 text-sm text-purple-700">
            <span>
              Filtering results by savings account <strong>{accountFilter}</strong>.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('financialReports.accountId');
                }
                setAccountFilter(null);
              }}
            >
              Clear Filter
            </Button>
          </div>
        )}

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="date-range" className="mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Period
                </Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-week">Last 7 days</SelectItem>
                    <SelectItem value="last-month">Last 30 days (Default)</SelectItem>
                    <SelectItem value="last-3-months">Last 3 months</SelectItem>
                    <SelectItem value="last-6-months">Last 6 months</SelectItem>
                    <SelectItem value="ytd">Year to date</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateRange === 'custom' && (
                <>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="start-date" className="mb-2">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="end-date" className="mb-2">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <Badge variant="outline" className="px-4 py-2">
                <Filter className="h-4 w-4 mr-2" />
                {filteredRemittances.length + filteredExpenses.length} Records
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                  <p className="text-2xl text-gray-900 dark:text-white mt-1">
                    KSh {totalIncome.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    All revenue streams
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                  <p className="text-2xl text-gray-900 dark:text-white mt-1">
                    KSh {totalExpenses.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center mt-2">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {expensesByCategory.length} categories
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loans Disbursed</p>
                  <p className="text-2xl text-gray-900 dark:text-white mt-1">
                    KSh {totalLoansGiven.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center mt-2">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {filteredLoans.length} loans given
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Position</p>
                  <p className={`text-2xl mt-1 ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    KSh {Math.abs(netPosition).toLocaleString()}
                  </p>
                  <p className={`text-xs flex items-center mt-2 ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netPosition >= 0 ? (
                      <><TrendingUp className="h-3 w-3 mr-1" />Surplus</>
                    ) : (
                      <><TrendingDown className="h-3 w-3 mr-1" />Deficit</>
                    )}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  netPosition >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <BarChart3 className={`h-6 w-6 ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-[var(--neon-yellow)]" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Daily Remittances</p>
                  <p className="text-gray-900 dark:text-white">KSh {totalRemittances.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-[var(--neon-blue)]" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Insurance</p>
                  <p className="text-gray-900 dark:text-white">KSh {totalInsurancePayments.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <PiggyBank className="h-8 w-8 text-[var(--neon-purple)]" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Savings</p>
                  <p className="text-gray-900 dark:text-white">KSh {totalSavings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUpIcon className="h-8 w-8 text-[var(--neon-orange)]" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Loan Repayments</p>
                  <p className="text-gray-900 dark:text-white">KSh {totalLoanRepayments.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Share Capital</p>
                  <p className="text-gray-900 dark:text-white">KSh {totalShareContributions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="h-8 w-8 text-teal-500" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Investments</p>
                  <p className="text-gray-900 dark:text-white">KSh {totalInvestmentIncome.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Ratios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Liquidity Ratio</p>
                  <p className="text-2xl text-gray-900 dark:text-white mt-1">
                    {liquidityRatio.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {liquidityRatio > 100 ? 'Good liquidity position' : 'Monitor liquidity'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  liquidityRatio > 100 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  <Wallet className={`h-6 w-6 ${liquidityRatio > 100 ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loan-to-Deposit Ratio</p>
                  <p className="text-2xl text-gray-900 dark:text-white mt-1">
                    {loanToDepositRatio.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {loanToDepositRatio < 80 ? 'Healthy lending' : 'High lending ratio'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  loanToDepositRatio < 80 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <CreditCard className={`h-6 w-6 ${loanToDepositRatio < 80 ? 'text-green-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Capital Adequacy</p>
                  <p className="text-2xl text-gray-900 dark:text-white mt-1">
                    {capitalAdequacy.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {capitalAdequacy > 15 ? 'Strong capital base' : 'Need more capital'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  capitalAdequacy > 15 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Building className={`h-6 w-6 ${capitalAdequacy > 15 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                    <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="Net Position" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Tabs */}
        <Tabs defaultValue="remittances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
            <TabsTrigger value="remittances">Remittances</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="repayments">Repayments</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="shares">Shares</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="dividends">Dividends</TabsTrigger>
          </TabsList>

          {/* Daily Remittances Tab */}
          <TabsContent value="remittances" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daily Remittances</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Revenue from matatu operations
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportRemittances}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead className="text-right">Operations</TableHead>
                        <TableHead className="text-right">Insurance</TableHead>
                        <TableHead className="text-right">Loan Repayment</TableHead>
                        <TableHead className="text-right">Savings</TableHead>
                        <TableHead className="text-right">Total Payment</TableHead>
                        <TableHead>Mpesa Ref</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedRemittances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="py-6 text-center text-sm text-gray-500">
                            No remittance records available for the selected filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedRemittances.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{item.memberName ?? 'N/A'}</TableCell>
                            <TableCell>{item.driverName ?? 'N/A'}</TableCell>
                            <TableCell>{item.vehicleReg ?? 'N/A'}</TableCell>
                            <TableCell>
                              {item.routeName ? <Badge variant="outline">{item.routeName}</Badge> : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right text-green-600">KSh {item.operationsAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">KSh {item.insuranceAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">KSh {item.loanRepaymentAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">KSh {item.savingsAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">KSh {item.totalAmount.toLocaleString()}</TableCell>
                            <TableCell>{item.mpesaReference ?? '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {remittanceTotalCount > displayedRemittances.length && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing {displayedRemittances.length} of {remittanceTotalCount} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Payments Tab */}
          <TabsContent value="insurance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Insurance Payments</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Insurance premiums received from members
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportInsurance}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Policy Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Coverage</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInsurance.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{item.memberName}</TableCell>
                          <TableCell>{item.vehicleReg}</TableCell>
                          <TableCell>{item.policyNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.insuranceType}</Badge>
                          </TableCell>
                          <TableCell>KSh {item.premium.toLocaleString()}</TableCell>
                          <TableCell>{item.coveragePeriod}</TableCell>
                          <TableCell>
                            <Badge className={item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredInsurance.length > 20 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing 20 of {filteredInsurance.length} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Disbursed Tab */}
          <TabsContent value="loans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Loans Disbursed</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total loans given to members
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportLoans}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Borrower</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Tenure</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Guarantor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{item.borrowerName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.loanType}</Badge>
                          </TableCell>
                          <TableCell>KSh {item.principal.toLocaleString()}</TableCell>
                          <TableCell>{item.interestRate}%</TableCell>
                          <TableCell>{item.tenure} months</TableCell>
                          <TableCell>{item.purpose}</TableCell>
                          <TableCell>{item.guarantorName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredLoans.length > 20 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing 20 of {filteredLoans.length} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loan Repayments Tab */}
          <TabsContent value="repayments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Loan Repayments</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Loan payments received from borrowers
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportLoanRepaymentsReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead className="text-right">Loan Repayment</TableHead>
                        <TableHead className="text-right">Insurance</TableHead>
                        <TableHead className="text-right">Savings</TableHead>
                        <TableHead className="text-right">Operations</TableHead>
                        <TableHead className="text-right">Total Payment</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedRepayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="py-6 text-center text-sm text-gray-500">
                            No loan repayment records available for the selected filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedRepayments.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{item.memberName ?? 'N/A'}</TableCell>
                            <TableCell>{item.vehicleReg ?? 'N/A'}</TableCell>
                            <TableCell className="text-right text-green-600">KSh {item.repaymentAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">KSh {item.insuranceAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">KSh {item.savingsAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">KSh {item.operationsAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">KSh {item.totalPayment.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.transactions.length}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {loanRepaymentTotalCount > displayedRepayments.length && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing {displayedRepayments.length} of {loanRepaymentTotalCount} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Savings Deposits Tab */}
          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Savings Deposits</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Member savings and deposits
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportSavings}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Cumulative Balance</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Receipt No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSavings.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{item.memberName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.savingsType}</Badge>
                          </TableCell>
                          <TableCell className="text-green-600">KSh {item.amount.toLocaleString()}</TableCell>
                          <TableCell>KSh {item.cumulativeBalance.toLocaleString()}</TableCell>
                          <TableCell>{item.interestRate}%</TableCell>
                          <TableCell>{item.paymentMethod}</TableCell>
                          <TableCell className="text-xs">{item.receiptNo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredSavings.length > 20 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing 20 of {filteredSavings.length} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Share Contributions Tab */}
          <TabsContent value="shares" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Share Contributions</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Member share capital contributions
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadCSV('', 'share_contributions')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Membership ID</TableHead>
                        <TableHead>Shares Purchased</TableHead>
                        <TableHead>Price per Share</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Total Shares</TableHead>
                        <TableHead>Total Capital</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShares.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{item.memberName}</TableCell>
                          <TableCell>{item.membershipId}</TableCell>
                          <TableCell>{item.numberOfShares}</TableCell>
                          <TableCell>KSh {item.pricePerShare.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">KSh {item.contributionAmount.toLocaleString()}</TableCell>
                          <TableCell>{item.totalSharesHeld}</TableCell>
                          <TableCell>KSh {item.totalShareCapital.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredShares.length > 20 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing 20 of {filteredShares.length} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expenses</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Detailed expense records with categories
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportExpenses}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Expense Filters */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search-expenses">Search</Label>
                    <Input
                      id="search-expenses"
                      placeholder="Search by description, vendor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="category-filter">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expense Category Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {expensesByCategory.map((category) => (
                    <Card key={category.name} className="border-l-4" style={{ borderLeftColor: category.color }}>
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400">{category.name}</p>
                        <p className="text-gray-900 dark:text-white mt-1">
                          KSh {category.value.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Expenses Pie Chart */}
                <Card>
                  <CardContent className="p-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : ''}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Expenses Table */}
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Subcategory</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Receipt No</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.slice(0, 20).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{item.subcategory}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                          <TableCell>{item.vendor}</TableCell>
                          <TableCell className="text-red-600">KSh {item.amount.toLocaleString()}</TableCell>
                          <TableCell>{item.paymentMethod}</TableCell>
                          <TableCell className="text-xs">{item.receiptNo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredExpenses.length > 20 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                    Showing 20 of {filteredExpenses.length} records. Export to view all.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investment Income Tab */}
          <TabsContent value="investments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Investment Income</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Returns from SACCO investments
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadCSV('', 'investment_income')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Investment Type</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest Earned</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Maturity Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvestments.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.investmentType}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.institution}</TableCell>
                          <TableCell>KSh {item.principal.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">KSh {item.interestEarned.toLocaleString()}</TableCell>
                          <TableCell>{item.interestRate}%</TableCell>
                          <TableCell>{new Date(item.maturityDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dividend Payments Tab */}
          <TabsContent value="dividends" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dividend Payments</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Dividends paid to members
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadCSV('', 'dividend_payments')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Membership ID</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Dividend per Share</TableHead>
                        <TableHead>Total Dividend</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDividends.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{item.memberName}</TableCell>
                          <TableCell>{item.membershipId}</TableCell>
                          <TableCell>{item.numberOfShares}</TableCell>
                          <TableCell>KSh {item.dividendPerShare.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">KSh {item.totalDividend.toLocaleString()}</TableCell>
                          <TableCell>{item.year}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutComponent>
  );
}
