import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pos-utils';

interface SalesChartProps {
  data: { month: string; sales: number; orders: number }[];
  className?: string;
}

export function SalesChart({ data, className }: SalesChartProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sales Overview</h3>
        <p className="text-sm text-muted-foreground">Monthly revenue and order trends</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                boxShadow: 'var(--shadow-lg)',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Sales']}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            <Bar
              dataKey="sales"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface CategoryChartProps {
  data: { category: string; value: number }[];
  className?: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export function CategoryChart({ data, className }: CategoryChartProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sales by Category</h3>
        <p className="text-sm text-muted-foreground">Revenue distribution across categories</p>
      </div>
      <div className="h-[300px] flex items-center">
        <ResponsiveContainer width="50%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
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
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-muted-foreground truncate flex-1">{item.category}</span>
              <span className="text-sm font-medium text-foreground">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TopProductsProps {
  data: { name: string; sales: number }[];
  className?: string;
}

export function TopProducts({ data, className }: TopProductsProps) {
  const maxSales = Math.max(...data.map((p) => p.sales));

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-card', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Top Products</h3>
        <p className="text-sm text-muted-foreground">Best selling items this month</p>
      </div>
      <div className="space-y-4">
        {data.map((product, index) => (
          <div key={product.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {product.name}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(product.sales)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(product.sales / maxSales) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
