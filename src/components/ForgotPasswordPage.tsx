import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle2,
  Smartphone,
  Clock,
  Shield,
  Bus,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate password reset request
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const resetSteps = [
    {
      step: 1,
      title: "Enter your email",
      description: "We'll send a reset link to your registered email address"
    },
    {
      step: 2,
      title: "Check your email",
      description: "Click the reset link in the email we sent to you"
    },
    {
      step: 3,
      title: "Create new password",
      description: "Set a new secure password for your account"
    },
    {
      step: 4,
      title: "Sign in",
      description: "Use your new password to access your account"
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="fixed inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="p-12 bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-20 h-20 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Reset Link Sent!
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your email and click the link to reset your password.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-[var(--neon-turquoise)] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold mb-2">What's next?</div>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the "Reset Password" link in the email</li>
                      <li>Create a new secure password</li>
                      <li>Sign in with your new password</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => onNavigate('login')}
                  className="w-full bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  Back to Sign In
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Reset Link
                </Button>
              </div>

              <div className="mt-8 p-4 bg-[var(--neon-yellow)]/10 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-[var(--neon-orange)] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold mb-1">Didn't receive the email?</div>
                    <div>
                      The reset link may take a few minutes to arrive. If you don't see it after 10 minutes, 
                      check your spam folder or try resending the link.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"></div>
      </div>
      
      {/* Floating Elements */}
      <motion.div
        className="fixed top-20 left-20 w-20 h-20 rounded-full bg-gradient-to-br from-[var(--neon-turquoise)] to-transparent opacity-60 blur-xl"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="fixed bottom-40 right-32 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--neon-purple)] to-transparent opacity-40 blur-xl"
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Process Explanation */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Logo */}
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--neon-yellow)] via-[var(--neon-orange)] to-[var(--neon-purple)] p-0.5">
                  <div className="w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                    <Bus className="w-8 h-8 text-[var(--neon-turquoise)]" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--neon-turquoise)] rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">MATIS</h1>
                <p className="text-[var(--neon-turquoise)] text-sm">Transport Solutions</p>
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Forgot Your
              <br />
              <span className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-turquoise)] bg-clip-text text-transparent">
                Password?
              </span>
            </h2>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              No worries! We'll help you reset it quickly and securely. 
              Follow these simple steps to regain access to your account.
            </p>

            {/* Reset Steps */}
            <div className="space-y-4 mb-8">
              {resetSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{step.step}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{step.title}</div>
                    <div className="text-sm text-gray-400">{step.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Security Notice */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 hidden lg:block">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-[var(--neon-turquoise)] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <div className="font-semibold mb-1">Security First</div>
                  <div>
                    Reset links expire after 1 hour for your security. If you didn't request this, 
                    your account remains safe and no action is needed.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Reset Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="p-8 bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-gray-900" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h3>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your registered email"
                      className="pl-12 h-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending Reset Link...
                    </div>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('login')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>

              {/* Contact Support */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-[var(--neon-turquoise)] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold mb-1">Need Help?</div>
                    <div>
                      If you're unable to reset your password, contact our support team at{' '}
                      <span className="text-[var(--neon-turquoise)] font-medium">+254 700 000 000</span>{' '}
                      or email us at{' '}
                      <span className="text-[var(--neon-turquoise)] font-medium">support@matis.co.ke</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Reset links are secure and expire after 1 hour</span>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}