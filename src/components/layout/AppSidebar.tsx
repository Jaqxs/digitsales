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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={zantrixLogo} alt="Zantrix" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-3">
              <img src={zantrixLogo} alt="Zantrix" className="h-10 w-auto" />
            </SheetTitle>
          </SheetHeader>
          
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-muted'
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border p-3 mt-auto">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'Guest'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full mt-2 justify-start gap-3 px-3"
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
        collapsed ? 'w-[72px]' : 'w-64',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={zantrixLogo} alt="Zantrix" className="h-10 w-auto" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground shrink-0"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5', collapsed && 'justify-center px-2')}>
          <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role || 'Guest'}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
