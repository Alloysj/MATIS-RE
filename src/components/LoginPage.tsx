import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, ArrowLeft, User, Lock } from 'lucide-react';
import { login, getUserDetails } from '../services/auth';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin?: (userData: { name: string; role: string; phone: string }) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      const user = await getUserDetails();
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      onLogin?.({
        name: fullName || user.email,
        role: user?.role?.name || 'Vehicle Owner',
        phone: user.phone || '',
        hasCompletedCapitalPayment: !!user.hasCompletedCapitalPayment
      });
      // Route to dashboard; Router decides based on role/permissions
      onNavigate('dashboard');
    } catch (e: any) {
      setError('Invalid email or password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--neon-yellow)] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-96 h-96 bg-[var(--neon-purple)] opacity-10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-[var(--neon-turquoise)] opacity-10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-6 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Login Card */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-slate-900" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Welcome Back to MATIS
              </CardTitle>
              <CardDescription className="text-white/70">
                Sign in to access your SACCO dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[var(--neon-turquoise)] focus:ring-[var(--neon-turquoise)]/20 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert className="bg-red-500/10 border-red-500/30 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900 hover:from-[var(--neon-orange)] hover:to-[var(--neon-yellow)] transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,232,56,0.3)]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4">
                <button
                  onClick={() => onNavigate('forgot-password')}
                  className="text-[var(--neon-turquoise)] hover:text-[var(--neon-yellow)] transition-colors"
                >
                  Forgot your password?
                </button>
                
                <div className="text-white/70">
                  Don't have an account?{' '}
                  <button
                    onClick={() => onNavigate('register')}
                    className="text-[var(--neon-turquoise)] hover:text-[var(--neon-yellow)] transition-colors"
                  >
                    Sign up here
                  </button>
                </div>
              </div>

              {/* Note: Use your email + password to log in. */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
