import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RouteProtectionService, User } from './services/routeProtection';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { HowToJoinPage } from './components/HowToJoinPage';
import { FAQPage } from './components/FAQPage';
import { ContactPage } from './components/ContactPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { VehicleOwnerDataProvider } from './context/VehicleOwnerDataContext';
import { NotFound } from './components/NotFound';

// Vehicle Owner Pages
import { ShareholderCapitalPayment } from './components/vehicleowner/ShareholderCapitalPayment';
import { HomeDashboard } from './components/vehicleowner/HomeDashboard';
import { VehicleDashboard } from './components/vehicleowner/VehicleDashboard';
import { LoanApplication } from './components/vehicleowner/LoanApplication';
import { FinancialStatus } from './components/vehicleowner/FinancialStatus';
import { VehicleRegistration } from './components/vehicleowner/VehicleRegistration';
import { ProfilePage } from './components/vehicleowner/ProfilePage';
import { ExitSacco } from './components/vehicleowner/ExitSacco';

// Admin Pages
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UsersManagement } from './components/admin/UsersManagement';
import { ApproveUsers } from './components/admin/ApproveUsers';
import { UserRoles } from './components/admin/UserRoles';
import { CreateUser } from './components/admin/CreateUser';
import { UserProfiles } from './components/admin/UserProfiles';
import { FleetManagement } from './components/admin/FleetManagement';
import { FinancialOverview } from './components/admin/FinancialOverview';
import { LoanApplications } from './components/admin/LoanApplications';
import { RouteManagement } from './components/admin/RouteManagement';
import { WageManagement as AdminWageManagement } from './components/admin/WageManagement';
import { UserReports } from './components/admin/UserReports';
import { FinancialReports } from './components/admin/FinancialReports';
import { FleetReports } from './components/admin/FleetReports';

// Staff Pages
import { StaffDashboard } from './components/staff/StaffDashboard';
import { UpdateDetails } from './components/staff/UpdateDetails';
import { SalaryManagement } from './components/staff/SalaryManagement';
import { LoanManagement } from './components/staff/LoanManagement';
import { ExpenseTracking } from './components/staff/ExpenseTracking';
import { MatatuManagement } from './components/staff/MatatuManagement';
import { Reports } from './components/staff/Reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);

  const handleNavigate = (page: string) => {
    // Check if user is authorized to access the route
    const authResult = RouteProtectionService.isAuthorized(user, page);
    
    if (!authResult.authorized) {
      // Show unauthorized access message
      console.warn(`Access denied to ${page}: ${authResult.reason}`);
      
      // Redirect to appropriate page
      if (authResult.redirectTo) {
        setCurrentPage(authResult.redirectTo);
      }
      return;
    }

    setCurrentPage(page);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (userData: { id?: string; name: string; role: string; phone: string; hasCompletedCapitalPayment?: boolean }) => {
    const newUser: User = { 
      ...userData, 
      role: userData.role as User['role'],
      hasCompletedCapitalPayment: userData.hasCompletedCapitalPayment ?? false 
    };
    setUser(newUser);
    
    // Route based on role and permissions
    const defaultRoute = RouteProtectionService.getDefaultRouteForRole(newUser.role);
    const authResult = RouteProtectionService.isAuthorized(newUser, defaultRoute);
    
    if (authResult.authorized) {
      setCurrentPage(defaultRoute);
    } else if (authResult.redirectTo) {
      setCurrentPage(authResult.redirectTo);
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
    if (typeof window !== 'undefined') {
      window.location.href = 'http://localhost:3000/';
    }
  };

  const handleCapitalPaymentComplete = () => {
    if (user) {
      setUser({ ...user, hasCompletedCapitalPayment: true });
      setCurrentPage('users/home');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      // Public pages
      case 'home':
        return (
          <ProtectedRoute user={user} routePath="home" onNavigate={handleNavigate}>
            <LandingPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'about':
        return (
          <ProtectedRoute user={user} routePath="about" onNavigate={handleNavigate}>
            <AboutPage />
          </ProtectedRoute>
        );
      case 'join':
        return (
          <ProtectedRoute user={user} routePath="join" onNavigate={handleNavigate}>
            <HowToJoinPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'faq':
        return (
          <ProtectedRoute user={user} routePath="faq" onNavigate={handleNavigate}>
            <FAQPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'contact':
        return (
          <ProtectedRoute user={user} routePath="contact" onNavigate={handleNavigate}>
            <ContactPage />
          </ProtectedRoute>
        );
      case 'login':
        return (
          <ProtectedRoute user={user} routePath="login" onNavigate={handleNavigate}>
            <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />
          </ProtectedRoute>
        );
      case 'register':
        return (
          <ProtectedRoute user={user} routePath="register" onNavigate={handleNavigate}>
            <RegisterPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      case 'forgot-password':
        return (
          <ProtectedRoute user={user} routePath="forgot-password" onNavigate={handleNavigate}>
            <ForgotPasswordPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        );
      
      // Vehicle Owner pages
      case 'users/welcome':
        return (
          <ProtectedRoute user={user} routePath="users/welcome" onNavigate={handleNavigate}>
            <ShareholderCapitalPayment 
              user={user} 
              onNavigate={handleNavigate} 
              onComplete={handleCapitalPaymentComplete}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        );
      case 'users/home':
        return (
          <ProtectedRoute user={user} routePath="users/home" onNavigate={handleNavigate}>
            <HomeDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'users/vehicles':
        return (
          <ProtectedRoute user={user} routePath="users/vehicles" onNavigate={handleNavigate}>
            <VehicleDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'users/apply-loan':
        return (
          <ProtectedRoute user={user} routePath="users/apply-loan" onNavigate={handleNavigate}>
            <LoanApplication user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'users/financial-status':
        return (
          <ProtectedRoute user={user} routePath="users/financial-status" onNavigate={handleNavigate}>
            <FinancialStatus user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'users/addVehicle':
        return (
          <ProtectedRoute user={user} routePath="users/addVehicle" onNavigate={handleNavigate}>
            <VehicleRegistration user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'users/profile':
        return (
          <ProtectedRoute user={user} routePath="users/profile" onNavigate={handleNavigate}>
            <ProfilePage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'users/exit':
        return (
          <ProtectedRoute user={user} routePath="users/exit" onNavigate={handleNavigate}>
            <ExitSacco user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      
      // Admin pages
      case 'admin/dashboard':
        return (
          <ProtectedRoute user={user} routePath="admin/dashboard" onNavigate={handleNavigate}>
            <AdminDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/users':
        return (
          <ProtectedRoute user={user} routePath="admin/users" onNavigate={handleNavigate}>
            <UsersManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/users/approve':
        return (
          <ProtectedRoute user={user} routePath="admin/users/approve" onNavigate={handleNavigate}>
            <ApproveUsers user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/users/roles':
        return (
          <ProtectedRoute user={user} routePath="admin/users/roles" onNavigate={handleNavigate}>
            <UserRoles user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/users/create':
        return (
          <ProtectedRoute user={user} routePath="admin/users/create" onNavigate={handleNavigate}>
            <CreateUser user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/users/profiles':
        return (
          <ProtectedRoute user={user} routePath="admin/users/profiles" onNavigate={handleNavigate}>
            <UserProfiles user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/fleet':
        return (
          <ProtectedRoute user={user} routePath="admin/fleet" onNavigate={handleNavigate}>
            <FleetManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/financials':
        return (
          <ProtectedRoute user={user} routePath="admin/financials" onNavigate={handleNavigate}>
            <FinancialOverview user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/wages':
        return (
          <ProtectedRoute user={user} routePath="admin/wages" onNavigate={handleNavigate}>
            <AdminWageManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/loans':
        return (
          <ProtectedRoute user={user} routePath="admin/loans" onNavigate={handleNavigate}>
            <LoanApplications user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/fleet/routes':
        return (
          <ProtectedRoute user={user} routePath="admin/fleet/routes" onNavigate={handleNavigate}>
            <RouteManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/reports/users':
        return (
          <ProtectedRoute user={user} routePath="admin/reports/users" onNavigate={handleNavigate}>
            <UserReports user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/reports/financials':
        return (
          <ProtectedRoute user={user} routePath="admin/reports/financials" onNavigate={handleNavigate}>
            <FinancialReports user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'admin/reports/fleet':
        return (
          <ProtectedRoute user={user} routePath="admin/reports/fleet" onNavigate={handleNavigate}>
            <FleetReports user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'not-found':
        return <NotFound onNavigate={handleNavigate} />;

      // Staff pages
      case 'staff/dashboard':
        return (
          <ProtectedRoute user={user} routePath="staff/dashboard" onNavigate={handleNavigate}>
            <StaffDashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'staff/update':
        return (
          <ProtectedRoute user={user} routePath="staff/update" onNavigate={handleNavigate}>
            <UpdateDetails user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'staff/salary':
        return (
          <ProtectedRoute user={user} routePath="staff/salary" onNavigate={handleNavigate}>
            <SalaryManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'staff/loanmanagement':
        return (
          <ProtectedRoute user={user} routePath="staff/loanmanagement" onNavigate={handleNavigate}>
            <LoanManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'staff/expensetracking':
        return (
          <ProtectedRoute user={user} routePath="staff/expensetracking" onNavigate={handleNavigate}>
            <ExpenseTracking user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'staff/matatumanagement':
        return (
          <ProtectedRoute user={user} routePath="staff/matatumanagement" onNavigate={handleNavigate}>
            <MatatuManagement user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'staff/reports':
        return (
          <ProtectedRoute user={user} routePath="staff/reports" onNavigate={handleNavigate}>
            <Reports user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          </ProtectedRoute>
        );
      
      default:
        return <NotFound onNavigate={handleNavigate} />;
    }
  };

  // Don't show navigation for login/register/forgot-password pages and authenticated user pages
  const hideNavigation = [
    'login', 'register', 'forgot-password'
  ].includes(currentPage) || currentPage.startsWith('users/') || currentPage.startsWith('admin/') || currentPage.startsWith('staff/');

  return (
    <VehicleOwnerDataProvider userId={user?.id ?? null}>
      <div className="min-h-screen bg-background">
        {!hideNavigation && (
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        )}
        <main>
          {renderPage()}
        </main>
      </div>
    </VehicleOwnerDataProvider>
  );
}
