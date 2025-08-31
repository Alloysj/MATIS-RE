import { useState } from 'react';
import { Button } from './ui/button';
import { Menu, X, Bus, Users, Phone, HelpCircle, LogIn, UserPlus } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Bus },
    { id: 'about', label: 'About', icon: Users },
    { id: 'join', label: 'How to Join', icon: UserPlus },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact', icon: Phone },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group" 
            onClick={() => onNavigate('home')}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--neon-yellow)] via-[var(--neon-orange)] to-[var(--neon-purple)] p-0.5">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                  <Bus className="w-5 h-5 text-gray-900" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--neon-turquoise)] rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900 group-hover:bg-gradient-to-r group-hover:from-[var(--neon-purple)] group-hover:to-[var(--neon-turquoise)] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                MATIS
              </span>
              <span className="text-xs text-gray-500 -mt-1">Transport Solutions</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-gray-900 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => onNavigate('login')}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button
              onClick={() => onNavigate('register')}
              className="bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-[var(--neon-yellow)] to-[var(--neon-orange)] text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-600 hover:text-gray-900"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-turquoise)] text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}