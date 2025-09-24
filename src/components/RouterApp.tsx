import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RouteProtectionService, User } from '../services/routeProtection';
import { ProtectedRoute } from './ProtectedRoute';

// Import all your components
import { Navigation } from './Navigation';
import { LandingPage } from './LandingPage';
import { AboutPage } from './AboutPage';
import { HowToJoinPage } from './HowToJoinPage';
import { FAQPage } from './FAQPage';
import { ContactPage } from './ContactPage';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { VehicleOwnerDataProvider } from '../context/VehicleOwnerDataContext';

// Vehicle Owner Pages
import { ShareholderCapitalPayment } from './vehicleowner/ShareholderCapitalPayment';
import { HomeDashboard } from './vehicleowner/HomeDashboard';
import { VehicleDashboard } from './vehicleowner/VehicleDashboard';
import { LoanApplication } from './vehicleowner/LoanApplication';
import { FinancialStatus } from './vehicleowner/FinancialStatus';
import { VehicleRegistration } from './vehicleowner/VehicleRegistration';
import { ProfilePage } from './vehicleowner/ProfilePage';
import { ExitSacco } from './vehicleowner/ExitSacco';

// Admin Pages
import { AdminDashboard } from './admin/AdminDashboard';
import { UsersManagement } from './admin/UsersManagement';
import { ApproveUsers } from './admin/ApproveUsers';
import { UserRoles } from './admin/UserRoles';
import { CreateUser } from './admin/CreateUser';
import { UserProfiles } from './admin/UserProfiles';
import { FleetManagement } from './admin/FleetManagement';
import { FinancialOverview } from './admin/FinancialOverview';
import { LoanApplications } from './admin/LoanApplications';
import { RouteManagement } from './admin/RouteManagement';
import { UserReports } from './admin/UserReports';

// Staff Pages
import { StaffDashboard } from './staff/StaffDashboard';
import { UpdateDetails } from './staff/UpdateDetails';
import { SalaryManagement } from './staff/SalaryManagement';
import { LoanManagement } from './staff/LoanManagement';
import { ExpenseTracking } from './staff/ExpenseTracking';
import { MatatuManagement } from './staff/MatatuManagement';
import { Reports } from './staff/Reports';

// Main router component that handles authentication and routing
function RouterApp() {
  const [user, setUser] = useState<User | null>(null);
  
  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('matisUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('matisUser');
      }
    }
  }, []);

  // Save user to localStorage when user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('matisUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('matisUser');
    }
  }, [user]);

  const handleLogin = (userData: { id?: string; name: string; role: string; phone: string; hasCompletedCapitalPayment?: boolean }) => {
    const newUser: User = { 
      ...userData, 
      role: userData.role as User['role'],
      hasCompletedCapitalPayment: userData.hasCompletedCapitalPayment ?? false 
    };
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleCapitalPaymentComplete = () => {
    if (user) {
      setUser({ ...user, hasCompletedCapitalPayment: true });
    }
  };

  return (
    <BrowserRouter>
      <VehicleOwnerDataProvider userId={user?.id ?? null}>
        <AppRoutes 
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout}
          onCapitalPaymentComplete={handleCapitalPaymentComplete}
        />
      </VehicleOwnerDataProvider>
    </BrowserRouter>
  );
}

// Component that handles routing logic
function AppRoutes({ 
  user, 
  onLogin, 
  onLogout, 
  onCapitalPaymentComplete 
}: {
  user: User | null;
  onLogin: (userData: { id?: string; name: string; role: string; phone: string; hasCompletedCapitalPayment?: boolean }) => void;
  onLogout: () => void;
  onCapitalPaymentComplete: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (page: string) => {
    navigate(`/${page === 'home' ? '' : page}`);
  };

  // Check if navigation should be hidden
  const hideNavigation = [
    '/login', '/register', '/forgot-password'
  ].includes(location.pathname) || 
  location.pathname.startsWith('/users/') || 
  location.pathname.startsWith('/admin/') || 
  location.pathname.startsWith('/staff/');

  return (
    <div className="min-h-screen bg-background">
      {!hideNavigation && (
        <Navigation currentPage={location.pathname.slice(1) || 'home'} onNavigate={handleNavigate} />
      )}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage onNavigate={handleNavigate} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/join" element={<HowToJoinPage onNavigate={handleNavigate} />} />
          <Route path="/faq" element={<FAQPage onNavigate={handleNavigate} />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage onNavigate={handleNavigate} onLogin={onLogin} />} />
          <Route path="/register" element={<RegisterPage onNavigate={handleNavigate} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />

          {/* Vehicle Owner Routes */}
          <Route 
            path="/users/welcome" 
            element={
              <ProtectedRoute user={user} routePath="users/welcome" onNavigate={handleNavigate}>
                <ShareholderCapitalPayment 
                  user={user} 
                  onNavigate={handleNavigate} 
                  onComplete={onCapitalPaymentComplete}
                  onLogout={onLogout}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/home" 
            element={
              <ProtectedRoute user={user} routePath="users/home" onNavigate={handleNavigate}>
                <HomeDashboard user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/vehicles" 
            element={
              <ProtectedRoute user={user} routePath="users/vehicles" onNavigate={handleNavigate}>
                <VehicleDashboard user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/apply-loan" 
            element={
              <ProtectedRoute user={user} routePath="users/apply-loan" onNavigate={handleNavigate}>
                <LoanApplication user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/financial-status" 
            element={
              <ProtectedRoute user={user} routePath="users/financial-status" onNavigate={handleNavigate}>
                <FinancialStatus user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/addVehicle" 
            element={
              <ProtectedRoute user={user} routePath="users/addVehicle" onNavigate={handleNavigate}>
                <VehicleRegistration user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/profile" 
            element={
              <ProtectedRoute user={user} routePath="users/profile" onNavigate={handleNavigate}>
                <ProfilePage user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/exit" 
            element={
              <ProtectedRoute user={user} routePath="users/exit" onNavigate={handleNavigate}>
                <ExitSacco user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute user={user} routePath="admin/dashboard" onNavigate={handleNavigate}>
                <AdminDashboard user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute user={user} routePath="admin/users" onNavigate={handleNavigate}>
                <UsersManagement user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/approve" 
            element={
              <ProtectedRoute user={user} routePath="admin/users/approve" onNavigate={handleNavigate}>
                <ApproveUsers user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/roles" 
            element={
              <ProtectedRoute user={user} routePath="admin/users/roles" onNavigate={handleNavigate}>
                <UserRoles user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/create" 
            element={
              <ProtectedRoute user={user} routePath="admin/users/create" onNavigate={handleNavigate}>
                <CreateUser user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/profiles" 
            element={
              <ProtectedRoute user={user} routePath="admin/users/profiles" onNavigate={handleNavigate}>
                <UserProfiles user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/fleet" 
            element={
              <ProtectedRoute user={user} routePath="admin/fleet" onNavigate={handleNavigate}>
                <FleetManagement user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/financials" 
            element={
              <ProtectedRoute user={user} routePath="admin/financials" onNavigate={handleNavigate}>
                <FinancialOverview user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/loans" 
            element={
              <ProtectedRoute user={user} routePath="admin/loans" onNavigate={handleNavigate}>
                <LoanApplications user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/fleet/routes" 
            element={
              <ProtectedRoute user={user} routePath="admin/fleet/routes" onNavigate={handleNavigate}>
                <RouteManagement user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports/users" 
            element={
              <ProtectedRoute user={user} routePath="admin/reports/users" onNavigate={handleNavigate}>
                <UserReports user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Staff Routes */}
          <Route 
            path="/staff/dashboard" 
            element={
              <ProtectedRoute user={user} routePath="staff/dashboard" onNavigate={handleNavigate}>
                <StaffDashboard user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/update" 
            element={
              <ProtectedRoute user={user} routePath="staff/update" onNavigate={handleNavigate}>
                <UpdateDetails user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/salary" 
            element={
              <ProtectedRoute user={user} routePath="staff/salary" onNavigate={handleNavigate}>
                <SalaryManagement user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/loanmanagement" 
            element={
              <ProtectedRoute user={user} routePath="staff/loanmanagement" onNavigate={handleNavigate}>
                <LoanManagement user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/expensetracking" 
            element={
              <ProtectedRoute user={user} routePath="staff/expensetracking" onNavigate={handleNavigate}>
                <ExpenseTracking user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/matatumanagement" 
            element={
              <ProtectedRoute user={user} routePath="staff/matatumanagement" onNavigate={handleNavigate}>
                <MatatuManagement user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff/reports" 
            element={
              <ProtectedRoute user={user} routePath="staff/reports" onNavigate={handleNavigate}>
                <Reports user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Role-based redirects */}
          <Route 
            path="/dashboard" 
            element={<DashboardRedirect user={user} />} 
          />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Component to redirect to appropriate dashboard based on user role
function DashboardRedirect({ user }: { user: User | null }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const defaultRoute = RouteProtectionService.getDefaultRouteForRole(user.role);
  const routePath = defaultRoute === 'home' ? '/' : `/${defaultRoute}`;
  
  return <Navigate to={routePath} replace />;
}

export default RouterApp;
