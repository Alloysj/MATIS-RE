import { useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

interface ShareholderCapitalPaymentProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onComplete: () => void;
  onLogout: () => void;
}

export function ShareholderCapitalPayment({ user, onNavigate, onComplete, onLogout }: ShareholderCapitalPaymentProps) {
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onComplete();
  };

  return (
    <VehicleOwnerLayout
      currentPage="users/welcome"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-full mb-4">
            <CreditCard className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to MATIS SACCO, {user?.name}!
          </h1>
          <p className="text-white/70 text-lg">
            Complete your shareholder capital payment to unlock your dashboard
          </p>
        </div>

        {/* Payment Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-white mb-2">
                Shareholder Capital Payment
              </CardTitle>
              <CardDescription className="text-white/70">
                One-time payment required for SACCO membership
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Payment Amount */}
              <div className="bg-gradient-to-r from-[var(--neon-turquoise)]/20 to-[var(--neon-purple)]/20 p-6 rounded-lg border border-white/20">
                <div className="text-center">
                  <p className="text-white/80 mb-2">Payment Amount</p>
                  <p className="text-4xl font-bold text-[var(--neon-yellow)]">
                    KES 15,000
                  </p>
                  <p className="text-white/60 mt-2">
                    This amount will be credited to your savings account
                  </p>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label className="text-white/90">M-PESA Phone Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712345678"
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                </div>
                <p className="text-xs text-white/60">
                  Make sure this is the number linked to your M-PESA account
                </p>
              </div>

              {/* Payment Instructions */}
              <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-200">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  You will receive an M-PESA prompt on your phone to complete the payment. 
                  Please ensure you have sufficient funds in your M-PESA account.
                </AlertDescription>
              </Alert>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing || !phoneNumber}
                className="w-full bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900 hover:from-[var(--electric-blue)] hover:to-[var(--neon-turquoise)] transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(20,241,149,0.3)] py-3"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay KES 15,000 via M-PESA
                  </>
                )}
              </Button>

              {/* What Happens Next */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-white font-semibold mb-2">What happens next?</h3>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• You'll receive an M-PESA prompt on {phoneNumber}</li>
                  <li>• Enter your M-PESA PIN to complete payment</li>
                  <li>• Your account will be activated immediately</li>
                  <li>• Access your dashboard and start managing your matatu business</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={handleSuccessClose}>
          <DialogContent className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <DialogTitle className="text-2xl text-white">Payment Successful!</DialogTitle>
              <DialogDescription className="text-white/70">
                Your shareholder capital payment of KES 15,000 has been processed successfully. 
                Welcome to MATIS SACCO!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-300 text-sm">
                  ✓ Payment confirmed<br/>
                  ✓ Account activated<br/>
                  ✓ Ready to access dashboard
                </p>
              </div>
              <Button
                onClick={handleSuccessClose}
                className="w-full bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900"
              >
                Continue to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VehicleOwnerLayout>
  );
}