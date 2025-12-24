import { useState, useMemo } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { mockDashboardStats } from '@/data/mock-data';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency, formatDateTime } from '@/lib/pos-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Download,
  CalendarDays,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Receipt,
  Eye,
  Plus,
  Printer,
  FileText,
} from 'lucide-react';
import { RecordSaleModal } from '@/components/modals';
import { ReceiptModal, InvoiceModal } from '@/components/receipt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sale } from '@/types/pos';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock sales data (will be combined with store data)
const mockRecentSales = [
  { id: '#1247', customer: 'Mwanza Construction Ltd', items: 5, total: 2450000, date: '2024-12-22 14:35', status: 'completed', payment: 'M-Pesa' },
  { id: '#1246', customer: 'Walk-in Customer', items: 2, total: 680000, date: '2024-12-22 13:12', status: 'completed', payment: 'Cash' },
  { id: '#1245', customer: 'Dar Hardware Store', items: 12, total: 4250000, date: '2024-12-22 11:48', status: 'completed', payment: 'Bank' },
  { id: '#1244', customer: 'Walk-in Customer', items: 1, total: 55000, date: '2024-12-22 10:22', status: 'completed', payment: 'Cash' },
  { id: '#1243', customer: 'Arusha Builders', items: 8, total: 3180000, date: '2024-12-21 16:45', status: 'refunded', payment: 'Card' },
  { id: '#1242', customer: 'Walk-in Customer', items: 3, total: 275000, date: '2024-12-21 15:30', status: 'completed', payment: 'M-Pesa' },
];

const Sales = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recordSaleOpen, setRecordSaleOpen] = useState(false);
  const [viewSaleOpen, setViewSaleOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  
  const { sales } = useDataStore();
  const stats = mockDashboardStats;

  // Combine mock sales with store sales
  const allSales = useMemo(() => {
    const storeSales = sales.map((sale, index) => ({
      id: `#${sale.id}`,
      customer: 'Walk-in Customer',
      items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      total: sale.total,
      date: formatDateTime(sale.createdAt),
      status: sale.status,
      payment: sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1),
      originalSale: sale,
    }));
    return [...storeSales, ...mockRecentSales];
  }, [sales]);

  const filteredSales = useMemo(() => {
    return allSales.filter(
      (sale) =>
        sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allSales, searchQuery]);

  const todaysSales = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.total, 0) + 7435000;
  }, [sales]);

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    }
    if (status === 'refunded') {
      return <Badge variant="destructive">Refunded</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handleViewSale = (sale: any) => {
    setSelectedSale(sale);
    setViewSaleOpen(true);
  };

  const handlePrintReceipt = (sale: any) => {
    if (sale.originalSale) {
      setReceiptSale(sale.originalSale);
    } else {
      // Create a mock sale object for old sales
      setReceiptSale({
        id: sale.id,
        items: [],
        subtotal: sale.total / 1.18,
        discount: 0,
        vat: sale.total - (sale.total / 1.18),
        total: sale.total,
        paymentMethod: sale.payment.toLowerCase().replace('-', '-') as any,
        employeeId: '1',
        createdAt: new Date(sale.date),
        status: sale.status as any,
      });
    }
    setReceiptOpen(true);
  };

  const handlePrintInvoice = (sale: any) => {
    if (sale.originalSale) {
      setReceiptSale(sale.originalSale);
    } else {
      setReceiptSale({
        id: sale.id,
        items: [],
        subtotal: sale.total / 1.18,
        discount: 0,
        vat: sale.total - (sale.total / 1.18),
        total: sale.total,
        paymentMethod: sale.payment.toLowerCase() as any,
        employeeId: '1',
        createdAt: new Date(sale.date),
        status: sale.status as any,
      });
    }
    setSelectedSale(sale);
    setInvoiceOpen(true);
  };

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Sales" description="Track and manage all sales transactions">
          <Button variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Dec 2024
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setRecordSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Sale
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success-light flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Sales</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(todaysSales)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Orders</p>
              <p className="text-2xl font-bold text-foreground">{23 + sales.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-info-light flex items-center justify-center">
              <Receipt className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(323260)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning-light flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth</p>
              <p className="text-2xl font-bold text-success">+{stats.salesGrowth}%</p>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Sales Trend</h3>
            <p className="text-sm text-muted-foreground">Revenue over the last 6 months</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                />
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold text-center">Items</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-primary">{sale.id}</TableCell>
                    <TableCell className="text-foreground">{sale.customer}</TableCell>
                    <TableCell className="text-center">{sale.items}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sale.payment}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{sale.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewSale(sale)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePrintReceipt(sale)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintInvoice(sale)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-50" />
                <p>No sales found</p>
              </div>
            )}
          </div>
        </div>
      </PageContent>

      <RecordSaleModal open={recordSaleOpen} onOpenChange={setRecordSaleOpen} />

      {/* View Sale Modal */}
      <Dialog open={viewSaleOpen} onOpenChange={setViewSaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>View transaction information</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium text-primary">{selectedSale.id}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedSale.customer}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{selectedSale.payment}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedSale.status)}
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="font-medium">{selectedSale.items} items</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedSale.date}</p>
                </div>
              </div>
              <div className="rounded-lg bg-success-light p-4">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(selectedSale.total)}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 gap-2" 
                  variant="outline"
                  onClick={() => {
                    setViewSaleOpen(false);
                    handlePrintReceipt(selectedSale);
                  }}
                >
                  <Printer className="h-4 w-4" />
                  Receipt
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => {
                    setViewSaleOpen(false);
                    handlePrintInvoice(selectedSale);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={receiptSale}
        customerName={selectedSale?.customer}
      />

      {/* Invoice Modal */}
      {receiptSale && (
        <InvoiceModal
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          sale={receiptSale}
        />
      )}
    </MainLayout>
  );
};

export default Sales;
