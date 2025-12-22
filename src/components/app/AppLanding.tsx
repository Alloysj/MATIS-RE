import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAccess } from '../../context/AccessContext';
import { getFirstAccessiblePath } from '../../navigation/menuRegistry';
import { AppLayout } from './AppLayout';
import { NoModulesAssigned } from './NoModulesAssigned';
import { User } from '../../services/routeProtection';

type AppLandingProps = {
  user: User | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
};

export function AppLanding({ user, onNavigate, onLogout }: AppLandingProps) {
  const access = useAccess();
  const userType = String(access.userType ?? '').toUpperCase();

  if (access.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (userType === 'USER' || userType === 'VEHICLE_OWNER') {
    return <Navigate to="/users/home" replace />;
  }

  const firstPath = getFirstAccessiblePath(access.permissions);
  if (firstPath) {
    return <Navigate to={`/${firstPath}`} replace />;
  }

  return (
    <AppLayout
      user={user ? { name: user.name, role: user.role ?? 'Member', phone: user.phone } : null}
      currentPage=""
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <NoModulesAssigned onNavigate={onNavigate} />
    </AppLayout>
  );
}
