import { useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Car,
  CreditCard,
  PiggyBank,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  DollarSign,
  Plus
} from 'lucide-react';

interface VehicleDashboardProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

// Mock data
const vehicles = [
  {
    id: '1',
    plate: 'KCA 123A',
    route: 'CBD-Kikuyu',
    driver: 'John Mwangi',
    savings: 45000,
    loan: 25000,
    insurance: 'Active',
    lastPayment: '2024-01-15',
    paymentAmount: 12000,
    model: 'Toyota Hiace',
    year: 2018
  },
  {
    id: '2',
    plate: 'KCB 456B',
    route: 'Westlands-Kangemi',
    driver: 'Mary Njeri',
    savings: 38000,
    loan: 15000,
    insurance: 'Active',
    lastPayment: '2024-01-14',
    paymentAmount: 11500,
    model: 'Nissan Matatu',
    year: 2019
  }
];

const availableDrivers = [
  { id: '1', name: 'John Mwangi', phone: '0712345678', experience: '5 years' },
  { id: '2', name: 'Mary Njeri', phone: '0723456789', experience: '3 years' },
  { id: '3', name: 'Peter Ochieng', phone: '0734567890', experience: '7 years' },
  { id: '4', name: 'Grace Wambui', phone: '0745678901', experience: '4 years' },
];

export function VehicleDashboard({ user, onNavigate, onLogout }: VehicleDashboardProps) {
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [selectedVehicleForPayment, setSelectedVehicleForPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedVehicleForDriver, setSelectedVehicleForDriver] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');

  const handleRemittance = async (vehicleId: string) => {
    // Simulate payment processing
    console.log(`Processing remittance for vehicle ${vehicleId} with amount ${paymentAmount}`);
    setSelectedVehicleForPayment(null);
    setPaymentAmount('');
    // You would integrate with actual payment gateway here
  };

  const handleDriverAssignment = async () => {
    // Simulate driver assignment
    console.log(`Assigning driver ${selectedDriver} to vehicle ${selectedVehicleForDriver}`);
    setSelectedVehicleForDriver(null);
    setSelectedDriver('');
    // You would update the backend here
  };

  return (
    <VehicleOwnerLayout
      currentPage="users/vehicles"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Vehicles</h1>
            <p className="text-white/70">
              Manage your matatu fleet and track performance
            </p>
          </div>
          <Button
            onClick={() => onNavigate('users/addVehicle')}
            className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900 hover:from-[var(--neon-orange)] hover:to-[var(--neon-yellow)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {/* Vehicle Cards */}
        <div className="space-y-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="backdrop-blur-xl bg-white/10 border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--neon-turquoise)]/20 rounded-full">
                      <Car className="w-8 h-8 text-[var(--neon-purple)]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">{vehicle.plate}</CardTitle>
                      <CardDescription className="text-white/70 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {vehicle.route}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {vehicle.insurance}
                    </Badge>
                    <Button
                      variant="ghost"
                      onClick={() => setExpandedVehicle(expandedVehicle === vehicle.id ? null : vehicle.id)}
                      className="text-white hover:bg-white/10"
                    >
                      {expandedVehicle === vehicle.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-[var(--neon-turquoise)]/20 to-[var(--electric-blue)]/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Savings</p>
                        <p className="text-xl font-bold text-[var(--neon-turquoise)]">
                          KES {vehicle.savings.toLocaleString()}
                        </p>
                      </div>
                      <PiggyBank className="w-6 h-6 text-[var(--neon-turquoise)]" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[var(--neon-orange)]/20 to-[var(--neon-yellow)]/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Outstanding Loan</p>
                        <p className="text-xl font-bold text-[var(--neon-orange)]">
                          KES {vehicle.loan.toLocaleString()}
                        </p>
                      </div>
                      <CreditCard className="w-6 h-6 text-[var(--neon-orange)]" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/20 to-[var(--lime-green)]/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Insurance</p>
                        <p className="text-xl font-bold text-green-400">
                          {vehicle.insurance}
                        </p>
                      </div>
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--hot-pink)]/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Driver</p>
                        <p className="text-lg font-bold text-white">
                          {vehicle.driver}
                        </p>
                      </div>
                      <User className="w-6 h-6 text-[var(--neon-purple)]" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedVehicleForPayment(vehicle.id)}
                        className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Daily Remittance
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle>Daily Remittance - {vehicle.plate}</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Submit your daily earnings for this vehicle
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Payment Amount (KES)</Label>
                          <Input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="12000"
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedVehicleForPayment(null)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleRemittance(vehicle.id)}
                            className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900"
                          >
                            Submit Payment
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedVehicleForDriver(vehicle.id)}
                        variant="outline"
                        className="border-[var(--neon-purple)]/30 text-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/10"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Driver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle>Assign Driver - {vehicle.plate}</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Select a driver for this vehicle
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select Driver</Label>
                          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                            <SelectTrigger className="bg-white/10 border-white/30 text-white">
                              <SelectValue placeholder="Choose a driver" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/30 text-white">
                              {availableDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  <div>
                                    <p>{driver.name}</p>
                                    <p className="text-sm text-white/60">{driver.phone} - {driver.experience}</p>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedVehicleForDriver(null)}
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDriverAssignment}
                            className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white"
                          >
                            Assign Driver
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="border-[var(--neon-yellow)]/30 text-[var(--neon-yellow)] hover:bg-[var(--neon-yellow)]/10"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Payment History
                  </Button>
                </div>

                {/* Expanded Details */}
                {expandedVehicle === vehicle.id && (
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Vehicle Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white/70">Model:</span>
                            <span className="text-white">{vehicle.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Year:</span>
                            <span className="text-white">{vehicle.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Route:</span>
                            <span className="text-white">{vehicle.route}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Current Driver:</span>
                            <span className="text-white">{vehicle.driver}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Financial Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white/70">Total Savings:</span>
                            <span className="text-[var(--neon-turquoise)]">KES {vehicle.savings.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Outstanding Loan:</span>
                            <span className="text-[var(--neon-orange)]">KES {vehicle.loan.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Last Payment:</span>
                            <span className="text-white">{vehicle.lastPayment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Amount Paid:</span>
                            <span className="text-[var(--neon-yellow)]">KES {vehicle.paymentAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </VehicleOwnerLayout>
  );
}