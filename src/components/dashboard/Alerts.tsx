import { formatCurrency, formatDateTime } from '@/lib/pos-utils';
import { useDataStore } from '@/stores/dataStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';

interface LowStockAlertProps {
  className?: string;
}

export function LowStockAlert({ className }: LowStockAlertProps) {
  const { products } = useDataStore();

  const lowStockItems = products.filter(
    (p) => p.quantity <= p.lowStockThreshold
  );

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Low Stock Alerts</h3>
          <p className="text-sm text-muted-foreground">Items requiring attention</p>
        </div>
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {lowStockItems.length} items
        </Badge>
      </div>
      <div className="space-y-3">
        {lowStockItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All items are well stocked</p>
          </div>
        ) : (
          lowStockItems.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 rounded-lg bg-destructive-light/50 border border-destructive/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-destructive">{product.quantity} left</p>
                <p className="text-xs text-muted-foreground">Min: {product.lowStockThreshold}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface RecentActivityProps {
  className?: string;
}

function getRecentActivities() {
  const { sales, products } = useDataStore();

  const activities = [];

  // Add recent sales
  const recentSales = sales.slice(0, 3).map((sale, index) => ({
    id: `sale-${sale.id}`,
    action: 'Sale completed',
    details: `Order #${sale.id} - ${formatCurrency(sale.total)}`,
    time: formatDateTime(sale.createdAt),
    type: 'sale' as const
  }));

  // Add low stock alerts
  const lowStockAlerts = products
    .filter(p => p.quantity <= p.lowStockThreshold)
    .slice(0, 2)
    .map(product => ({
      id: `alert-${product.id}`,
      action: 'Low stock alert',
      details: `${product.name} - ${product.quantity} units`,
      time: 'Recently',
      type: 'alert' as const
    }));

  return [...recentSales, ...lowStockAlerts];
}

const activityColors = {
  sale: 'bg-success/10 text-success',
  stock: 'bg-info/10 text-info',
  customer: 'bg-primary/10 text-primary',
  alert: 'bg-warning/10 text-warning',
};

export function RecentActivity({ className }: RecentActivityProps) {
  const activities = getRecentActivities();

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest system events</p>
      </div>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={cn(
                  'h-2 w-2 rounded-full mt-2 shrink-0',
                  activityColors[activity.type as keyof typeof activityColors]
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
