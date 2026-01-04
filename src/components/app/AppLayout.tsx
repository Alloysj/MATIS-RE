import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { useAccess } from '../../context/AccessContext';
import { flattenMenuNodes, getVisibleMenuSections, type MenuNode } from '../../navigation/menuRegistry';
import { PermissionLink } from '../auth/PermissionLink';

interface AppLayoutProps {
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

export function AppLayout({ children, user, currentPage, onNavigate, onLogout }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const access = useAccess();
  const visibleSections = useMemo(
    () => getVisibleMenuSections(access.permissions),
    [access.permissions]
  );

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const renderNode = (node: MenuNode, depth = 0) => {
    const isGroup = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expandedNodes[node.key] ?? true;
    const paddingLeft = sidebarCollapsed ? undefined : { paddingLeft: `${Math.min(depth * 12 + 12, 48)}px` };

    if (isGroup) {
      return (
        <div key={node.key} className="space-y-2">
          <button
            type="button"
            onClick={() => toggleNode(node.key)}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700`}
            title={sidebarCollapsed ? node.label : ''}
          >
            <span className="flex items-center" style={paddingLeft}>
              {node.icon && <node.icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />}
              {!sidebarCollapsed && node.label}
            </span>
            {!sidebarCollapsed && (
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </button>
          {!sidebarCollapsed && isExpanded && (
            <div className="space-y-1">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <PermissionLink
        key={node.key}
        to={node.path}
        rule={node.requiredPermissions}
        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : ''} px-3 py-2 text-sm font-medium rounded-lg group ${
          currentPage === node.path.replace(/^\//, '')
            ? 'bg-gradient-to-r from-[var(--neon-turquoise)]/10 to-[var(--neon-yellow)]/10 text-gray-900 border-l-2 border-[var(--neon-turquoise)]'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={sidebarCollapsed ? node.label : undefined}
      >
        {node.icon && <node.icon className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />}
        {!sidebarCollapsed && node.label}
      </PermissionLink>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-xl transform transition-all duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-2'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] flex items-center justify-center">
              <span className="font-bold text-black">M</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-gray-900">MATIS App</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
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

        <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-4 overflow-y-auto`}>
          {access.loading && (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`nav-skeleton-${index}`} className="h-8 rounded-lg bg-gray-200" />
              ))}
            </div>
          )}

          {!access.loading && visibleSections.length === 0 && (
            <p className="text-xs text-gray-500 px-2">
              No modules assigned.
            </p>
          )}

          {!access.loading && !sidebarCollapsed && visibleSections.map((section) => (
            <div key={section.key}>
              {!sidebarCollapsed && section.label && (
                <p className="text-xs uppercase tracking-wide text-gray-400 px-2 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-2">
                {section.nodes.map((node) => renderNode(node))}
              </div>
            </div>
          ))}

          {!access.loading && sidebarCollapsed && (
            <div className="space-y-2">
              {flattenMenuNodes(visibleSections.flatMap((section) => section.nodes)).map((node) =>
                renderNode(node)
              )}
            </div>
          )}
        </nav>
      </div>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
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
                Workspace
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 border-2 border-[var(--neon-turquoise)]">
                  <AvatarFallback className="bg-gradient-to-r from-[var(--neon-turquoise)] to-[var(--neon-yellow)] text-black font-semibold">
                    {user?.name?.charAt(0) || 'U'}
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
