import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import zantrixLogo from '@/assets/zantrix-logo.png';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Employees', href: '/employees', icon: UserCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
        className
      )}
    >
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => (
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

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0">
            AJ
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Amina Juma</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">Admin</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
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
