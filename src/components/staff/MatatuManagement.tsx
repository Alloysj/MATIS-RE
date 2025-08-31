import { useState } from 'react';
import { StaffLayout } from './StaffLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  Car, 
  User, 
  DollarSign, 
  Shield, 
  MoreVertical, 
  UserPlus, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MatatuManagementProps {
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function MatatuManagement({ user, onNavigate, onLogout }: MatatuManagementProps) {
  const [assignDriverDialogOpen, setAssignDriverDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [driverId, setDriverId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('');

  // Mock matatu data
  const matatus = [
    {
      id: 1,
      plateNumber: 'KCA 123A',
      route: 'Nairobi - Kiambu',
      driver: {
        name: 'John Kamau',
        phone: '+254 712 345 678',
        license: 'DL123456'
      },
      owner: 'Peter Mwangi',
      savings: 45000,
      loans: 25000,
      insurance: {
        provider: 'Jubilee Insurance',
        expiryDate: '2024-12-15',
        status: 'Active'
      },
      status: 'Active',
      lastService: '2024-05-15',
      revenue: 85000
    },
    {
      id: 2,
      plateNumber: 'KBZ 456B',
      route: 'Nairobi - Thika',
      driver: {
        name: 'Mary Wanjiku',
        phone: '+254 722 567 890',
        license: 'DL789012'
      },
      owner: 'Jane Doe',
      savings: 32000,
      loans: 15000,
      insurance: {
        provider: 'ICEA LION',
        expiryDate: '2024-08-20',
        status: 'Expiring Soon'
      },
      status: 'Active',
      lastService: '2024-06-01',
      revenue: 72000
    },
    {
      id: 3,
      plateNumber: 'KCD 789C',
      route: 'Nairobi - Kikuyu',
      driver: null,
      owner: 'Samuel Kiprotich',
      savings: 28000,
      loans: 35000,
      insurance: {
        provider: 'Madison Insurance',
        expiryDate: '2024-07-10',
        status: 'Expiring Soon'
      },
      status: 'Inactive',
      lastService: '2024-04-20',
      revenue: 0
    }
  ];

  const handleAssignDriver = () => {
    if (!driverId) {
      toast.error('Please enter driver ID');
      return;
    }

    // Simulate driver assignment
    setTimeout(() => {
      setAssignDriverDialogOpen(false);
      setDriverId('');
      setSelectedVehicle(null);
      toast.success('Driver assigned successfully!');
    }, 1000);
  };

  const handlePayment = () => {
    if (!paymentAmount || !paymentType) {
      toast.error('Please fill in all payment details');
      return;
    }

    // Simulate MPESA STK push
    setTimeout(() => {
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentType('');
      setSelectedVehicle(null);
      toast.success('MPESA STK push sent successfully! Check your phone to complete payment.');
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'Maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'Expiring Soon':
        return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInsuranceStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600';
      case 'Expiring Soon':
        return 'text-orange-600';
      case 'Expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <StaffLayout user={user} currentPage="staff/matatumanagement" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matatu Management</h1>
          <p className="text-gray-600">Manage fleet vehicles, drivers, and payments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-[var(--neon-turquoise)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Car className="h-8 w-8 text-[var(--neon-turquoise)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{matatus.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-yellow)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-[var(--neon-yellow)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{matatus.filter(m => m.status === 'Active').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-purple)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-[var(--neon-purple)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">KES {matatus.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-[var(--neon-orange)]">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-[var(--neon-orange)]" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Insurance Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{matatus.filter(m => m.insurance.status === 'Expiring Soon').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matatu Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {matatus.map((matatu) => (
            <Card key={matatu.id} className="border-l-4 border-[var(--neon-turquoise)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-[var(--neon-turquoise)]" />
                    <span>{matatu.plateNumber}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(matatu.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVehicle(matatu);
                            setAssignDriverDialogOpen(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign Driver
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVehicle(matatu);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Process Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardDescription>{matatu.route}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Driver Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Driver
                  </h4>
                  {matatu.driver ? (
                    <div className="text-sm text-gray-600 ml-6">
                      <p>{matatu.driver.name}</p>
                      <p>{matatu.driver.phone}</p>
                      <p>License: {matatu.driver.license}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 ml-6">No driver assigned</p>
                  )}
                </div>

                {/* Financial Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Savings</p>
                    <p className="font-bold text-green-600">KES {matatu.savings.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loans</p>
                    <p className="font-bold text-orange-600">KES {matatu.loans.toLocaleString()}</p>
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Insurance
                  </h4>
                  <div className="text-sm ml-6">
                    <p className="text-gray-600">{matatu.insurance.provider}</p>
                    <p className={`${getInsuranceStatusColor(matatu.insurance.status)}`}>
                      Expires: {matatu.insurance.expiryDate}
                    </p>
                    {getStatusBadge(matatu.insurance.status)}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{matatu.owner}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue (Month):</span>
                    <span className="font-medium text-green-600">KES {matatu.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Service:</span>
                    <span className="font-medium">{matatu.lastService}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Assign Driver Dialog */}
        <Dialog open={assignDriverDialogOpen} onOpenChange={setAssignDriverDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Driver</DialogTitle>
              <DialogDescription>
                Assign a driver to {selectedVehicle?.plateNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="driverId">Driver ID</Label>
                <Input
                  id="driverId"
                  placeholder="Enter driver ID"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                />
                <p className="text-xs text-gray-500">Driver must be registered in the system</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAssignDriverDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignDriver}
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Driver
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Process payment for {selectedVehicle?.plateNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="">Select payment type</option>
                  <option value="savings">Savings Deposit</option>
                  <option value="loan">Loan Payment</option>
                  <option value="insurance">Insurance Premium</option>
                  <option value="maintenance">Maintenance Fee</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Send MPESA STK
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
}