import { ReactNode } from 'react';
import { RouteProtectionService, User } from '../services/routeProtection';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Shield, AlertTriangle, Lock, Home } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  user: User | null;
  routePath: string;
  onNavigate: (page: string) => void;
  fallbackComponent?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  user, 
  routePath, 
  onNavigate, 
  fallbackComponent 
}: ProtectedRouteProps) {
  const authResult = RouteProtectionService.isAuthorized(user, routePath);

  // If authorized, render the children
  if (authResult.authorized) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Default unauthorized access component
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-6 w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            {!user ? (
              <Lock className="w-10 h-10 text-red-400" />
            ) : (
              <Shield className="w-10 h-10 text-red-400" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">
            {!user ? 'Authentication Required' : 'Access Denied'}
          </h2>
          
          <p className="text-white/70 mb-6">
            {authResult.reason || 'You do not have permission to access this page.'}
          </p>

          <Alert className="bg-red-500/10 border-red-500/30 text-red-200 mb-6">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              {!user 
                ? 'Please log in to access this page.'
                : user.role === 'Vehicle Owner' && !user.hasCompletedCapitalPayment
                  ? 'Complete your capital payment to access this feature.'
                  : 'Contact your administrator if you believe you should have access to this page.'
              }
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {!user ? (
              <Button
                onClick={() => onNavigate('login')}
                className="w-full bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900 hover:opacity-90"
              >
                Go to Login
              </Button>
            ) : user.role === 'Vehicle Owner' && !user.hasCompletedCapitalPayment ? (
              <Button
                onClick={() => onNavigate('users/welcome')}
                className="w-full bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900 hover:opacity-90"
              >
                Complete Capital Payment
              </Button>
            ) : (
              <Button
                onClick={() => onNavigate(authResult.redirectTo || RouteProtectionService.getDefaultRouteForRole(user.role))}
                className="w-full bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--electric-blue)] text-slate-900 hover:opacity-90"
              >
                Go to Dashboard
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => onNavigate('home')}
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          {user && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-xs text-white/50">
                Logged in as: <span className="text-white/70">{user.name}</span><br />
                Role: <span className="text-white/70">{user.role}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Higher-order component for route protection
export function withRouteProtection<T extends object>(
  Component: React.ComponentType<T>,
  routePath: string
) {
  return function ProtectedComponent(props: T & { 
    user: User | null; 
    onNavigate: (page: string) => void 
  }) {
    const { user, onNavigate, ...componentProps } = props;
    
    return (
      <ProtectedRoute user={user} routePath={routePath} onNavigate={onNavigate}>
        <Component {...(componentProps as T)} />
      </ProtectedRoute>
    );
  };
}