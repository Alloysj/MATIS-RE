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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Wallet, 
  Plus, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  Calendar,
  User,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface WageManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function WageManagement({ user, onNavigate, onLogout }: WageManagementProps) {
  const [wageDialogOpen, setWageDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Form state for adding wage
  const [workerName, setWorkerName] = useState('');
  const [workType, setWorkType] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [daysWorked, setDaysWorked] = useState('');
  const [workDate, setWorkDate] = useState('');
  const [notes, setNotes] = useState('');

  // Check if user is authorized (admin/treasurer)
  const isAuthorized = user?.role === 'Admin' || user?.role === 'Treasurer' || user?.name === 'Admin User';

  // Mock data for daily wage workers
  const wageWorkers = [
    {
      id: 1,
      name: 'David Ochieng',
      workType: 'Office Cleaner',
      dailyRate: 800,
      daysWorked: 26,
      totalAmount: 20800,
      month: 'June 2024',
      status: 'Paid',
      payDate: '2024-06-30'
    },
    {
      id: 2,
      name: 'Grace Akinyi',
      workType: 'Data Entry Clerk',
      dailyRate: 1200,
      daysWorked: 22,
      totalAmount: 26400,
      month: 'June 2024',
      status: 'Paid',
      payDate: '2024-06-30'
    },
    {
      id: 3,
      name: 'James Mutua',
      workType: 'Security Guard',
      dailyRate: 1000,
      daysWorked: 30,
      totalAmount: 30000,
      month: 'June 2024',
      status: 'Pending',
      payDate: null
    },
    {
      id: 4,
      name: 'Sarah Njeri',
      workType: 'Office Assistant',
      dailyRate: 900,
      daysWorked: 24,
      totalAmount: 21600,
      month: 'June 2024',
      status: 'Pending',
      payDate: null
    },
    {
      id: 5,
      name: 'Peter Kiprono',
      workType: 'Messenger',
      dailyRate: 700,
      daysWorked: 26,
      totalAmount: 18200,
      month: 'June 2024',
      status: 'Paid',
      payDate: '2024-06-30'
    }
  ];

  // Mock data for wage payment history
  const paymentHistory = [
    {
      id: 1,
      date: '2024-06-30',
      totalWorkers: 5,
      totalAmount: 117000,
      status: 'Completed',
      processedBy: 'John Kamau'
    },
    {
      id: 2,
      date: '2024-05-31',
      totalWorkers: 5,
      totalAmount: 115400,
      status: 'Completed',
      processedBy: 'Mary Wanjiku'
    },
    {
      id: 3,
      date: '2024-04-30',
      totalWorkers: 4,
      totalAmount: 92800,
      status: 'Completed',
      processedBy: 'John Kamau'
    }
  ];

  const handleAddWage = () => {
    if (!workerName || !workType || !dailyRate || !daysWorked || !workDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setWageDialogOpen(false);
      setWorkerName('');
      setWorkType('');
      setDailyRate('');
      setDaysWorked('');
      setWorkDate('');
      setNotes('');
      toast.success('Wage record added successfully!');
    }, 1000);
  };

  const handlePayWage = (workerId: number) => {
    toast.success('Wage payment processed successfully!');
  };

  const handleBulkPayment = () => {
    const pendingWorkers = wageWorkers.filter(w => w.status === 'Pending');
    if (pendingWorkers.length === 0) {
      toast.error('No pending wages to process');
      return;
    }
    toast.success(`Processing bulk payment for ${pendingWorkers.length} workers...`);
  };

  const handleExportWages = () => {
    toast.success('Wage report exported successfully!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPendingAmount = wageWorkers
    .filter(w => w.status === 'Pending')
    .reduce((sum, w) => sum + w.totalAmount, 0);

  const totalPaidAmount = wageWorkers
    .filter(w => w.status === 'Paid')
    .reduce((sum, w) => sum + w.totalAmount, 0);

  return (
    <StaffLayout user={user} currentPage="staff/wages" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
            <p className="text-gray-600">Manage daily wages for office workers</p>
          </div>
          <div className="flex space-x-2">
            {isAuthorized && (
              <>
                <Dialog open={wageDialogOpen} onOpenChange={setWageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Wage Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Wage Record</DialogTitle>
                      <DialogDescription>
                        Record daily wages for office workers
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="workerName">Worker Name *</Label>
                        <Input
                          id="workerName"
                          placeholder="Enter worker name"
                          value={workerName}
                          onChange={(e: { target: { value: any; }; }) => setWorkerName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workType">Work Type *</Label>
                        <Select value={workType} onValueChange={setWorkType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select work type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cleaner">Office Cleaner</SelectItem>
                            <SelectItem value="security">Security Guard</SelectItem>
                            <SelectItem value="messenger">Messenger</SelectItem>
                            <SelectItem value="assistant">Office Assistant</SelectItem>
                            <SelectItem value="clerk">Data Entry Clerk</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dailyRate">Daily Rate (KES) *</Label>
                          <Input
                            id="dailyRate"
                            type="number"
                            placeholder="800"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="daysWorked">Days Worked *</Label>
                          <Input
                            id="daysWorked"
                            type="number"
                            placeholder="26"
                            value={daysWorked}
                            onChange={(e) => setDaysWorked(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workDate">Month/Period *</Label>
                        <Input
                          id="workDate"
                          type="month"
                          value={workDate}
                          onChange={(e) => setWorkDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Additional notes or comments"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      {dailyRate && daysWorked && (
                        <div className="p-3 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 rounded-lg border border-[var(--neon-turquoise)]/20">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Total Amount:</span>
                            <span className="text-xl font-bold text-gray-900">
                              KES {(Number(dailyRate) * Number(daysWorked)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setWageDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddWage}
                          className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black"
                        >
                          Add Record
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline"
                  onClick={handleBulkPayment}
                  className="border-[var(--neon-purple)] text-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Process Bulk Payment
                </Button>
              </>
            )}
            <Button 
              variant="outline"
              onClick={handleExportWages}
              className="border-[var(--neon-orange)] text-[var(--neon-orange)] hover:bg-[var(--neon-orange)]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-[var(--neon-turquoise)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-[var(--neon-turquoise)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workers</p>
                  <p className="text-2xl font-bold text-gray-900">{wageWorkers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-yellow)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-[var(--neon-orange)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Wages (June)</p>
                  <p className="text-2xl font-bold text-gray-900">KES {(totalPaidAmount + totalPendingAmount).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-purple)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-green-900">KES {totalPaidAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-orange)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">KES {totalPendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search workers by name or work type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Input
                  type="month"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Wages */}
        <Card className="border-l-4 border-[var(--neon-turquoise)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-[var(--neon-turquoise)]" />
              <span>Current Month Wages - June 2024</span>
            </CardTitle>
            <CardDescription>Daily wage workers and their payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker Name</TableHead>
                  <TableHead>Work Type</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Days Worked</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {isAuthorized && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {wageWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>{worker.workType}</TableCell>
                    <TableCell>KES {worker.dailyRate.toLocaleString()}</TableCell>
                    <TableCell>{worker.daysWorked} days</TableCell>
                    <TableCell className="font-semibold">KES {worker.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(worker.status)}</TableCell>
                    {isAuthorized && (
                      <TableCell>
                        {worker.status === 'Pending' ? (
                          <Button 
                            size="sm"
                            onClick={() => handlePayWage(worker.id)}
                            className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black hover:opacity-90"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-l-4 border-[var(--neon-purple)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[var(--neon-purple)]" />
              <span>Payment History</span>
            </CardTitle>
            <CardDescription>Previous wage payment batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-[var(--neon-purple)]/10 to-[var(--hot-pink)]/10">
                      <Calendar className="h-5 w-5 text-[var(--neon-purple)]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {new Date(payment.date).toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {payment.totalWorkers} workers • KES {payment.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Processed by {payment.processedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(payment.status)}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}