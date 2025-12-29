import { ReactNode } from 'react';
import { AppSidebar, MobileHeader } from './AppSidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

import { useLayout } from '@/contexts/LayoutContext';

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { isSidebarCollapsed } = useLayout();

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white">
      <MobileHeader />
      <AppSidebar />
      <main className={cn(
        'transition-all duration-300 ease-in-out',
        isMobile ? 'pt-20 px-4' : cn(
          'min-h-screen py-6 pr-6',
          isSidebarCollapsed ? 'pl-[112px]' : 'pl-[320px]'
        )
      )}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
}
