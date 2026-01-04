import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { RouteProtectionService, User } from '../services/routeProtection';
import { subscribeToUnauthorized, clearAuthToken } from '../services/api';
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
import { ViewVehicle } from './admin/ViewVehicle';
import { FinancialOverview } from './admin/FinancialOverview';
import { LoanApplications } from './admin/LoanApplications';
import { RouteManagement } from './admin/RouteManagement';
import { UserReports } from './admin/UserReports';
import { FinancialReports } from './admin/FinancialReports';
import { FleetReports } from './admin/FleetReports';
import { WageManagement as AdminWageManagement } from './admin/WageManagement';
import { StaffProfiles } from './admin/StaffProfiles';

// Staff Pages
import { StaffDashboard } from './staff/StaffDashboard';
import { UpdateDetails } from './staff/UpdateDetails';
import { SalaryManagement } from './staff/SalaryManagement';
import { LoanManagement } from './staff/LoanManagement';
import { ExpenseTracking } from './staff/ExpenseTracking';
import { MatatuManagement } from './staff/MatatuManagement';
import { Reports } from './staff/Reports';
import { TreasurerDashboard } from './staff/TreasurerDashboard';
import { NotFound } from './NotFound';
import { AppLayout } from './app/AppLayout';
import { AppLanding } from './app/AppLanding';
import { AccessProvider, useAccess } from '../context/AccessContext';
import { legacyRouteMap } from '../navigation/legacyRouteMap';

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

  const handleLogin = (userData: { id?: string; name: string; role: string; phone: string; userType?: string | null; hasCompletedCapitalPayment?: boolean }) => {
    const newUser: User = { 
      ...userData, 
      role: userData.role as User['role'],
      hasCompletedCapitalPayment: userData.hasCompletedCapitalPayment ?? false 
    };
    setUser(newUser);
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
  };

  const handleCapitalPaymentComplete = () => {
    if (user) {
      setUser({ ...user, hasCompletedCapitalPayment: true });
    }
  };

  return (
    <BrowserRouter>
      <AccessProvider>
        <VehicleOwnerDataProvider userId={user?.id ?? null}>
          <AppRoutes
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onCapitalPaymentComplete={handleCapitalPaymentComplete}
          />
        </VehicleOwnerDataProvider>
      </AccessProvider>
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
  onLogin: (userData: { id?: string; name: string; role: string; phone: string; userType?: string | null; hasCompletedCapitalPayment?: boolean }) => void;
  onLogout: () => void;
  onCapitalPaymentComplete: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const access = useAccess();
  const userWithPermissions = user
    ? { ...user, permissions: access.permissions }
    : access.isAuthenticated
      ? { name: 'User', role: 'Member', phone: '', permissions: access.permissions }
      : null;
  const canApproveLoans = access.permissions.includes('LOANS:APPROVE');

  const AppUserProfileRoute = () => {
    const { userId } = useParams<{ userId: string }>();
    return (
      <ProtectedRoute user={userWithPermissions} routePath="app/members/profiles/:userId" onNavigate={handleNavigate}>
        <UserProfiles
          user={user}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          selectedUserId={userId}
          LayoutComponent={AppLayout}
          currentPage="app/members/profiles"
        />
      </ProtectedRoute>
    );
  };

  const AppFleetVehicleRoute = () => {
    const { vehicleId } = useParams<{ vehicleId: string }>();
    return (
      <ProtectedRoute user={userWithPermissions} routePath="app/vehicles/:vehicleId" onNavigate={handleNavigate}>
        <ViewVehicle
          user={user}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          vehicleId={vehicleId ?? ''}
          LayoutComponent={AppLayout}
          currentPage="app/vehicles"
        />
      </ProtectedRoute>
    );
  };

  const LegacyRouteRedirect = ({ to }: { to: string }) => {
    const params = useParams();
    let resolved = to;
    Object.entries(params).forEach(([key, value]) => {
      resolved = resolved.replace(`:${key}`, String(value));
    });
    return <Navigate to={`/${resolved}`} replace />;
  };

  useEffect(() => {
    const unsubscribe = subscribeToUnauthorized(() => {
      onLogout();
      navigate('/login', { replace: true, state: { reason: 'sessionExpired' } });
    });

    return unsubscribe;
  }, [onLogout, navigate]);

  const handleNavigate = (page: string) => {
    if (page.startsWith('/')) {
      navigate(page);
      return;
    }
    navigate(`/${page === 'home' ? '' : page}`);
  };

  // Check if navigation should be hidden
  const hideNavigation = [
    '/login', '/register', '/forgot-password'
  ].includes(location.pathname) || 
  location.pathname.startsWith('/users/') || 
  location.pathname.startsWith('/admin/') || 
  location.pathname.startsWith('/staff/') ||
  location.pathname.startsWith('/app/');

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
              <ProtectedRoute user={userWithPermissions} routePath="users/welcome" onNavigate={handleNavigate}>
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
              <ProtectedRoute user={userWithPermissions} routePath="users/home" onNavigate={handleNavigate}>
                <HomeDashboard user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/vehicles" 
            element={
              <ProtectedRoute user={userWithPermissions} routePath="users/vehicles" onNavigate={handleNavigate}>
                <VehicleDashboard user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/apply-loan" 
            element={
              <ProtectedRoute user={userWithPermissions} routePath="users/apply-loan" onNavigate={handleNavigate}>
                <LoanApplication user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/financial-status" 
            element={
              <ProtectedRoute user={userWithPermissions} routePath="users/financial-status" onNavigate={handleNavigate}>
                <FinancialStatus user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/addVehicle" 
            element={
              <ProtectedRoute user={userWithPermissions} routePath="users/addVehicle" onNavigate={handleNavigate}>
                <VehicleRegistration user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/profile" 
            element={
              <ProtectedRoute user={userWithPermissions} routePath="users/profile" onNavigate={handleNavigate}>
                <ProfilePage user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users/exit" 
            element={
              <ProtectedRoute user={userWithPermissions} routePath="users/exit" onNavigate={handleNavigate}>
                <ExitSacco user={user} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Role-based redirects */}
          <Route 
            path="/dashboard" 
            element={<DashboardRedirect user={user} />} 
          />

          {/* Shared App Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app" onNavigate={handleNavigate}>
                <AppLanding user={userWithPermissions} onNavigate={handleNavigate} onLogout={onLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/dashboard"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/dashboard" onNavigate={handleNavigate}>
                <StaffDashboard
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/dashboard"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/admin/dashboard"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/admin/dashboard" onNavigate={handleNavigate}>
                <AdminDashboard
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/admin/dashboard"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/members"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/members" onNavigate={handleNavigate}>
                <UsersManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/members"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/members/approve"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/members/approve" onNavigate={handleNavigate}>
                <ApproveUsers
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/members/approve"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/members/roles"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/members/roles" onNavigate={handleNavigate}>
                <UserRoles
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/members/roles"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/members/create"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/members/create" onNavigate={handleNavigate}>
                <CreateUser
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/members/create"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/members/profiles"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/members/profiles" onNavigate={handleNavigate}>
                <UserProfiles
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/members/profiles"
                />
              </ProtectedRoute>
            }
          />
          <Route path="/app/members/profiles/:userId" element={<AppUserProfileRoute />} />
          <Route
            path="/app/vehicles"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/vehicles" onNavigate={handleNavigate}>
                <FleetManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/vehicles"
                />
              </ProtectedRoute>
            }
          />
          <Route path="/app/vehicles/:vehicleId" element={<AppFleetVehicleRoute />} />
          <Route
            path="/app/vehicles/routes"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/vehicles/routes" onNavigate={handleNavigate}>
                <RouteManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/vehicles/routes"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/vehicles/matatus"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/vehicles/matatus" onNavigate={handleNavigate}>
                <MatatuManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/vehicles/matatus"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/remittances"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/remittances" onNavigate={handleNavigate}>
                <TreasurerDashboard
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/remittances"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/payroll"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/payroll" onNavigate={handleNavigate}>
                <SalaryManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/payroll"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/payroll/admin"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/payroll/admin" onNavigate={handleNavigate}>
                <AdminWageManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/payroll/admin"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/expenses"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/expenses" onNavigate={handleNavigate}>
                <ExpenseTracking
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/expenses"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/insurance"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/insurance" onNavigate={handleNavigate}>
                <FinancialOverview
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/insurance"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/loans"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/loans" onNavigate={handleNavigate}>
                {canApproveLoans ? (
                  <LoanApplications
                    user={user}
                    onNavigate={handleNavigate}
                    onLogout={onLogout}
                    LayoutComponent={AppLayout}
                    currentPage="app/loans"
                  />
                ) : (
                  <LoanManagement
                    user={user}
                    onNavigate={handleNavigate}
                    onLogout={onLogout}
                    LayoutComponent={AppLayout}
                    currentPage="app/loans"
                  />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/loans/manage"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/loans/manage" onNavigate={handleNavigate}>
                <LoanManagement
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/loans/manage"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/reports" onNavigate={handleNavigate}>
                <Reports
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/reports"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports/users"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/reports/users" onNavigate={handleNavigate}>
                <UserReports
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/reports/users"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports/financials"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/reports/financials" onNavigate={handleNavigate}>
                <FinancialReports
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/reports/financials"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/reports/fleet"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/reports/fleet" onNavigate={handleNavigate}>
                <FleetReports
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/reports/fleet"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/staff/profile"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/staff/profile" onNavigate={handleNavigate}>
                <UpdateDetails
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/staff/profile"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/admin/staff-profiles"
            element={
              <ProtectedRoute user={userWithPermissions} routePath="app/admin/staff-profiles" onNavigate={handleNavigate}>
                <StaffProfiles
                  user={user}
                  onNavigate={handleNavigate}
                  onLogout={onLogout}
                  LayoutComponent={AppLayout}
                  currentPage="app/admin/staff-profiles"
                />
              </ProtectedRoute>
            }
          />

          {/* Legacy Routes -> /app redirects (permission checked) */}
          {legacyRouteMap.map((route) => (
            <Route
              key={route.legacyPath}
              path={`/${route.legacyPath}`}
              element={
                <ProtectedRoute user={userWithPermissions} routePath={route.legacyPath} onNavigate={handleNavigate}>
                  <LegacyRouteRedirect to={route.appPath} />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Catch all route - show not found */}
          <Route path="*" element={<NotFound onNavigate={handleNavigate} />} />
        </Routes>
      </main>
    </div>
  );
}

// Component to redirect to appropriate dashboard based on user role
function DashboardRedirect({ user }: { user: User | null }) {
  const access = useAccess();
  if (!user && !access.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userType = String(access.userType ?? '').toUpperCase();
  if (userType === 'USER' || userType === 'VEHICLE_OWNER') {
    return <Navigate to="/users/home" replace />;
  }

  return <Navigate to="/app" replace />;
}

export default RouterApp;
