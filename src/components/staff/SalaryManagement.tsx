import { useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SalaryManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function SalaryManagement({ user, onNavigate, onLogout }: SalaryManagementProps) {
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');

  // Check if user is chairperson (for demo purposes, we'll check role)
  const isChairperson = user?.role === 'Chairperson' || user?.name === 'Admin User';

  // Mock data for staff salaries
  const staffSalaries = [
    {
      id: 1,
      name: 'John Kamau',
      position: 'Accountant',
      basicSalary: 45000,
      nhif: 1200,
      bankName: 'Equity Bank',
      accountNumber: '0123456789',
      status: 'Paid',
      payDate: '2024-06-01'
    },
    {
      id: 2,
      name: 'Mary Wanjiku',
      position: 'Secretary',
      basicSalary: 35000,
      nhif: 950,
      bankName: 'KCB Bank',
      accountNumber: '0987654321',
      status: 'Pending',
      payDate: null
    },
    {
      id: 3,
      name: 'Peter Mwangi',
      position: 'Field Officer',
      basicSalary: 38000,
      nhif: 1050,
      bankName: 'Cooperative Bank',
      accountNumber: '1122334455',
      status: 'Paid',
      payDate: '2024-06-01'
    }
  ];

  // Mock data for salary advance applications
  const advanceApplications = [
    {
      id: 1,
      staffName: 'John Kamau',
      amount: 15000,
      reason: 'Medical emergency',
      applicationDate: '2024-06-15',
      status: 'Pending',
      approvedBy: null
    },
    {
      id: 2,
      staffName: 'Mary Wanjiku',
      amount: 10000,
      reason: 'School fees payment',
      applicationDate: '2024-06-10',
      status: 'Approved',
      approvedBy: 'Admin User'
    },
    {
      id: 3,
      staffName: 'Peter Mwangi',
      amount: 8000,
      reason: 'Home maintenance',
      applicationDate: '2024-06-05',
      status: 'Rejected',
      approvedBy: 'Admin User'
    }
  ];

  // Mock personal salary data
  const personalSalary = {
    basicSalary: 45000,
    allowances: 5000,
    grossSalary: 50000,
    nhif: 1200,
    nssf: 1080,
    paye: 4500,
    netSalary: 43220,
    bankName: 'Equity Bank',
    accountNumber: '0123456789',
    lastPayDate: '2024-06-01',
    nextPayDate: '2024-07-01'
  };

  const handleAdvanceApplication = () => {
    if (!advanceAmount || !advanceReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setAdvanceDialogOpen(false);
      setAdvanceAmount('');
      setAdvanceReason('');
      toast.success('Salary advance application submitted successfully!');
    }, 1000);
  };

  const handlePaySalary = (staffId: number) => {
    // Simulate payment processing
    toast.success('Salary payment initiated successfully!');
  };

  const handleApproveAdvance = (applicationId: number) => {
    toast.success('Salary advance approved successfully!');
  };

  const handleRejectAdvance = (applicationId: number) => {
    toast.success('Salary advance rejected!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <StaffLayout user={user} currentPage="staff/salary" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
            <p className="text-gray-600">
              {isChairperson ? 'Manage staff salaries and advances' : 'View your salary information and apply for advances'}
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
                      max="22500"
                    />
                    <p className="text-xs text-gray-500">Maximum: KES 22,500 (50% of basic salary)</p>
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
                    <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAdvanceApplication}
                      className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white"
                    >
                      Submit Application
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isChairperson ? (
          /* Staff View */
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
                      <p className="text-xl font-bold text-blue-900">KES {personalSalary.basicSalary.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Gross Salary</Label>
                    <div className="p-3 bg-green-50 rounded-lg border">
                      <p className="text-xl font-bold text-green-900">KES {personalSalary.grossSalary.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Deductions</Label>
                    <div className="p-3 bg-red-50 rounded-lg border">
                      <p className="text-xl font-bold text-red-900">KES {(personalSalary.nhif + personalSalary.nssf + personalSalary.paye).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Net Salary</Label>
                    <div className="p-3 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 rounded-lg border border-[var(--neon-turquoise)]/20">
                      <p className="text-xl font-bold text-gray-900">KES {personalSalary.netSalary.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Deduction Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">NHIF</span>
                        <span className="font-medium">KES {personalSalary.nhif.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">NSSF</span>
                        <span className="font-medium">KES {personalSalary.nssf.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PAYE</span>
                        <span className="font-medium">KES {personalSalary.paye.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Payment Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bank</span>
                        <span className="font-medium">{personalSalary.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account</span>
                        <span className="font-medium">{personalSalary.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Payment</span>
                        <span className="font-medium">{personalSalary.lastPayDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Payment</span>
                        <span className="font-medium text-green-600">{personalSalary.nextPayDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Advance Applications */}
            <Card className="border-l-4 border-[var(--neon-purple)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-[var(--neon-purple)]" />
                  <span>My Advance Applications</span>
                </CardTitle>
                <CardDescription>Track your salary advance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advanceApplications.filter(app => app.staffName === user?.name).map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">KES {application.amount.toLocaleString()}</TableCell>
                        <TableCell>{application.reason}</TableCell>
                        <TableCell>{application.applicationDate}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Chairperson View */
          <>
            {/* Staff Salaries Overview */}
            <Card className="border-l-4 border-[var(--neon-turquoise)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-[var(--neon-turquoise)]" />
                  <span>Staff Salaries</span>
                </CardTitle>
                <CardDescription>Manage all staff salary payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>NHIF</TableHead>
                      <TableHead>Bank Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffSalaries.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.position}</TableCell>
                        <TableCell>KES {staff.basicSalary.toLocaleString()}</TableCell>
                        <TableCell>KES {staff.nhif.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{staff.bankName}</p>
                            <p className="text-gray-500">{staff.accountNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(staff.status)}</TableCell>
                        <TableCell>
                          {staff.status === 'Pending' ? (
                            <Button 
                              size="sm"
                              onClick={() => handlePaySalary(staff.id)}
                              className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pay
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Salary Advance Applications */}
            <Card className="border-l-4 border-[var(--neon-orange)]">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-[var(--neon-orange)]" />
                  <span>Salary Advance Applications</span>
                </CardTitle>
                <CardDescription>Review and approve salary advance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advanceApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.staffName}</TableCell>
                        <TableCell>KES {application.amount.toLocaleString()}</TableCell>
                        <TableCell>{application.reason}</TableCell>
                        <TableCell>{application.applicationDate}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>
                          {application.status === 'Pending' ? (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm"
                                onClick={() => handleApproveAdvance(application.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectAdvance(application.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </StaffLayout>
  );
}