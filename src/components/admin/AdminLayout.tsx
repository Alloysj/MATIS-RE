import { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  DollarSign, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
  UserCheck,
  Shield,
  Building,
  Route,
  CarFront,
  BarChart3,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronDoubleLeft
} from 'lucide-react';

interface AdminLayoutProps {
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

export function AdminLayout({ children, user, currentPage, onNavigate, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: 'app/admin/dashboard',
      icon: LayoutDashboard,
      current: currentPage === 'app/admin/dashboard'
    },
    {
      name: 'User Management',
      icon: Users,
      children: [
        { name: 'All Users', href: 'app/members', icon: Users },
        { name: 'Approve Users', href: 'app/members/approve', icon: UserCheck },
        { name: 'User Roles', href: 'app/members/roles', icon: Shield },
        { name: 'Staff Profiles', href: 'app/admin/staff-profiles', icon: Shield },
        { name: 'Create User', href: 'app/members/create', icon: UserPlus },
        { name: 'User Categories', href: 'app/members/profiles', icon: Building }
      ]
    },
    {
      name: 'Fleet Management',
      icon: Car,
      children: [
        { name: 'All Vehicles', href: 'app/vehicles', icon: Car },
        { name: 'Route Management', href: 'app/vehicles/routes', icon: Route }
      ]
    },
    {
      name: 'Financial',
      href: 'app/insurance',
      icon: DollarSign,
      current: currentPage === 'app/insurance'
    },
    {
      name: 'Payroll',
      href: 'app/payroll/admin',
      icon: Banknote,
      current: currentPage === 'app/payroll/admin'
    },
    {
      name: 'Loan Applications',
      href: 'app/loans',
      icon: CreditCard,
      current: currentPage === 'app/loans'
    },
    {
      name: 'Reports',
      icon: FileText,
      children: [
        { name: 'User Reports', href: 'app/reports/users', icon: Users },
        { name: 'Fleet Reports', href: 'app/reports/fleet', icon: Car },
        { name: 'Financial Reports', href: 'app/reports/financials', icon: BarChart3 }
      ]
    }
  ];

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (groupName: string) => {
    if (sidebarCollapsed) return; // Don't allow expansion when collapsed
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    if (!sidebarCollapsed) {
      // When collapsing, close all expanded groups
      setExpandedGroups([]);
    }
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] flex items-center justify-center">
              <span className="font-bold text-black">M</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-gray-900">MATIS Admin</span>
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
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 group ${sidebarCollapsed ? 'tooltip-trigger' : ''}`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <div className="flex items-center">
                      <item.icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                      {!sidebarCollapsed && item.name}
                    </div>
                    {!sidebarCollapsed && (
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${
                          expandedGroups.includes(item.name) ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </button>
                  {expandedGroups.includes(item.name) && !sidebarCollapsed && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.name}
                          onClick={() => onNavigate(child.href)}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg group ${
                            currentPage === child.href
                              ? 'bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 text-gray-900 border-l-2 border-[var(--neon-turquoise)]'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <child.icon className="mr-3 h-4 w-4" />
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate(item.href!)}
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
              )}
            </div>
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
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 border-2 border-[var(--neon-turquoise)]">
                  <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                    {user?.name?.charAt(0) || 'A'}
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
