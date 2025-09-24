import { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { 
  Home, 
  Car, 
  CreditCard, 
  PiggyBank, 
  UserPlus, 
  User as UserIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface VehicleOwnerLayoutProps {
  children: ReactNode;
  currentPage: string;
  user: { id?: string; name: string; role: string; phone: string } | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function VehicleOwnerLayout({ 
  children, 
  currentPage, 
  user, 
  onNavigate, 
  onLogout 
}: VehicleOwnerLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'users/home', label: 'Dashboard', icon: Home },
    { id: 'users/vehicles', label: 'My Vehicles', icon: Car },
    { id: 'users/apply-loan', label: 'Apply Loan', icon: CreditCard },
    { id: 'users/financial-status', label: 'Financials', icon: PiggyBank },
    { id: 'users/addVehicle', label: 'Add Vehicle', icon: UserPlus },
    { id: 'users/profile', label: 'Profile', icon: UserIcon },
    { id: 'users/exit', label: 'Exit SACCO', icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--neon-yellow)] opacity-5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 right-20 w-96 h-96 bg-[var(--neon-purple)] opacity-5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-[var(--neon-turquoise)] opacity-5 rounded-full blur-3xl animate-pulse delay-2000"></div>

      {/* Top Navigation Bar */}
      <nav className="relative z-20 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-slate-900 px-3 py-1 rounded-lg">
                  <span className="font-bold">MATIS</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigationItems.slice(0, -1).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => onNavigate(item.id)}
                      className={`px-3 py-2 text-sm transition-all duration-200 ${
                        isActive
                          ? 'text-[var(--neon-yellow)] bg-[var(--neon-yellow)]/10 border border-[var(--neon-yellow)]/30'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-white/80">
                <div className="text-sm">{user?.name}</div>
                <div className="text-xs text-white/60">{user?.role}</div>
              </div>
              
              {/* Exit SACCO (Desktop) */}
              <Button
                variant="ghost"
                onClick={() => onNavigate('users/exit')}
                className="hidden md:flex text-orange-300 hover:text-orange-200 hover:bg-orange-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Exit SACCO
              </Button>

              <Button
                variant="ghost"
                onClick={onLogout}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                className="md:hidden text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/50 backdrop-blur-xl border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--neon-yellow)] bg-[var(--neon-yellow)]/10 border border-[var(--neon-yellow)]/30'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
