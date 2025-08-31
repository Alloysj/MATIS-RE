import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
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
  AlertTriangle
} from 'lucide-react';

interface LoanApplicationsProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const normalLoans = [
  {
    id: 'NL001',
    applicant: 'James Mutua',
    applicantId: 'AU001',
    amount: 100000,
    purpose: 'Vehicle Maintenance',
    savings: 45000,
    guarantors: ['Mary Wanjiku', 'Peter Ochieng'],
    applicationDate: '2024-01-15',
    status: 'Pending',
    creditScore: 'Good',
    monthlyIncome: 80000,
    existingLoans: 0
  },
  {
    id: 'NL002',
    applicant: 'Catherine Muthoni',
    applicantId: 'AU004',
    amount: 75000,
    purpose: 'Route Permit',
    savings: 25000,
    guarantors: ['Grace Akinyi'],
    applicationDate: '2024-01-12',
    status: 'Under Review',
    creditScore: 'Fair',
    monthlyIncome: 60000,
    existingLoans: 1
  },
  {
    id: 'NL003',
    applicant: 'John Kamau',
    applicantId: 'PU001',
    amount: 50000,
    purpose: 'Insurance Payment',
    savings: 15000,
    guarantors: ['James Mutua', 'Samuel Kiprop'],
    applicationDate: '2024-01-10',
    status: 'Approved',
    creditScore: 'Good',
    monthlyIncome: 70000,
    existingLoans: 0
  }
];

const emergencyLoans = [
  {
    id: 'EL001',
    applicant: 'Mary Wanjiku',
    applicantId: 'AU002',
    amount: 15000,
    reason: 'Medical Emergency',
    savings: 30000,
    guarantors: ['James Mutua'],
    applicationDate: '2024-01-16',
    status: 'Pending',
    urgency: 'High',
    expectedRepayment: '7 days'
  },
  {
    id: 'EL002',
    applicant: 'Samuel Kiprop',
    applicantId: 'AU003',
    amount: 20000,
    reason: 'Vehicle Breakdown',
    savings: 18000,
    guarantors: ['Peter Ochieng'],
    applicationDate: '2024-01-14',
    status: 'Approved',
    urgency: 'Medium',
    expectedRepayment: '14 days'
  }
];

export function LoanApplications({ user, onNavigate, onLogout }: LoanApplicationsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'normal' | 'emergency'>('normal');

  const handleApproveLoan = (loanId: string, type: 'normal' | 'emergency') => {
    console.log(`Approving ${type} loan:`, loanId);
    // Add approval logic here
  };

  const handleRejectLoan = (loanId: string, type: 'normal' | 'emergency') => {
    console.log(`Rejecting ${type} loan:`, loanId);
    // Add rejection logic here
  };

  const handleViewApplicant = (applicantId: string) => {
    onNavigate(`admin/users/user_profile/${applicantId}`);
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNormalLoans = normalLoans.filter(loan =>
    loan.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmergencyLoans = emergencyLoans.filter(loan =>
    loan.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout 
      user={user} 
      currentPage="admin/loans" 
      onNavigate={onNavigate} 
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Applications</h1>
            <p className="text-gray-600 mt-1">Review and approve loan applications</p>
          </div>
          <Button 
            onClick={() => onNavigate('admin/financials')}
            variant="outline"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Financial Overview
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {normalLoans.length + emergencyLoans.length}
                  </p>
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
                  <p className="text-2xl font-bold text-yellow-600">
                    {normalLoans.filter(l => l.status === 'Pending' || l.status === 'Under Review').length +
                     emergencyLoans.filter(l => l.status === 'Pending').length}
                  </p>
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
                  <p className="text-2xl font-bold text-red-600">
                    {emergencyLoans.filter(l => l.status === 'Pending').length}
                  </p>
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
                  <p className="text-2xl font-bold text-green-600">2</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={selectedTab === 'normal' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('normal')}
              className={selectedTab === 'normal' ? 'bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] hover:opacity-90' : ''}
            >
              Normal Loans ({normalLoans.length})
            </Button>
            <Button
              variant={selectedTab === 'emergency' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('emergency')}
              className={selectedTab === 'emergency' ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--hot-pink)] hover:opacity-90' : ''}
            >
              Emergency ({emergencyLoans.length})
            </Button>
          </div>
        </div>

        {/* Normal Loans Table */}
        {selectedTab === 'normal' && (
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
                  {filteredNormalLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div>
                          <button 
                            onClick={() => handleViewApplicant(loan.applicantId)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {loan.applicant}
                          </button>
                          <p className="text-sm text-gray-500">{loan.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(loan.amount)}
                      </TableCell>
                      <TableCell>{loan.purpose}</TableCell>
                      <TableCell>
                        <div className="text-green-600 font-medium">
                          {formatCurrency(loan.savings)}
                        </div>
                        <p className="text-xs text-gray-500">Available</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{loan.guarantors.length} guarantors</p>
                          <p className="text-xs text-gray-500">
                            {loan.guarantors.join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{loan.creditScore}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleApproveLoan(loan.id, 'normal')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectLoan(loan.id, 'normal')}>
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Reject
                            </DropdownMenuItem>
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
              {filteredNormalLoans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No normal loan applications found
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Emergency Loans Table */}
        {selectedTab === 'emergency' && (
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
                  {filteredEmergencyLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div>
                          <button 
                            onClick={() => handleViewApplicant(loan.applicantId)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {loan.applicant}
                          </button>
                          <p className="text-sm text-gray-500">{loan.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(loan.amount)}
                      </TableCell>
                      <TableCell>{loan.reason}</TableCell>
                      <TableCell>
                        <div className="text-green-600 font-medium">
                          {formatCurrency(loan.savings)}
                        </div>
                        <p className="text-xs text-gray-500">Available</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{loan.guarantors.length} guarantors</p>
                          <p className="text-xs text-gray-500">
                            {loan.guarantors.join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(loan.urgency)}>
                          {loan.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {loan.expectedRepayment}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleApproveLoan(loan.id, 'emergency')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRejectLoan(loan.id, 'emergency')}>
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                              Reject
                            </DropdownMenuItem>
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
              {filteredEmergencyLoans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No emergency loan applications found
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}