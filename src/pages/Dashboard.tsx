import { useState } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart, CategoryChart, TopProducts } from '@/components/dashboard/Charts';
import { LowStockAlert, RecentActivity } from '@/components/dashboard/Alerts';
import { mockDashboardStats } from '@/data/mock-data';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency, formatNumber } from '@/lib/pos-utils';
import { getStockStatus } from '@/lib/pos-utils';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  CalendarDays,
  Download,
  Plus,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecordSaleModal, RecordInventoryModal } from '@/components/modals';

const Dashboard = () => {
  const stats = mockDashboardStats;
  const { products, sales } = useDataStore();
  const [recordSaleOpen, setRecordSaleOpen] = useState(false);
  const [recordInventoryOpen, setRecordInventoryOpen] = useState(false);

  const lowStockCount = products.filter(
    (p) => getStockStatus(p.quantity, p.lowStockThreshold) === 'low-stock' ||
           getStockStatus(p.quantity, p.lowStockThreshold) === 'out-of-stock'
  ).length;

  return (
    <MainLayout>
      <PageContent>
        <PageHeader 
          title="Dashboard" 
          description="Welcome back! Here's what's happening at Zantrix Group."
        >
          <Button variant="outline" className="gap-2" onClick={() => setRecordInventoryOpen(true)}>
            <Package className="h-4 w-4" />
            Record Inventory
          </Button>
          <Button className="gap-2" onClick={() => setRecordSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Sale
          </Button>
        </PageHeader>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Dec 2024
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            View All Sales
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Sales"
            value={formatCurrency(stats.totalSales)}
            change={stats.salesGrowth}
            icon={<DollarSign className="h-6 w-6" />}
            iconColor="success"
          />
          <StatsCard
            title="Total Orders"
            value={formatNumber(stats.totalOrders + sales.length)}
            change={8.2}
            icon={<ShoppingCart className="h-6 w-6" />}
            iconColor="primary"
          />
          <StatsCard
            title="Products in Stock"
            value={formatNumber(products.length)}
            change={2.5}
            icon={<Package className="h-6 w-6" />}
            iconColor="info"
          />
          <StatsCard
            title="Low Stock Items"
            value={lowStockCount}
            change={-15}
            changeLabel="items resolved"
            icon={<AlertTriangle className="h-6 w-6" />}
            iconColor="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 mt-6 lg:grid-cols-2">
          <SalesChart data={stats.monthlySales} />
          <CategoryChart data={stats.salesByCategory} />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 mt-6 lg:grid-cols-3">
          <TopProducts data={stats.topProducts} />
          <LowStockAlert />
          <RecentActivity />
        </div>
      </PageContent>

      <RecordSaleModal open={recordSaleOpen} onOpenChange={setRecordSaleOpen} />
      <RecordInventoryModal open={recordInventoryOpen} onOpenChange={setRecordInventoryOpen} />
    </MainLayout>
  );
};

export default Dashboard;
