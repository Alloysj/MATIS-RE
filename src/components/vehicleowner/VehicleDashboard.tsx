import { useEffect, useRef, useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Car, CreditCard, PiggyBank, Shield, User, ChevronDown, ChevronUp, MapPin, Calendar, DollarSign, Plus } from 'lucide-react';
import { assignDriver } from '../../services/matatus';
import { processPayment, checkPaymentStatus } from '../../services/finance';
import { useVehicleOwnerData } from '../../context/VehicleOwnerDataContext';

interface VehicleDashboardProps {
  user: { id?: string; name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function VehicleDashboard({ user, onNavigate, onLogout }: VehicleDashboardProps) {
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [selectedVehicleForPayment, setSelectedVehicleForPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedVehicleForDriver, setSelectedVehicleForDriver] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const { matatu, loadMatatu, refreshMatatu, refreshFinance } = useVehicleOwnerData();

  const vehicles = matatu.data?.dashboardCards ?? [];
  const drivers = matatu.data?.availableDrivers ?? [];
  const loading = matatu.status === 'loading' && !matatu.data;
  const isRefreshingMatatu = matatu.status === 'loading' && Boolean(matatu.data);
  const error = matatu.error;


  const [paymentPhone, setPaymentPhone] = useState(user?.phone ?? '');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const paymentPollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAYMENT_STATUS_MAX_ATTEMPTS = 12;
  const PAYMENT_STATUS_INTERVAL_MS = 5000;

  useEffect(() => {
    void loadMatatu();
  }, [loadMatatu]);

  useEffect(() => {
    if (selectedVehicleForPayment && user?.phone) {
      setPaymentPhone((prev) => prev || user.phone);
    }
    if (!selectedVehicleForPayment) {
      clearPaymentPolling();
      setIsProcessingPayment(false);
      setCheckoutRequestId(null);
      setPaymentFeedback(null);
    }
  }, [selectedVehicleForPayment, user?.phone]);

  useEffect(() => () => {
    clearPaymentPolling();
  }, []);

  const clearPaymentPolling = () => {
    if (paymentPollTimeout.current) {
      clearTimeout(paymentPollTimeout.current);
      paymentPollTimeout.current = null;
    }
  };

  const pollPaymentStatus = async (checkoutId: string, attempt = 0): Promise<void> => {
    try {
      const status = await checkPaymentStatus(checkoutId);
      if (status.status === 'pending' && attempt < PAYMENT_STATUS_MAX_ATTEMPTS) {
        setPaymentFeedback({
          type: 'info',
          message: status.message ?? 'Waiting for MPESA confirmation...'
        });
        paymentPollTimeout.current = setTimeout(() => {
          void pollPaymentStatus(checkoutId, attempt + 1);
        }, PAYMENT_STATUS_INTERVAL_MS);
        return;
      }

      if (status.status === 'completed') {
        const message = status.mpesaReceiptNumber
          ? 'Payment complete. Receipt: ' + status.mpesaReceiptNumber
          : 'Payment complete.';
        setPaymentFeedback({ type: 'success', message });
        setPaymentAmount('');
        setSelectedVehicleForPayment(null);
        try {
          await Promise.allSettled([refreshFinance(), refreshMatatu()]);
        } catch (refreshError) {
          // eslint-disable-next-line no-console
          console.error('Failed to refresh data after payment', refreshError);
        }
      } else if (status.status === 'canceled') {
        setPaymentFeedback({
          type: 'error',
          message: status.message ?? 'Payment was canceled.'
        });
      } else if (status.status === 'failed') {
        setPaymentFeedback({
          type: 'error',
          message: status.message ?? 'Payment failed. Please try again.'
        });
      } else {
        setPaymentFeedback({
          type: 'info',
          message: status.message ?? 'Payment status: ' + status.status
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setPaymentFeedback({ type: 'error', message: 'Unable to confirm payment status. Please try again.' });
    } finally {
      clearPaymentPolling();
      setIsProcessingPayment(false);
      setCheckoutRequestId(null);
    }
  };

  const openPaymentDialog = (vehicleId: string) => {
    setSelectedVehicleForPayment(vehicleId);
    setPaymentFeedback(null);
    setCheckoutRequestId(null);
    if (user?.phone) {
      setPaymentPhone(user.phone);
    }
  };

  const handleRemittance = async (vehicleId: string) => {
    if (isProcessingPayment) return;

    const sanitizedAmount = paymentAmount.replace(/,/g, '').trim();
    const amountValue = Number.parseFloat(sanitizedAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setPaymentFeedback({ type: 'error', message: 'Enter a valid payment amount.' });
      return;
    }

    const phone = paymentPhone.trim();
    if (!phone) {
      setPaymentFeedback({ type: 'error', message: 'Enter a phone number to receive the STK prompt.' });
      return;
    }

    setIsProcessingPayment(true);
    setPaymentFeedback({ type: 'info', message: 'Sending STK push. Check your phone to complete the payment.' });

    try {
      const response = await processPayment({ phone, amount: amountValue, vehicleId });
      setCheckoutRequestId(response.checkoutRequestId);
      setPaymentFeedback({ type: 'info', message: response.message ?? 'STK push sent. Awaiting confirmation...' });
      void pollPaymentStatus(response.checkoutRequestId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unable to initiate payment.';
      setPaymentFeedback({ type: 'error', message });
      setIsProcessingPayment(false);
    }
  };

  const closePaymentDialog = () => {
    clearPaymentPolling();
    setIsProcessingPayment(false);
    setCheckoutRequestId(null);
    setPaymentFeedback(null);
    setSelectedVehicleForPayment(null);
    setPaymentAmount('');
  };

  const handleDriverAssignment = async () => {
    if (!selectedDriver || !selectedVehicleForDriver) return;
    try {
      await assignDriver(selectedVehicleForDriver, selectedDriver);
      await refreshMatatu();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSelectedVehicleForDriver(null);
      setSelectedDriver('');
    }
  };

  return (
    <VehicleOwnerLayout currentPage="users/vehicles" user={user} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Vehicles</h1>
            <p className="text-white/70">Manage your matatu fleet and track performance</p>
          </div>
          <Button onClick={() => onNavigate('users/addVehicle')} className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900 hover:from-[var(--neon-orange)] hover:to-[var(--neon-yellow)]">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          {isRefreshingMatatu && !loading && (
            <div className="text-white/60 text-sm">Refreshing vehicle data�</div>
          )}
          {loading && <div className="text-white/70">Loading...</div>}
          {!loading && vehicles.length === 0 && !error && (
            <div className="text-white/60">No vehicles available yet. Add one to get started.</div>
          )}
          {!loading && vehicles.map((vehicle) => (
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
                    <Badge className="bg-[var(--neon-turquoise)]/20 text-[var(--neon-turquoise)]">{vehicle.insurance}</Badge>
                    <Button
                      variant="outline"
                      onClick={() => setExpandedVehicle(expandedVehicle === vehicle.id ? null : vehicle.id)}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      {expandedVehicle === vehicle.id ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          View Details
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-white/70">Total Savings</CardDescription>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl text-[var(--neon-turquoise)]">KES {vehicle.savings.toLocaleString()}</CardTitle>
                        <PiggyBank className="w-5 h-5 text-[var(--neon-turquoise)]" />
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-white/70">Outstanding Loan</CardDescription>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl text-[var(--neon-orange)]">KES {vehicle.loan.toLocaleString()}</CardTitle>
                        <CreditCard className="w-5 h-5 text-[var(--neon-orange)]" />
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-white/70">Insurance</CardDescription>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl text-[var(--neon-yellow)]">{vehicle.insurance}</CardTitle>
                        <Shield className="w-5 h-5 text-[var(--neon-yellow)]" />
                      </div>
                    </CardHeader>
                  </Card>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Dialog open={selectedVehicleForPayment === vehicle.id} onOpenChange={(open) => { if (!open) closePaymentDialog(); }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => openPaymentDialog(vehicle.id)}
                        className="border-[var(--neon-purple)]/30 text-[var(--neon-purple)] hover:bg-[var(--neon-purple)]/10"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Remit Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle>Remit Payment</DialogTitle>
                        <DialogDescription>Enter the payment details for vehicle {vehicle.plate}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Phone Number</Label>
                          <Input
                            type="tel"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            placeholder="e.g. 07XXXXXXXX"
                            className="bg-white/10 border-white/30 text-white"
                          />
                        </div>
                        <div>
                          <Label>Amount (KES)</Label>
                          <Input
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="e.g. 10,000"
                            className="bg-white/10 border-white/30 text-white"
                            inputMode="decimal"
                          />
                        </div>
                        {paymentFeedback && (
                          <p className={`text-sm ${paymentFeedback.type === 'error' ? 'text-red-400' : paymentFeedback.type === 'success' ? 'text-green-400' : 'text-white/70'}`}>
                            {paymentFeedback.message}
                          </p>
                        )}
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={closePaymentDialog} className="border-white/30 text-white hover:bg-white/10">Cancel</Button>
                          <Button
                            onClick={() => handleRemittance(vehicle.id)}
                            disabled={isProcessingPayment || !paymentAmount.trim() || !paymentPhone.trim()}
                            className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isProcessingPayment ? 'Processing...' : 'Submit Payment'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={selectedVehicleForDriver === vehicle.id} onOpenChange={(open) => !open && setSelectedVehicleForDriver(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedVehicleForDriver(vehicle.id)}
                        className="border-[var(--hot-pink)]/30 text-[var(--hot-pink)] hover:bg-[var(--hot-pink)]/10"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Assign Driver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle>Assign Driver</DialogTitle>
                        <DialogDescription>Select a driver for this vehicle</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select Driver</Label>
                          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                            <SelectTrigger className="bg-white/10 border-white/30 text-white">
                              <SelectValue placeholder="Choose a driver" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/30 text-white">
                              {drivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  <div>
                                    <p>{driver.name}</p>
                                    <p className="text-sm text-white/60">{driver.phone}</p>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setSelectedVehicleForDriver(null)} className="border-white/30 text-white hover:bg-white/10">Cancel</Button>
                          <Button onClick={handleDriverAssignment} className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--hot-pink)] text-white">Assign Driver</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={() => onNavigate('users/profile')}
                    className="border-[var(--neon-yellow)]/30 text-[var(--neon-yellow)] hover:bg-[var(--neon-yellow)]/10"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>

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
                            <span className="text-white">{vehicle.year ?? '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Route:</span>
                            <span className="text-white">{vehicle.route}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Current Driver:</span>
                            <span className="text-white">{vehicle.driver || '—'}</span>
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
                            <span className="text-white">{vehicle.lastPayment ? new Date(vehicle.lastPayment).toISOString().slice(0,10) : '—'}</span>
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

