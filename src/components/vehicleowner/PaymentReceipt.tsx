import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  Calendar,
  Car,
  User,
  Phone,
  CheckCircle
} from 'lucide-react';

interface PaymentReceiptProps {
  paymentId: string;
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock payment data - in real app this would be fetched by paymentId
const getPaymentData = (id: string) => {
  const payments: Record<string, any> = {
    'PAY001': {
      id: 'PAY001',
      date: '2024-01-15',
      time: '14:30:25',
      vehicle: 'KCA 123A',
      route: 'CBD-Kikuyu',
      driver: 'John Mwangi',
      totalAmount: 12000,
      mpesaRef: 'QA23H5K9M1',
      allocations: {
        savings: 8000,
        loanRepayment: 3000,
        insurance: 500,
        operations: 500
      },
      status: 'Completed',
      balances: {
        totalSavings: 53000,
        outstandingLoan: 22000,
        insuranceStatus: 'Active'
      }
    },
    'PAY002': {
      id: 'PAY002',
      date: '2024-01-14',
      time: '15:45:12',
      vehicle: 'KCB 456B',
      route: 'Westlands-Kangemi',
      driver: 'Mary Njeri',
      totalAmount: 11500,
      mpesaRef: 'QB45J8K2N7',
      allocations: {
        savings: 7500,
        loanRepayment: 2500,
        insurance: 750,
        operations: 750
      },
      status: 'Completed',
      balances: {
        totalSavings: 45500,
        outstandingLoan: 12500,
        insuranceStatus: 'Active'
      }
    }
  };

  return payments[id] || null;
};

export function PaymentReceipt({ paymentId, user, onNavigate, onLogout }: PaymentReceiptProps) {
  const payment = getPaymentData(paymentId);

  if (!payment) {
    return (
      <VehicleOwnerLayout
        currentPage={`users/payments/item/${paymentId}`}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      >
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-center">
            <CardContent className="p-8">
              <FileText className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <h2 className="text-2xl font-bold text-white mb-2">Payment Not Found</h2>
              <p className="text-white/70 mb-6">
                The payment receipt with ID "{paymentId}" could not be found.
              </p>
              <Button
                onClick={() => onNavigate('users/payments')}
                className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Payments
              </Button>
            </CardContent>
          </Card>
        </div>
      </VehicleOwnerLayout>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // In a real app, this would generate and download a PDF
    console.log('Downloading PDF for payment:', paymentId);
    alert('PDF download would be implemented here');
  };

  const handleDownloadCSV = () => {
    // In a real app, this would generate and download CSV
    const csvContent = `Payment ID,Date,Vehicle,Amount,Savings,Loan Repayment,Insurance,Operations
${payment.id},${payment.date},${payment.vehicle},${payment.totalAmount},${payment.allocations.savings},${payment.allocations.loanRepayment},${payment.allocations.insurance},${payment.allocations.operations}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-${paymentId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    // In a real app, this would generate and download Excel file
    console.log('Downloading Excel for payment:', paymentId);
    alert('Excel download would be implemented here');
  };

  return (
    <VehicleOwnerLayout
      currentPage={`users/payments/item/${paymentId}`}
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => onNavigate('users/payments')}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-[var(--neon-turquoise)]/30 text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)]/10"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            
            <div className="relative group">
              <Button className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              {/* Export Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm"
                  >
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Card */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl print:shadow-none print:bg-white print:text-black">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-full flex items-center justify-center print:bg-gray-800">
              <FileText className="w-8 h-8 text-slate-900 print:text-white" />
            </div>
            <CardTitle className="text-2xl text-white print:text-black">
              MATIS SACCO Payment Receipt
            </CardTitle>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 print:bg-green-100 print:text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {payment.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gradient-to-r from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 p-6 rounded-lg border border-white/20 print:bg-gray-50 print:border-gray-300">
              <div className="text-center">
                <p className="text-white/80 print:text-gray-600 mb-2">Total Payment Amount</p>
                <p className="text-4xl font-bold text-[var(--neon-turquoise)] print:text-blue-600">
                  KES {payment.totalAmount.toLocaleString()}
                </p>
                <p className="text-white/60 print:text-gray-500 mt-2">
                  Payment ID: {payment.id}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white print:text-black mb-3">Payment Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-[var(--neon-yellow)] print:text-blue-600" />
                    <div>
                      <p className="text-white/70 print:text-gray-600 text-sm">Date & Time</p>
                      <p className="text-white print:text-black">{payment.date} at {payment.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Car className="w-4 h-4 text-[var(--neon-purple)] print:text-blue-600" />
                    <div>
                      <p className="text-white/70 print:text-gray-600 text-sm">Vehicle</p>
                      <p className="text-white print:text-black">{payment.vehicle} ({payment.route})</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-[var(--neon-orange)] print:text-blue-600" />
                    <div>
                      <p className="text-white/70 print:text-gray-600 text-sm">Driver</p>
                      <p className="text-white print:text-black">{payment.driver}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-[var(--neon-turquoise)] print:text-blue-600" />
                    <div>
                      <p className="text-white/70 print:text-gray-600 text-sm">M-PESA Reference</p>
                      <p className="text-white print:text-black font-mono">{payment.mpesaRef}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white print:text-black mb-3">Member Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-white/70 print:text-gray-600 text-sm">Member Name</p>
                    <p className="text-white print:text-black">{user?.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-white/70 print:text-gray-600 text-sm">Phone Number</p>
                    <p className="text-white print:text-black">{user?.phone}</p>
                  </div>
                  
                  <div>
                    <p className="text-white/70 print:text-gray-600 text-sm">Member Type</p>
                    <p className="text-white print:text-black">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/20 print:bg-gray-300" />

            {/* Payment Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-white print:text-black mb-4">Payment Allocation Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--neon-turquoise)]/10 rounded-lg border border-[var(--neon-turquoise)]/30 print:bg-blue-50 print:border-blue-300">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 print:text-gray-700">Savings Deposit</span>
                    <span className="text-[var(--neon-turquoise)] print:text-blue-600 font-bold">
                      KES {payment.allocations.savings.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-[var(--neon-orange)]/10 rounded-lg border border-[var(--neon-orange)]/30 print:bg-orange-50 print:border-orange-300">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 print:text-gray-700">Loan Repayment</span>
                    <span className="text-[var(--neon-orange)] print:text-orange-600 font-bold">
                      KES {payment.allocations.loanRepayment.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30 print:bg-green-50 print:border-green-300">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 print:text-gray-700">Insurance Premium</span>
                    <span className="text-green-400 print:text-green-600 font-bold">
                      KES {payment.allocations.insurance.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-[var(--neon-purple)]/10 rounded-lg border border-[var(--neon-purple)]/30 print:bg-purple-50 print:border-purple-300">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 print:text-gray-700">Operations Fee</span>
                    <span className="text-[var(--neon-purple)] print:text-purple-600 font-bold">
                      KES {payment.allocations.operations.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/20 print:bg-gray-300" />

            {/* Updated Balances */}
            <div>
              <h3 className="text-lg font-semibold text-white print:text-black mb-4">Account Balances After Payment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 print:bg-gray-50 print:border-gray-300">
                  <p className="text-white/70 print:text-gray-600 text-sm">Total Savings</p>
                  <p className="text-xl font-bold text-[var(--neon-turquoise)] print:text-blue-600">
                    KES {payment.balances.totalSavings.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 print:bg-gray-50 print:border-gray-300">
                  <p className="text-white/70 print:text-gray-600 text-sm">Outstanding Loan</p>
                  <p className="text-xl font-bold text-[var(--neon-orange)] print:text-orange-600">
                    KES {payment.balances.outstandingLoan.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 print:bg-gray-50 print:border-gray-300">
                  <p className="text-white/70 print:text-gray-600 text-sm">Insurance Status</p>
                  <p className="text-xl font-bold text-green-400 print:text-green-600">
                    {payment.balances.insuranceStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-white/20 print:border-gray-300 text-center">
              <p className="text-white/60 print:text-gray-500 text-sm">
                This is an official receipt from MATIS SACCO Ltd.<br/>
                For inquiries, contact: info@matissacco.co.ke | +254 700 123 456
              </p>
              <p className="text-white/40 print:text-gray-400 text-xs mt-2">
                Generated on {new Date().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </VehicleOwnerLayout>
  );
}