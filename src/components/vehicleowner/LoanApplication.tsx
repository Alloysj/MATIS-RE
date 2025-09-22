import { useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import {
  DollarSign,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator,
  Users,
  FileText
} from 'lucide-react';

interface LoanApplicationProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const vehicles = [
  {
    id: '1',
    plate: 'KCA 123A',
    savings: 45000,
    eligibleLoan: 135000, // 3x savings
    emergencyEligible: true,
    maxEmergency: 15000
  },
  {
    id: '2',
    plate: 'KCB 456B',
    savings: 38000,
    eligibleLoan: 114000,
    emergencyEligible: true,
    maxEmergency: 12000
  }
];

const pendingLoans = [
  {
    id: 'L001',
    vehicle: 'KCA 123A',
    amount: 50000,
    type: 'Normal Loan',
    status: 'Under Review',
    appliedDate: '2024-01-10',
    guarantors: ['John Doe', 'Mary Smith']
  },
  {
    id: 'L002',
    vehicle: 'KCB 456B',
    amount: 8000,
    type: 'Emergency Loan',
    status: 'Approved',
    appliedDate: '2024-01-08',
    guarantors: []
  }
];

const guarantorOptions = [
  { id: '1', name: 'John Doe', phone: '0712345678', savings: 67000 },
  { id: '2', name: 'Mary Smith', phone: '0723456789', savings: 54000 },
  { id: '3', name: 'Peter Ochieng', phone: '0734567890', savings: 89000 },
  { id: '4', name: 'Grace Wambui', phone: '0745678901', savings: 45000 },
];

export function LoanApplication({ user, onNavigate, onLogout }: LoanApplicationProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loanType, setLoanType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);

  const handleGuarantorToggle = (guarantorId: string) => {
    setSelectedGuarantors(prev => 
      prev.includes(guarantorId) 
        ? prev.filter(id => id !== guarantorId)
        : [...prev, guarantorId]
    );
  };

  const handleLoanApplication = async () => {
    // Simulate loan application submission
    console.log('Submitting loan application:', {
      vehicle: selectedVehicle,
      type: loanType,
      amount: loanAmount,
      purpose,
      guarantors: selectedGuarantors
    });
    
    setIsApplicationOpen(false);
    // Reset form
    setSelectedVehicle('');
    setLoanType('');
    setLoanAmount('');
    setPurpose('');
    setSelectedGuarantors([]);
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const ownSavings = selectedVehicleData?.savings || 0;
  const maxLoanAmount = loanType === 'emergency'
    ? ownSavings + 30000
    : ownSavings;
  const requestedAmount = Number(loanAmount) || 0;
  const emergencyExcess = Math.max(0, requestedAmount - ownSavings);

  return (
    <VehicleOwnerLayout
      currentPage="users/apply-loan"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Loan Application</h1>
            <p className="text-white/70">
              Apply for normal loans (3x savings) or emergency loans
            </p>
          </div>
          
          <Dialog open={isApplicationOpen} onOpenChange={setIsApplicationOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900">
                <DollarSign className="w-4 h-4 mr-2" />
                Apply for Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-xl bg-white/10 border-white/20 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">New Loan Application</DialogTitle>
                <DialogDescription className="text-white/70">
                  Fill in the details below to apply for a loan
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <Label>Select Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/30 text-white">
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div>
                            <p>{vehicle.plate}</p>
                            <p className="text-sm text-white/60">
                              Savings: KES {vehicle.savings.toLocaleString()}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Loan Type */}
                <div className="space-y-2">
                  <Label>Loan Type</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger className="bg-white/10 border-white/30 text-white">
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/30 text-white">
                      <SelectItem value="normal">Normal Loan (up to your savings)</SelectItem>
                      <SelectItem value="emergency">Emergency Loan (savings + KES 30,000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Loan Amount */}
                <div className="space-y-2">
                  <Label>Loan Amount (KES)</Label>
                  <Input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder={`Max: ${maxLoanAmount.toLocaleString()}`}
                    className="bg-white/10 border-white/30 text-white"
                    max={maxLoanAmount}
                  />
                  {selectedVehicleData && (
                    <p className="text-xs text-white/60">
                      Maximum available: KES {maxLoanAmount.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label>Purpose of Loan</Label>
                  <Textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g., Vehicle repairs, business expansion, emergency..."
                    className="bg-white/10 border-white/30 text-white min-h-20"
                  />
                </div>

                {/* Guarantors (only for emergency loans when exceeding own savings) */}
                {loanType === 'emergency' && requestedAmount > ownSavings && (
                  <div className="space-y-2">
                    <Label>Select Guarantors (names only)</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {guarantorOptions.map((guarantor) => (
                        <div
                          key={guarantor.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedGuarantors.includes(guarantor.id)
                              ? 'border-[var(--neon-turquoise)] bg-[var(--neon-turquoise)]/10'
                              : 'border-white/30 hover:border-white/50'
                          }`}
                          onClick={() => handleGuarantorToggle(guarantor.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{guarantor.name}</p>
                              <p className="text-white/60 text-sm">{guarantor.phone}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/60">
                      Required guarantee (combined): KES {emergencyExcess.toLocaleString()} (backend will verify)
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsApplicationOpen(false)}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLoanApplication}
                    disabled={
                      !selectedVehicle ||
                      !loanType ||
                      !loanAmount ||
                      !purpose ||
                      requestedAmount <= 0 ||
                      requestedAmount > maxLoanAmount ||
                      (loanType === 'emergency' && requestedAmount > ownSavings && selectedGuarantors.length === 0)
                    }
                  className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900"
                >
                  Submit Application
                </Button>
              </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Loan Eligibility */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-[var(--neon-turquoise)]" />
                Loan Eligibility
              </CardTitle>
              <CardDescription className="text-white/70">
                Your loan limits based on savings balance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Car className="w-5 h-5 text-[var(--neon-purple)]" />
                      <span className="text-white font-bold">{vehicle.plate}</span>
                    </div>
                    {vehicle.emergencyEligible && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Emergency Eligible
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">Current Savings:</span>
                      <span className="text-[var(--neon-turquoise)]">
                        KES {vehicle.savings.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Normal Loan Limit:</span>
                      <span className="text-[var(--neon-yellow)]">
                        KES {vehicle.eligibleLoan.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Emergency Loan Limit:</span>
                      <span className="text-[var(--neon-orange)]">
                        KES {vehicle.maxEmergency.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Loan Types Info */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[var(--neon-yellow)]" />
                Loan Types & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Normal Loan */}
              <div className="p-4 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--electric-blue)]/10 rounded-lg border border-[var(--neon-turquoise)]/30">
                <h3 className="text-lg font-semibold text-[var(--neon-turquoise)] mb-2">Normal Loan</h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Maximum amount: up to your current savings</li>
                  <li>• Guarantors: not required</li>
                  <li>• Interest: 0% (no interest)</li>
                  <li>• Repayment period: 6-24 months</li>
                  <li>• Processing time: 1�2 days</li>
                </ul>
              </div>

              {/* Emergency Loan */}
              <div className="p-4 bg-gradient-to-r from-[var(--neon-orange)]/10 to-[var(--neon-yellow)]/10 rounded-lg border border-[var(--neon-orange)]/30">
                <h3 className="text-lg font-semibold text-[var(--neon-orange)] mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Emergency Loan
                </h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Maximum amount: savings + KES 30,000</li>
                  <li>• Guarantors: required only for the excess over your savings</li>
                  <li>• Interest: 0% (no interest)</li>
                  <li>• Processing time: 6�12 hours</li>
                  <li>• </li>
                </ul>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-200">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  All loans are automatically deducted from your daily remittances. 
                  Ensure you maintain regular payments to keep your account in good standing.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Pending Loans */}
        <Card className="backdrop-blur-xl bg-white/10 border-white/20 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[var(--neon-purple)]" />
              Pending Loan Applications
            </CardTitle>
            <CardDescription className="text-white/70">
              Track the status of your loan applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLoans.length > 0 ? (
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <div key={loan.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-bold">{loan.id} - {loan.vehicle}</h3>
                        <p className="text-white/70 text-sm">{loan.type}</p>
                      </div>
                      <Badge className={`${
                        loan.status === 'Approved' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : loan.status === 'Under Review'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {loan.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-white/60 text-sm">Amount</p>
                        <p className="text-[var(--neon-yellow)] font-bold">
                          KES {loan.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Applied Date</p>
                        <p className="text-white">{loan.appliedDate}</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Guarantors</p>
                        <p className="text-white">
                          {loan.guarantors.length > 0 ? loan.guarantors.join(', ') : 'Not required'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending loan applications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VehicleOwnerLayout>
  );
}


