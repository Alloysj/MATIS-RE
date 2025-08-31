import { useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  FileText,
  Download,
  Search,
  Calendar,
  CreditCard,
  DollarSign,
  Car,
  PiggyBank,
  Shield,
  Filter,
  ExternalLink
} from 'lucide-react';

interface PaymentStatusProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const payments = [
  {
    id: 'PAY001',
    date: '2024-01-15',
    vehicle: 'KCA 123A',
    totalAmount: 12000,
    allocations: {
      savings: 8000,
      loanRepayment: 3000,
      insurance: 500,
      operations: 500
    },
    status: 'Completed',
    receiptUrl: '/users/payments/item/PAY001'
  },
  {
    id: 'PAY002',
    date: '2024-01-14',
    vehicle: 'KCB 456B',
    totalAmount: 11500,
    allocations: {
      savings: 7500,
      loanRepayment: 2500,
      insurance: 750,
      operations: 750
    },
    status: 'Completed',
    receiptUrl: '/users/payments/item/PAY002'
  },
  {
    id: 'PAY003',
    date: '2024-01-13',
    vehicle: 'KCA 123A',
    totalAmount: 12200,
    allocations: {
      savings: 8200,
      loanRepayment: 3000,
      insurance: 500,
      operations: 500
    },
    status: 'Completed',
    receiptUrl: '/users/payments/item/PAY003'
  },
  {
    id: 'PAY004',
    date: '2024-01-12',
    vehicle: 'KCB 456B',
    totalAmount: 11800,
    allocations: {
      savings: 7800,
      loanRepayment: 2500,
      insurance: 750,
      operations: 750
    },
    status: 'Processing',
    receiptUrl: '/users/payments/item/PAY004'
  }
];

const vehicles = [
  {
    id: '1',
    plate: 'KCA 123A',
    route: 'CBD-Kikuyu',
    totalSavings: 45000,
    outstandingLoan: 25000,
    insuranceStatus: 'Active',
    lastPayment: '2024-01-15'
  },
  {
    id: '2',
    plate: 'KCB 456B',
    route: 'Westlands-Kangemi',
    totalSavings: 38000,
    outstandingLoan: 15000,
    insuranceStatus: 'Active',
    lastPayment: '2024-01-14'
  }
];

export function PaymentStatus({ user, onNavigate, onLogout }: PaymentStatusProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = selectedVehicle === 'all' || payment.vehicle === selectedVehicle;
    const matchesStatus = selectedStatus === 'all' || payment.status.toLowerCase() === selectedStatus;
    
    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const totalPayments = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const totalSavings = vehicles.reduce((sum, vehicle) => sum + vehicle.totalSavings, 0);
  const totalLoans = vehicles.reduce((sum, vehicle) => sum + vehicle.outstandingLoan, 0);

  return (
    <VehicleOwnerLayout
      currentPage="users/payments"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payment Status & Vehicle Management</h1>
          <p className="text-white/70">
            Review your payment history and manage your vehicle finances
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Paid</p>
                  <p className="text-2xl font-bold text-[var(--neon-turquoise)]">
                    KES {totalPayments.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[var(--neon-turquoise)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-yellow)]/20 to-[var(--neon-orange)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Savings</p>
                  <p className="text-2xl font-bold text-[var(--neon-yellow)]">
                    KES {totalSavings.toLocaleString()}
                  </p>
                </div>
                <PiggyBank className="w-8 h-8 text-[var(--neon-yellow)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Outstanding Loans</p>
                  <p className="text-2xl font-bold text-[var(--neon-purple)]">
                    KES {totalLoans.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-[var(--neon-purple)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-[var(--lime-green)]/20 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Active Vehicles</p>
                  <p className="text-2xl font-bold text-green-400">
                    {vehicles.length}
                  </p>
                </div>
                <Car className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment History */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[var(--neon-orange)]" />
                    Payment History
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Track all your remittance payments
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[var(--neon-turquoise)]/30 text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/30 text-white">
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.plate}>
                        {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-32 bg-white/10 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/30 text-white">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-bold">{payment.id}</p>
                        <p className="text-white/70 text-sm">{payment.vehicle} • {payment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--neon-yellow)] font-bold">
                          KES {payment.totalAmount.toLocaleString()}
                        </p>
                        <Badge className={`${
                          payment.status === 'Completed' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-white/60">Savings: </span>
                        <span className="text-[var(--neon-turquoise)]">
                          KES {payment.allocations.savings.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/60">Loan: </span>
                        <span className="text-[var(--neon-orange)]">
                          KES {payment.allocations.loanRepayment.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/60">Insurance: </span>
                        <span className="text-green-400">
                          KES {payment.allocations.insurance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/60">Operations: </span>
                        <span className="text-[var(--neon-purple)]">
                          KES {payment.allocations.operations.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onNavigate(payment.receiptUrl)}
                      className="bg-gradient-to-r from-[var(--neon-yellow)]/20 to-[var(--neon-orange)]/20 text-white border border-[var(--neon-yellow)]/30 hover:from-[var(--neon-yellow)]/30 hover:to-[var(--neon-orange)]/30"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      View Receipt
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Management */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Car className="w-5 h-5 mr-2 text-[var(--neon-purple)]" />
                Vehicle Financial Status
              </CardTitle>
              <CardDescription className="text-white/70">
                Manage loans, savings, and insurance for each vehicle
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{vehicle.plate}</h3>
                      <p className="text-white/70 text-sm">{vehicle.route}</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {vehicle.insuranceStatus}
                    </Badge>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-[var(--neon-turquoise)]/10 rounded border border-[var(--neon-turquoise)]/30">
                      <p className="text-xs text-white/70">Savings</p>
                      <p className="text-sm font-bold text-[var(--neon-turquoise)]">
                        KES {vehicle.totalSavings.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[var(--neon-orange)]/10 rounded border border-[var(--neon-orange)]/30">
                      <p className="text-xs text-white/70">Loan</p>
                      <p className="text-sm font-bold text-[var(--neon-orange)]">
                        KES {vehicle.outstandingLoan.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded border border-green-500/30">
                      <p className="text-xs text-white/70">Insurance</p>
                      <p className="text-sm font-bold text-green-400">
                        Active
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => onNavigate('users/apply-loan')}
                      className="bg-gradient-to-r from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 text-white border border-[var(--neon-turquoise)]/30"
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      Apply Loan
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onNavigate('users/vehicles')}
                      className="bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 text-white border border-[var(--neon-purple)]/30"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/60">
                      Last payment: {vehicle.lastPayment}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </VehicleOwnerLayout>
  );
}