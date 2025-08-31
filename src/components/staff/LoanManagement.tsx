import { useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
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
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LoanManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function LoanManagement({ user, onNavigate, onLogout }: LoanManagementProps) {
  const [loanType, setLoanType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [repaymentPeriod, setRepaymentPeriod] = useState('');

  // Mock data for current loans
  const currentLoans = [
    {
      id: 1,
      type: 'Normal Loan',
      amount: 50000,
      disbursed: 45000,
      balance: 32000,
      monthlyPayment: 5200,
      nextPayment: '2024-07-01',
      status: 'Active',
      progress: 64
    },
    {
      id: 2,
      type: 'Emergency Loan',
      amount: 15000,
      disbursed: 15000,
      balance: 8500,
      monthlyPayment: 2800,
      nextPayment: '2024-07-01',
      status: 'Active',
      progress: 43
    }
  ];

  // Mock repayment history
  const repaymentHistory = [
    {
      id: 1,
      date: '2024-06-01',
      amount: 5200,
      loanType: 'Normal Loan',
      status: 'Paid',
      balance: 32000
    },
    {
      id: 2,
      date: '2024-06-01',
      amount: 2800,
      loanType: 'Emergency Loan',
      status: 'Paid',
      balance: 8500
    },
    {
      id: 3,
      date: '2024-05-01',
      amount: 5200,
      loanType: 'Normal Loan',
      status: 'Paid',
      balance: 37200
    }
  ];

  const handleLoanApplication = () => {
    if (!loanType || !loanAmount || !loanPurpose || !repaymentPeriod) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate loan application
    toast.success('Loan application submitted successfully!');
    setLoanType('');
    setLoanAmount('');
    setLoanPurpose('');
    setRepaymentPeriod('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'Paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case 'Overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <StaffLayout user={user} currentPage="staff/loanmanagement" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600">Apply for loans and track repayment status</p>
        </div>

        {/* Loan Application Form */}
        <Card className="border-l-4 border-[var(--neon-turquoise)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-[var(--neon-turquoise)]" />
              <span>Apply for Loan</span>
            </CardTitle>
            <CardDescription>
              Submit a new loan application. Choose between normal and emergency loans.
            </CardDescription>
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
                <p className="text-xs text-gray-500">
                  {loanType === 'normal' && 'Processing time: 3-5 business days, Interest: 12% p.a.'}
                  {loanType === 'emergency' && 'Processing time: 24 hours, Interest: 15% p.a.'}
                </p>
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
                  Maximum: KES {loanType === 'emergency' ? '25,000' : '100,000'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Repayment Period *</Label>
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

              <div className="md:col-span-2">
                <Button 
                  onClick={handleLoanApplication}
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Loans */}
        <Card className="border-l-4 border-[var(--neon-yellow)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-[var(--neon-orange)]" />
              <span>Current Loans</span>
            </CardTitle>
            <CardDescription>Your active loans and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {currentLoans.map((loan) => (
                <div key={loan.id} className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan.type}</h3>
                      <p className="text-sm text-gray-600">Loan Amount: KES {loan.amount.toLocaleString()}</p>
                    </div>
                    {getStatusBadge(loan.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Outstanding Balance</p>
                      <p className="text-lg font-bold text-red-600">KES {loan.balance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="text-lg font-bold text-blue-600">KES {loan.monthlyPayment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Payment</p>
                      <p className="text-lg font-bold text-gray-900">{loan.nextPayment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-lg font-bold text-green-600">{loan.progress}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Repayment Progress</span>
                      <span>{loan.progress}% Complete</span>
                    </div>
                    <Progress value={loan.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Repayment Status */}
        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-[var(--neon-purple)]" />
              <span>Repayment History</span>
            </CardTitle>
            <CardDescription>Track your loan repayment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repaymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.loanType}</p>
                      <p className="text-sm text-gray-600">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">KES {payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Balance: KES {payment.balance.toLocaleString()}</p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loan Guidelines */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <AlertTriangle className="h-5 w-5" />
              <span>Loan Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">Normal Loans</h4>
                <ul className="text-sm space-y-1">
                  <li>• Maximum: KES 100,000</li>
                  <li>• Interest rate: 12% per annum</li>
                  <li>• Processing time: 3-5 business days</li>
                  <li>• Repayment period: 6-36 months</li>
                  <li>• Guarantors required for amounts above KES 50,000</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Emergency Loans</h4>
                <ul className="text-sm space-y-1">
                  <li>• Maximum: KES 25,000</li>
                  <li>• Interest rate: 15% per annum</li>
                  <li>• Processing time: 24 hours</li>
                  <li>• Repayment period: 6-24 months</li>
                  <li>• No guarantors required</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}