import { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  LayoutDashboard, 
  User, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Car, 
  FileText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Shield
} from 'lucide-react';

interface StaffLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    phone: string;
  } | null;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function StaffLayout({ children, user, currentPage, onNavigate, onLogout }: StaffLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const baseNavigation = [
    {
      name: 'Dashboard',
      href: 'staff/dashboard',
      icon: LayoutDashboard,
      current: currentPage === 'staff/dashboard'
    },
    {
      name: 'Update Details',
      href: 'staff/update',
      icon: User,
      current: currentPage === 'staff/update'
    },
    {
      name: 'Salary Management',
      href: 'staff/salary',
      icon: DollarSign,
      current: currentPage === 'staff/salary'
    },
    {
      name: 'Loan Management',
      href: 'staff/loanmanagement',
      icon: CreditCard,
      current: currentPage === 'staff/loanmanagement'
    },
    {
      name: 'Expense Tracking',
      href: 'staff/expensetracking',
      icon: Receipt,
      current: currentPage === 'staff/expensetracking'
    },
    {
      name: 'Matatu Management',
      href: 'staff/matatumanagement',
      icon: Car,
      current: currentPage === 'staff/matatumanagement'
    },
    {
      name: 'Reports',
      href: 'staff/reports',
      icon: FileText,
      current: currentPage === 'staff/reports'
    }
  ];

  const navigation = [...baseNavigation];
  const canViewTreasury = user?.role === 'Treasurer' || user?.role === 'Admin';

  if (canViewTreasury) {
    navigation.splice(2, 0, {
      name: 'Finance Module',
      href: 'staff/treasurer',
      icon: Shield,
      current: currentPage === 'staff/treasurer'
    });
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl transform transition-all duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] flex items-center justify-center">
              <span className="font-bold text-black">M</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-gray-900">MATIS Staff</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* Collapse/Expand button - hidden on mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              onClick={toggleSidebarCollapse}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2 overflow-y-auto`}>
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.href)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2 text-sm font-medium rounded-lg group ${
                item.current
                  ? 'bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 text-gray-900 border-l-2 border-[var(--neon-turquoise)]'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${sidebarCollapsed ? 'tooltip-trigger' : ''}`}
              title={sidebarCollapsed ? item.name : ''}
            >
              <item.icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />
              {!sidebarCollapsed && item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 ml-2 lg:ml-0">
                Staff Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 border-2 border-[var(--neon-turquoise)]">
                  <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                    {user?.name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
