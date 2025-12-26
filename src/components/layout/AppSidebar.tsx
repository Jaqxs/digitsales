import { NavLink, useNavigate } from 'react-router-dom';
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
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[80px]' : 'w-72',
        className
      )}
      style={{
        background: 'linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(0 0% 5%) 100%)',
      }}
    >
      {/* Header */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={zantrixLogo} alt="Zantrix" className="h-11 w-auto" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground shrink-0 rounded-xl"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4 py-5 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'justify-center px-3'
              )
            }
          >
            <item.icon className={cn('h-5 w-5 shrink-0 transition-transform duration-200', !collapsed && 'group-hover:scale-110')} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Quick Action */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary-dark/10 border border-primary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Quick Sale</span>
            </div>
            <p className="text-xs text-sidebar-foreground/70 mb-3">Start a new transaction</p>
            <Button
              size="sm"
              variant="glow"
              className="w-full"
              onClick={() => navigate('/pos')}
            >
              <ShoppingCart className="h-4 w-4" />
              Open POS
            </Button>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3 bg-sidebar-accent/30', collapsed && 'justify-center px-3')}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-glow">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role || 'Guest'}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive rounded-xl',
            collapsed ? 'justify-center px-3' : 'justify-start gap-3 px-4'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
