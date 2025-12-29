import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { useAuth, canAccessRoute } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Zap,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import zantrixLogo from '@/assets/zantrix-logo.png';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, route: 'dashboard' },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart, route: 'pos' },
  { name: 'Inventory', href: '/inventory', icon: Package, route: 'inventory' },
  { name: 'Sales', href: '/sales', icon: FileText, route: 'sales' },
  { name: 'Customers', href: '/customers', icon: Users, route: 'customers' },
  { name: 'Employees', href: '/employees', icon: UserCircle, route: 'employees' },
  { name: 'Reports', href: '/reports', icon: BarChart3, route: 'reports' },
  { name: 'System Logs', href: '/system-logs', icon: Activity, route: 'system-logs' },
  { name: 'Settings', href: '/settings', icon: Settings, route: 'settings' },
];

// Mobile Header Component
export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setOpen(false);
  };

  const filteredNav = navigation.filter(
    (item) => user && canAccessRoute(user.role, item.route)
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={zantrixLogo} alt="Zantrix" className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground font-bold text-sm shadow-glow">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[300px] p-0 bg-sidebar border-sidebar-border">
          <SheetHeader className="p-5 border-b border-sidebar-border">
            <SheetTitle className="flex items-center gap-3">
              <img src={zantrixLogo} alt="Zantrix" className="h-11 w-auto" />
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-lg'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4 mt-auto">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-sidebar-accent/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-glow">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role || 'Guest'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full mt-3 justify-start gap-3 px-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Desktop Sidebar Component
export function AppSidebar({ className }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const filteredNav = navigation.filter(
    (item) => user && canAccessRoute(user.role, item.route)
  );

  // Don't render desktop sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <aside
      className={cn(
        'fixed left-4 top-4 bottom-4 z-40 flex flex-col rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl transition-all duration-300',
        isSidebarCollapsed ? 'w-[80px]' : 'w-72',
        className
      )}
    >
      {/* Header */}
      <div className={cn("flex h-20 items-center px-4", isSidebarCollapsed ? "justify-center" : "justify-between")}>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3">
            <img src={zantrixLogo} alt="Zantrix" className="h-9 w-auto" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-foreground/60 hover:text-primary hover:bg-primary/10 shrink-0 rounded-xl"
        >
          {isSidebarCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto no-scrollbar">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-foreground/70 hover:bg-white/50 hover:text-primary hover:shadow-sm',
                isSidebarCollapsed && 'justify-center px-0'
              )}
              title={isSidebarCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform duration-300',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}
              />
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 mt-auto">
        <div className={cn(
          'flex items-center gap-3 rounded-xl p-2 transition-all duration-300',
          !isSidebarCollapsed && 'bg-white/50 border border-white/40 shadow-sm'
        )}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md ring-2 ring-white">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-foreground/60 truncate capitalize">{user?.role}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full mt-2 text-foreground/60 hover:bg-red-50 hover:text-destructive rounded-xl transition-colors',
            isSidebarCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isSidebarCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
