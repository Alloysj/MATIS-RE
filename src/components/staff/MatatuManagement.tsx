import { FleetManagement } from '../admin/FleetManagement';
import { StaffLayout } from './StaffLayout';

interface MatatuManagementProps {
  user: {
    id?: string;
    name: string;
    role: string;
    phone: string;
  } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function MatatuManagement({ user, onNavigate, onLogout }: MatatuManagementProps) {
  return (
    <FleetManagement
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      LayoutComponent={StaffLayout}
      currentPage="staff/matatumanagement"
    />
  );
}
