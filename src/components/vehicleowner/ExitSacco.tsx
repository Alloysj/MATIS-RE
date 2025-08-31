import { useState } from 'react';
import { VehicleOwnerLayout } from './VehicleOwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  LogOut,
  AlertTriangle,
  FileText,
  Download,
  User,
  Mail,
  MessageSquare,
  CheckCircle,
  X
} from 'lucide-react';

interface ExitSaccoProps {
  user: { name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ExitSacco({ user, onNavigate, onLogout }: ExitSaccoProps) {
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: '',
    reason: '',
    additionalComments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock financial data
  const financialSummary = {
    totalSavings: 83000,
    outstandingLoans: 40000,
    pendingPayments: 0,
    insuranceClaims: 0,
    netAmount: 43000 // totalSavings - outstandingLoans
  };

  const exitReasons = [
    'Selling vehicle(s)',
    'Moving to different route/location',
    'Joining another SACCO',
    'Financial difficulties',
    'Unsatisfied with services',
    'Personal reasons',
    'Other'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Please select a reason for leaving';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check for outstanding obligations
    if (financialSummary.outstandingLoans > 0 || financialSummary.pendingPayments > 0) {
      alert('You have outstanding obligations that must be cleared before exiting the SACCO.');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmExit = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Exit SACCO request:', formData);
    
    setIsSubmitting(false);
    setShowSuccessDialog(true);
  };

  const handleDownloadForm = () => {
    // In a real app, this would generate and download a PDF withdrawal form
    console.log('Downloading withdrawal form...');
    alert('PDF withdrawal form would be downloaded here');
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    // In a real app, this might log the user out or redirect to a farewell page
    onNavigate('home');
  };

  return (
    <VehicleOwnerLayout
      currentPage="users/exit"
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full mb-4 border border-red-500/30">
            <LogOut className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Exit MATIS SACCO</h1>
          <p className="text-white/70">
            We're sorry to see you go. Please complete the form below to process your withdrawal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Summary */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[var(--neon-yellow)]" />
                Financial Summary
              </CardTitle>
              <CardDescription className="text-white/70">
                Review your account status before exiting
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--electric-blue)]/10 rounded-lg border border-[var(--neon-turquoise)]/30">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Total Savings</span>
                  <span className="text-[var(--neon-turquoise)] font-bold text-lg">
                    KES {financialSummary.totalSavings.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-[var(--neon-orange)]/10 to-[var(--neon-yellow)]/10 rounded-lg border border-[var(--neon-orange)]/30">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Outstanding Loans</span>
                  <span className="text-[var(--neon-orange)] font-bold text-lg">
                    KES {financialSummary.outstandingLoans.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Pending Payments</span>
                  <span className="text-red-400 font-bold text-lg">
                    KES {financialSummary.pendingPayments.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-500/10 to-[var(--lime-green)]/10 rounded-lg border border-green-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Net Refund Amount</span>
                  <span className="text-green-400 font-bold text-xl">
                    KES {financialSummary.netAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {financialSummary.outstandingLoans > 0 && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-200">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    You have outstanding loans that must be cleared before you can exit the SACCO.
                  </AlertDescription>
                </Alert>
              )}

              {financialSummary.pendingPayments > 0 && (
                <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-200">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    You have pending payments that need to be resolved.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleDownloadForm}
                  variant="outline"
                  className="w-full border-[var(--neon-turquoise)]/30 text-[var(--neon-turquoise)] hover:bg-[var(--neon-turquoise)]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Withdrawal Form
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Exit Form */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Exit Request Form</CardTitle>
              <CardDescription className="text-white/70">
                Please provide the required information to process your withdrawal
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label className="text-white/90 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Full Name *
                  </Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.fullName && (
                    <p className="text-red-400 text-sm">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-white/90 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    Email Address *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Reason for Leaving */}
                <div className="space-y-2">
                  <Label className="text-white/90">Reason for Leaving *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {exitReasons.map((reason) => (
                      <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          checked={formData.reason === reason}
                          onChange={(e) => handleInputChange('reason', e.target.value)}
                          className="text-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]"
                        />
                        <span className="text-white/80 text-sm">{reason}</span>
                      </label>
                    ))}
                  </div>
                  {errors.reason && (
                    <p className="text-red-400 text-sm">{errors.reason}</p>
                  )}
                </div>

                {/* Additional Comments */}
                <div className="space-y-2">
                  <Label className="text-white/90 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Additional Comments (Optional)
                  </Label>
                  <Textarea
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                    placeholder="Please share any feedback or additional reasons..."
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20 min-h-24"
                  />
                </div>

                {/* Important Notice */}
                <Alert className="bg-blue-500/10 border-blue-500/30 text-blue-200">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Exiting the SACCO is permanent. You will lose all membership benefits and will need to re-register if you wish to rejoin in the future.
                  </AlertDescription>
                </Alert>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onNavigate('users/home')}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || financialSummary.outstandingLoans > 0 || financialSummary.pendingPayments > 0}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Submit Exit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-400 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Confirm Exit Request
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Are you absolutely sure you want to exit MATIS SACCO? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <h4 className="text-red-300 font-semibold mb-2">You will lose:</h4>
                <ul className="text-red-200 text-sm space-y-1">
                  <li>• Access to SACCO loans and financial services</li>
                  <li>• Insurance coverage for your vehicles</li>
                  <li>• Membership benefits and privileges</li>
                  <li>• Support from the SACCO community</li>
                </ul>
              </div>
              
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <h4 className="text-green-300 font-semibold mb-2">You will receive:</h4>
                <p className="text-green-200 text-sm">
                  A refund of KES {financialSummary.netAmount.toLocaleString()} will be processed within 30 business days.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmExit}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Confirm Exit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <DialogTitle className="text-2xl text-white">Exit Request Submitted</DialogTitle>
              <DialogDescription className="text-white/70">
                Your exit request has been successfully submitted and is being processed.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
                <h4 className="text-blue-300 font-semibold mb-2">What happens next:</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Your request will be reviewed within 3-5 business days</li>
                  <li>• You'll receive an email confirmation at {formData.email}</li>
                  <li>• Refund processing will begin after approval</li>
                  <li>• Final settlement will be completed within 30 days</li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-white/70 text-sm mb-4">
                  Thank you for being part of MATIS SACCO. We wish you all the best in your future endeavors.
                </p>
                <Button
                  onClick={handleSuccessClose}
                  className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900"
                >
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VehicleOwnerLayout>
  );
}