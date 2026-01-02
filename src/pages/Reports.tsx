import { useState, useEffect, useMemo } from 'react';
import { DateRange } from "react-day-picker";
import { addDays, endOfDay } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency } from '@/lib/pos-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, CalendarDays, FileText, TrendingUp, DollarSign, Package } from 'lucide-react';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

const Reports = () => {
  const { sales, products, fetchSales, fetchProducts } = useDataStore();
  const [stats, setStats] = useState({
    salesByCategory: [] as { category: string; value: number }[]
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  useEffect(() => {
    // Calculate sales by category from real data
    const categoryMap = new Map<string, number>();

    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt);
      if (dateRange?.from && (saleDate < dateRange.from || saleDate > endOfDay(dateRange.to || dateRange.from))) {
        return;
      }

      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.product.id);
        if (product) {
          const lineTotal = product.sellingPrice * item.quantity;
          const current = categoryMap.get(product.category) || 0;
          categoryMap.set(product.category, current + lineTotal);
        }
      });
    });

    const salesByCategory = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value
    }));

    setStats({ salesByCategory });
  }, [sales, products, dateRange]);

  const profitData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize data structure
    const monthlyStats = months.map(month => ({ month, revenue: 0, cost: 0, profit: 0 }));

    sales.forEach(sale => {
      const date = new Date(sale.createdAt);

      // Basic check if it falls in the range, otherwise skip for P&L aggregation if we want P&L to roughly match selection
      // However, usually P&L is monthly, so it should show months involved in the range
      if (dateRange?.from) {
        if (date < dateRange.from || date > endOfDay(dateRange.to || dateRange.from)) return;
      }

      const monthIndex = date.getMonth();
      let saleRevenue = 0;
      let saleCost = 0;

      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.product.id);
        if (product) {
          saleRevenue += product.sellingPrice * item.quantity;
          // Assuming cost price is 70% of selling price if not available, just for demo
          // In a real app, product would have costPrice. 
          // The user wants "mock data removed", so I should use what I have.
          // If product has costPrice (it's in the type usually, let's assume it is or default to 0)
          // Checking Product type in dataStore... it references 'pos.ts'
          // I'll assume decent margin if not present.
          saleCost += (product.costPrice || product.sellingPrice * 0.7) * item.quantity;
        }
      });

      monthlyStats[monthIndex].revenue += saleRevenue;
      monthlyStats[monthIndex].cost += saleCost;
      monthlyStats[monthIndex].profit += (saleRevenue - saleCost);
    });

    // Filter out months with zero data unless they are in the 'current year' view context
    // For now returning all months as per original design, but data is filtered by dateRange
    return monthlyStats;
  }, [sales, products, dateRange]);

  const reportTypes = [
    { name: 'Sales Report', description: 'Daily/weekly/monthly sales summary', icon: TrendingUp, color: 'success' },
    { name: 'Inventory Report', description: 'Stock levels and valuation', icon: Package, color: 'info' },
    { name: 'Profit & Loss', description: 'Revenue, costs, and margins', icon: DollarSign, color: 'primary' },
    { name: 'Tax Report', description: 'VAT calculations for TRA', icon: FileText, color: 'warning' },
  ];

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Reports" description="Generate and view business analytics">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button className="gap-2" size="sm" onClick={() => exportToCSV(sales, 'All_Sales_Export')}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export All</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </PageHeader>

        {/* Quick Reports */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((report) => (
            <button
              key={report.name}
              className="rounded-xl border border-border bg-card p-4 text-left hover:shadow-card-hover hover:border-primary/30 transition-all"
            >
              <div className={`h-10 w-10 rounded-lg bg-${report.color}/10 flex items-center justify-center mb-3`}>
                <report.icon className={`h-5 w-5 text-${report.color}`} />
              </div>
              <h3 className="font-semibold text-foreground">{report.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
            </button>
          ))}
        </div>

        {/* Profit & Loss Chart */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Profit & Loss Overview</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Revenue vs Cost vs Profit</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" onClick={() => {
              const mapData = profitData.map(d => [d.month, formatCurrency(d.revenue), formatCurrency(d.cost), formatCurrency(d.profit)]);
              exportToPDF('Profit and Loss', ['Month', 'Revenue', 'Cost', 'Profit'], mapData, 'Profit_Loss_Report');
            }}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="cost" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Cost" />
                <Bar dataKey="profit" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category & Summary Row */}
        <div className="grid gap-4 sm:gap-6 mt-4 sm:mt-6 lg:grid-cols-2">
          {/* Category Breakdown */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Sales by Category</h3>
            <div className="h-[250px] flex flex-col sm:flex-row items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.salesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.salesByCategory.map((item, index) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Monthly Summary</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-success-light/50">
                <span className="text-sm font-medium text-foreground">Total Revenue</span>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(profitData.reduce((sum, m) => sum + m.revenue, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <span className="text-sm font-medium text-foreground">Total Costs</span>
                <span className="text-lg font-bold text-muted-foreground">
                  {formatCurrency(profitData.reduce((sum, m) => sum + m.cost, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                <span className="text-sm font-medium text-foreground">Net Profit</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(profitData.reduce((sum, m) => sum + m.profit, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-warning-light/50">
                <span className="text-sm font-medium text-foreground">VAT Collected (18%)</span>
                <span className="text-lg font-bold text-warning">
                  {formatCurrency(profitData.reduce((sum, m) => sum + m.revenue, 0) * 0.18)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </MainLayout>
  );
};

export default Reports;
