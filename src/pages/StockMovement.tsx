import { useState, useMemo, useEffect } from 'react';
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
    Search,
    CheckCircle2,
    Package,
    Eye,
    FileText,
    AlertCircle,
    Clock,
} from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { InvoiceModal } from '@/components/receipt';

const StockMovement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const isMobile = useIsMobile();
    const { sales, customers, fetchSales, fetchCustomers } = useDataStore();

    useEffect(() => {
        fetchSales();
        fetchCustomers();
    }, [fetchSales, fetchCustomers]);

    const pendingSales = useMemo(() => {
        return sales
            .filter(sale => sale.status === 'awaiting_delivery')
            .map((sale) => {
                const customerName = sale.customerName || (
                    sale.customerId
                        ? customers.find(c => c.id === sale.customerId)?.name || 'Unknown Customer'
                        : 'Walk-in Customer'
                );

                return {
                    id: sale.id,
                    displayId: `#${sale.id.slice(0, 8)}`,
                    customer: customerName,
                    items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
                    total: sale.total,
                    date: formatDateTime(sale.createdAt),
                    status: sale.status,
                    originalSale: sale,
                };
            });
    }, [sales, customers]);

    const filteredSales = useMemo(() => {
        return pendingSales.filter((sale) => {
            const matchesSearch = sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.displayId.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [pendingSales, searchQuery]);

    const handleConfirmDelivery = async () => {
        if (!selectedSale) return;

        setIsConfirming(true);
        try {
            await api.sales.confirmSale(selectedSale.id);
            toast.success('Delivery confirmed successfully');
            setConfirmDialogOpen(false);
            setViewDetailsOpen(false);
            fetchSales(); // Refresh the list
        } catch (error: any) {
            toast.error(error.message || 'Failed to confirm delivery');
        } finally {
            setIsConfirming(false);
        }
    };

    const openConfirmDialog = (sale: any) => {
        setSelectedSale(sale);
        setConfirmDialogOpen(true);
    };

    const openSaleDetails = (sale: any) => {
        setSelectedSale(sale);
        setViewDetailsOpen(true);
    };

    const openInvoice = (sale: any) => {
        setSelectedSale(sale);
        setInvoiceOpen(true);
    };

    const MobileSaleCard = ({ sale }: { sale: any }) => (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{sale.displayId}</span>
                        <Badge className="bg-warning/20 text-warning border-none text-[10px] font-bold uppercase tracking-wider">
                            Pending Delivery
                        </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground mt-2 truncate">{sale.customer}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{sale.date}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openSaleDetails(sale)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Items</span>
                    <span className="text-sm font-bold">{sale.items} units</span>
                </div>
                <Button
                    size="sm"
                    className="bg-success hover:bg-success/90 text-success-foreground gap-2 h-9 px-4"
                    onClick={() => openConfirmDialog(sale)}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm
                </Button>
            </div>
        </div>
    );

    return (
        <MainLayout>
            <PageContent>
                <PageHeader
                    title="Stock Movement"
                    description="Manage and confirm pending deliveries"
                >
                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>
                    </div>
                </PageHeader>

                {/* Info Banner */}
                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-primary">Pending Actions</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Confirming a delivery will record the sale in global reports and update the inventory levels permanently.
                            The customer will receive a notification and the delivery note will be finalized.
                        </p>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid gap-4 mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Deliveries</p>
                            <p className="text-2xl font-bold text-foreground">{pendingSales.length}</p>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground inline-flex items-center gap-2">
                            Delivery Queue
                            <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-xs font-bold">
                                {filteredSales.length}
                            </Badge>
                        </h3>
                    </div>

                    {isMobile ? (
                        <div className="space-y-4">
                            {filteredSales.map((sale) => (
                                <MobileSaleCard key={sale.id} sale={sale} />
                            ))}
                            {filteredSales.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
                                    <Package className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="font-medium text-lg">No pending deliveries</p>
                                    <p className="text-sm opacity-60">All orders have been shipped and confirmed.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="font-bold py-4">Order ID</TableHead>
                                        <TableHead className="font-bold py-4">Customer</TableHead>
                                        <TableHead className="font-bold py-4 text-center">Items</TableHead>
                                        <TableHead className="font-bold py-4">Order Date</TableHead>
                                        <TableHead className="font-bold py-4 text-right">Value</TableHead>
                                        <TableHead className="font-bold py-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.map((sale) => (
                                        <TableRow key={sale.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-bold text-primary py-4">{sale.displayId}</TableCell>
                                            <TableCell className="font-medium">{sale.customer}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                                                    {sale.items} items
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{sale.date}</TableCell>
                                            <TableCell className="text-right font-bold text-foreground">
                                                {formatCurrency(sale.total)}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => openSaleDetails(sale)}>
                                                        <Eye className="h-4 w-4" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 gap-2 border-success/30 text-success hover:bg-success/5 hover:text-success"
                                                        onClick={() => openConfirmDialog(sale)}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Confirm Receipt
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredSales.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <Package className="h-16 w-16 mb-4 opacity-10" />
                                    <p className="font-semibold text-lg">Your delivery queue is empty!</p>
                                    <p className="text-sm opacity-60">Wait for new orders from the POS system.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PageContent>

            {/* Sale Details Dialog */}
            <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
                <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <FileText className="h-5 w-5 text-primary" />
                            Delivery Note Details
                        </DialogTitle>
                        <DialogDescription>
                            Detailed information for delivery confirmation of order {selectedSale?.displayId}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSale && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Customer Info</p>
                                    <p className="font-bold">{selectedSale.customer}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/30 border border-border text-right">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Value</p>
                                    <p className="font-bold text-lg text-primary">{formatCurrency(selectedSale.total)}</p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold">Product</TableHead>
                                            <TableHead className="font-bold text-center">Qty</TableHead>
                                            <TableHead className="font-bold text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedSale.originalSale.items.map((item: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.product.name}</TableCell>
                                                <TableCell className="text-center font-bold">{item.quantity} {item.product.unit}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.product.sellingPrice)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/20 h-11"
                                    onClick={() => {
                                        setViewDetailsOpen(false);
                                        setConfirmDialogOpen(true);
                                    }}
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Proceed to Confirmation
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-10 gap-2"
                                        onClick={() => openInvoice(selectedSale)}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Delivery Note (PDF)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="max-w-md bg-card border-border border-2">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold text-foreground">Confirm Receipt</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Are you sure you have received the delivery note and confirmed the sale for order <span className="font-bold text-primary">{selectedSale?.displayId}</span>?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center py-6">
                        <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-4 ring-8 ring-success/5 animate-pulse">
                            <CheckCircle2 className="h-10 w-10 text-success" />
                        </div>
                        <p className="text-xs text-center text-muted-foreground px-8">
                            This action will permanently update the inventory and record the financial transaction.
                        </p>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="ghost" className="flex-1" onClick={() => setConfirmDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-bold"
                            onClick={handleConfirmDelivery}
                            disabled={isConfirming}
                        >
                            {isConfirming ? 'Processing...' : 'Confirm & Finalize'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedSale && (
                <InvoiceModal
                    open={invoiceOpen}
                    onOpenChange={setInvoiceOpen}
                    sale={selectedSale.originalSale}
                />
            )}
        </MainLayout>
    );
};

export default StockMovement;
