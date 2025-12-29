import { useState } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart, CategoryChart, TopProducts } from '@/components/dashboard/Charts';
import { LowStockAlert, RecentActivity } from '@/components/dashboard/Alerts';
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
          description="Welcome back! Here's what's happening."
        >
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setRecordInventoryOpen(true)}>
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Record</span> Inventory
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setRecordSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Record</span> Sale
          </Button>
        </PageHeader>

        {/* Quick Actions - Horizontal scroll on mobile */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <CalendarDays className="h-4 w-4" />
            Dec 2024
          </Button>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <FileText className="h-4 w-4" />
            View Sales
          </Button>
        </div>

        {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
        <div className="grid gap-3 sm:gap-6 mt-4 sm:mt-6 grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Sales"
            value={formatCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}
            change={0}
            icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="success"
          />
          <StatsCard
            title="Total Orders"
            value={formatNumber(sales.length)}
            change={0}
            icon={<ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="primary"
          />
          <StatsCard
            title="Products"
            value={formatNumber(products.length)}
            change={0}
            icon={<Package className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="info"
          />
          <StatsCard
            title="Low Stock"
            value={lowStockCount}
            change={0}
            changeLabel="items"
            icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="warning"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 lg:grid-cols-2">
          <SalesChart data={[]} />
          <CategoryChart data={[]} />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 lg:grid-cols-3">
          <TopProducts data={[]} />
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
