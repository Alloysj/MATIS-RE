import { ComponentType, ReactNode } from 'react';
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
  LayoutComponent?: ComponentType<{
    children: ReactNode;
    user: { name: string; role: string; phone: string } | null;
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
  }>;
  currentPage?: string;
}

export function MatatuManagement({
  user,
  onNavigate,
  onLogout,
  LayoutComponent = StaffLayout,
  currentPage = 'staff/matatumanagement'
}: MatatuManagementProps) {
  return (
    <FleetManagement
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      LayoutComponent={LayoutComponent}
      currentPage={currentPage}
    />
  );
}
