import { useState, useMemo, useEffect } from 'react';
import { DateRange } from "react-day-picker";
import { addDays, endOfDay } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { exportToCSV, exportToPDF } from "@/utils/exportUtils";
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency, formatDateTime } from '@/lib/pos-utils';
import { useIsMobile } from '@/hooks/use-mobile';
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
  MoreVertical,
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

import { useSettingsStore } from '@/stores/settingsStore';

const Sales = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recordSaleOpen, setRecordSaleOpen] = useState(false);
  const [viewSaleOpen, setViewSaleOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });


  const isMobile = useIsMobile();
  const { business } = useSettingsStore();

  const { sales, customers, fetchSales, fetchCustomers } = useDataStore();

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [fetchSales, fetchCustomers]);

  // Combine mock sales with store sales
  const allSales = useMemo(() => {
    return sales.map((sale) => {
      const customerName = sale.customerName || (
        sale.customerId
          ? customers.find(c => c.id === sale.customerId)?.name || 'Unknown Customer'
          : 'Walk-in Customer'
      );

      return {
        id: `#${sale.id}`,
        customer: customerName,
        items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        total: sale.total,
        date: formatDateTime(sale.createdAt),
        status: sale.status,
        payment: sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1),
        originalSale: sale,
      };
    });
  }, [sales, customers]);

  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      const matchesSearch = sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = dateRange?.from ?
        (new Date(sale.originalSale.createdAt) >= dateRange.from &&
          new Date(sale.originalSale.createdAt) <= endOfDay(dateRange.to || dateRange.from)) : true;

      const matchesStatus = sale.status === 'completed';

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [allSales, searchQuery, dateRange]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  }, [filteredSales]);

  const avgOrderValue = useMemo(() => {
    if (filteredSales.length === 0) return 0;
    return totalRevenue / filteredSales.length;
  }, [filteredSales, totalRevenue]);

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-success text-success-foreground text-xs font-semibold">Completed</Badge>;
    }
    if (status === 'refunded') {
      return <Badge variant="destructive" className="text-xs font-semibold">Refunded</Badge>;
    }
    if (status === 'awaiting_delivery') {
      return <Badge className="bg-warning text-warning-foreground text-xs font-semibold border-warning/20">Awaiting Delivery</Badge>;
    }
    return <Badge variant="secondary" className="text-xs font-semibold">{status}</Badge>;
  };

  const handleViewSale = (sale: any) => {
    setSelectedSale(sale);
    setViewSaleOpen(true);
  };

  const handlePrintReceipt = (sale: any) => {
    if (sale.originalSale) {
      setReceiptSale(sale.originalSale);
    } else {
      // Fallback if somehow originalSale is missing (shouldn't happen with new logic)
      const vatRate = business.vatRate / 100;
      const subtotal = sale.total / (1 + vatRate);
      setReceiptSale({
        id: sale.id.replace('#', ''),
        items: [],
        subtotal: subtotal,
        discount: 0,
        vat: sale.total - subtotal,
        total: sale.total,
        paymentMethod: sale.payment.toLowerCase(),
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
      const vatRate = business.vatRate / 100;
      const subtotal = sale.total / (1 + vatRate);
      setReceiptSale({
        id: sale.id.replace('#', ''),
        items: [],
        subtotal: subtotal,
        discount: 0,
        vat: sale.total - subtotal,
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

  const handleExport = () => {
    // Export mostly what's visible or all sales
    const dataToExport = filteredSales.map(s => ({
      'Order ID': s.id,
      'Customer': s.customer,
      'Date': s.date,
      'Items': s.items,
      'Total': s.total,
      'Status': s.status,
      'Payment': s.payment
    }));

    exportToCSV(dataToExport, 'Sales_Report');
  };

  // Mobile Sale Card
  const MobileSaleCard = ({ sale }: { sale: any }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary">{sale.id}</span>
            {getStatusBadge(sale.status)}
          </div>
          <p className="text-sm text-foreground mt-1 truncate">{sale.customer}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sale.date}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewSale(sale)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
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
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">{sale.payment}</Badge>
          <span className="text-xs text-muted-foreground">{sale.items} items</span>
        </div>
        <span className="font-bold text-foreground">{formatCurrency(sale.total)}</span>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Sales" description="Track and manage transactions">
          <div className="hidden sm:block">
            <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setRecordSaleOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Record</span> Sale
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 mt-4 sm:mt-6 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success-light flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Period Revenue</p>
              <p className="text-base sm:text-2xl font-bold text-foreground truncate">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Orders</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{filteredSales.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-info-light flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Avg Order</p>
              <p className="text-base sm:text-2xl font-bold text-foreground truncate">{formatCurrency(avgOrderValue)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-warning-light flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Growth</p>
              <p className="text-lg sm:text-2xl font-bold text-success">+0%</p>
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="mt-4 sm:mt-6 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Sales Trend</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Revenue over 6 months</p>
          </div>
          <div className="h-[180px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                />
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Recent Transactions</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Mobile Cards / Desktop Table */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredSales.map((sale) => (
                <MobileSaleCard key={sale.id} sale={sale} />
              ))}
              {filteredSales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-4 opacity-50" />
                  <p>No sales found</p>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </PageContent>

      <RecordSaleModal open={recordSaleOpen} onOpenChange={setRecordSaleOpen} />

      {/* View Sale Modal */}
      <Dialog open={viewSaleOpen} onOpenChange={setViewSaleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>View transaction information</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="font-medium text-primary text-sm">{selectedSale.id}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium text-sm truncate">{selectedSale.customer}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium text-sm">{selectedSale.payment}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(selectedSale.status)}
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Items</p>
                  <p className="font-medium text-sm">{selectedSale.items} items</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-sm">{selectedSale.date}</p>
                </div>
              </div>
              <div className="rounded-lg bg-success-light p-4">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-success">{formatCurrency(selectedSale.total)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  variant="outline"
                  size="sm"
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
                  size="sm"
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
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={receiptSale}
        customerName={selectedSale?.customer}
      />

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
