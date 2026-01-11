import { useState, useMemo } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart, CategoryChart, TopProducts } from '@/components/dashboard/Charts';
import { LowStockAlert, RecentActivity } from '@/components/dashboard/Alerts';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/pos-utils';
import { getStockStatus } from '@/lib/pos-utils';
import { DateRange } from "react-day-picker";
import { addDays, endOfDay } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const matchesDate = dateRange?.from ?
        (saleDate >= dateRange.from && saleDate <= endOfDay(dateRange.to || dateRange.from)) : true;
      const isCompleted = sale.status === 'completed';
      return matchesDate && isCompleted;
    });
  }, [sales, dateRange]);

  const totalRevenue = useMemo(() => filteredSales.reduce((sum, sale) => sum + sale.total, 0), [filteredSales]);
  const totalOrders = filteredSales.length;

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.product.id);
        if (product) {
          const current = categoryMap.get(product.category) || 0;
          categoryMap.set(product.category, current + (product.sellingPrice * item.quantity));
        }
      });
    });
    return Array.from(categoryMap.entries()).map(([category, value]) => ({ category, value }));
  }, [filteredSales, products]);

  const salesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Logic to aggregate by month or day depending on range would be complex, simplified to monthly for now or just daily if short range
    // For simplicity given the props (month: string), let's stick to monthly aggregation of filtered data
    // Or if filtered data is short, maybe list days? The SalesChart expects "month" key.
    // Let's create a dynamic View based on range? 
    // Stick to monthly for now to match interface.

    const monthlyStats = months.map(month => ({ month, sales: 0, orders: 0 }));
    filteredSales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const monthIndex = date.getMonth();
      monthlyStats[monthIndex].sales += sale.total;
      monthlyStats[monthIndex].orders += 1;
    });

    // Filter out empty months to make chart cleaner if filtered
    return monthlyStats.filter(m => m.sales > 0);
  }, [filteredSales]);

  const topProducts = useMemo(() => {
    const productMap = new Map<string, number>();
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const current = productMap.get(item.product.name) || 0;
        productMap.set(item.product.name, current + item.quantity); // or value? Top Products by sales usually means revenue or quantity. Let's do revenue.
        // Actually usually Top Selling means quantity, but High Revenue means value.
        // Let's do Revenue for consistency with "Top Products" value.
        // Re-reading code, the logic for map above was quantity? No, let's look at `Charts.tsx`.
        // `TopProducts` component takes `{ name: string; sales: number }`. sales implies value.
        const product = products.find(p => p.id === item.product.id);
        if (product) {
          const val = productMap.get(product.name) || 0;
          productMap.set(product.name, val + (product.sellingPrice * item.quantity));
        }
      });
    });
    return Array.from(productMap.entries())
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredSales, products]);

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
          <Button size="sm" className="gap-2 btn-brand-orange" onClick={() => setRecordSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Record</span> Sale
          </Button>
        </PageHeader>

        {/* Quick Actions - Horizontal scroll on mobile */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
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
            value={formatCurrency(totalRevenue)}
            change={0}
            icon={<DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="success"
          />
          <StatsCard
            title="Total Orders"
            value={formatNumber(totalOrders)}
            change={0}
            icon={<ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="brand"
          />
          <StatsCard
            title="Products"
            value={formatNumber(products.length)}
            change={0}
            icon={<Package className="h-5 w-5 sm:h-6 sm:w-6" />}
            iconColor="primary"
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
          <SalesChart data={salesData} />
          <CategoryChart data={categoryData} />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 lg:grid-cols-3">
          <TopProducts data={topProducts} />
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
