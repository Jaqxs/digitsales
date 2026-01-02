import { useState, useMemo, useEffect } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { Product } from '@/types/pos';
import { formatCurrency, getStockStatus } from '@/lib/pos-utils';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Download,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductModal, StockAdjustmentModal, DeleteConfirmModal, RecordInventoryModal } from '@/components/modals';
import { useToast } from '@/hooks/use-toast';

const categoryLabels: Record<string, string> = {
  'construction-equipment': 'Construction Equipment',
  'power-tools': 'Power Tools',
  'hand-tools': 'Hand Tools',
  'plumbing': 'Plumbing',
  'electrical': 'Electrical',
  'safety-equipment': 'Safety Equipment',
  'fasteners': 'Fasteners',
  'building-materials': 'Building Materials',
};

const Inventory = () => {
  const { products, deleteProduct, fetchProducts } = useDataStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordInventoryOpen, setRecordInventoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter;

      const stockStatus = getStockStatus(product.quantity, product.lowStockThreshold);
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && stockStatus === 'low-stock') ||
        (stockFilter === 'out' && stockStatus === 'out-of-stock') ||
        (stockFilter === 'in' && stockStatus === 'in-stock');

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(
      (p) => getStockStatus(p.quantity, p.lowStockThreshold) === 'low-stock'
    ).length;
    const outOfStock = products.filter(
      (p) => getStockStatus(p.quantity, p.lowStockThreshold) === 'out-of-stock'
    ).length;
    const totalValue = products.reduce(
      (sum, p) => sum + p.sellingPrice * p.quantity,
      0
    );
    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  const getStockBadge = (quantity: number, threshold: number) => {
    const status = getStockStatus(quantity, threshold);
    if (status === 'out-of-stock') {
      return (
        <Badge variant="destructive" className="gap-1 text-xs">
          <XCircle className="h-3 w-3" />
          Out
        </Badge>
      );
    }
    if (status === 'low-stock') {
      return (
        <Badge className="bg-warning text-warning-foreground gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Low
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 text-success text-xs">
        <CheckCircle className="h-3 w-3" />
        OK
      </Badge>
    );
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setStockModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id);
      toast({ title: 'Product deleted', description: `${selectedProduct.name} has been removed.` });
    }
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setProductModalOpen(true);
  };

  // Mobile Card View
  const MobileProductCard = ({ product }: { product: Product }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(product)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAdjustStock(product)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Adjust Stock
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(product)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Price</p>
          <p className="font-medium">{formatCurrency(product.sellingPrice)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Stock</p>
          <p className="font-medium">{product.quantity} {product.unit}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Status</p>
          {getStockBadge(product.quantity, product.lowStockThreshold)}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Inventory" description="Manage your products and stock">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setRecordInventoryOpen(true)}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Record</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span> Product
          </Button>
        </PageHeader>

        {/* Stats Cards - 2x2 on mobile */}
        <div className="grid gap-3 sm:gap-4 mt-4 sm:mt-6 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Products</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-warning-light flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Low Stock</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.lowStock}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-destructive-light flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.outOfStock}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success-light flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Stock Value</p>
              <p className="text-base sm:text-xl font-bold text-foreground truncate">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mt-4 sm:mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="flex-1 sm:w-[200px] sm:flex-none">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[120px] sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products - Cards on mobile, Table on desktop */}
        {isMobile ? (
          <div className="mt-4 space-y-3">
            {filteredProducts.map((product) => (
              <MobileProductCard key={product.id} product={product} />
            ))}
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No products found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-right">Cost</TableHead>
                  <TableHead className="font-semibold text-right">Price</TableHead>
                  <TableHead className="font-semibold text-center">Qty</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.supplier}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {categoryLabels[product.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(product.costPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-medium"
                        onClick={() => handleAdjustStock(product)}
                      >
                        {product.quantity} {product.unit}
                      </Button>
                    </TableCell>
                    <TableCell>{getStockBadge(product.quantity, product.lowStockThreshold)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No products found</p>
              </div>
            )}
          </div>
        )}
      </PageContent>

      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={selectedProduct}
      />
      <StockAdjustmentModal
        open={stockModalOpen}
        onOpenChange={setStockModalOpen}
        product={selectedProduct}
      />
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
      />
      <RecordInventoryModal open={recordInventoryOpen} onOpenChange={setRecordInventoryOpen} />
    </MainLayout>
  );
};

export default Inventory;
