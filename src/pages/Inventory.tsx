import { useState, useMemo } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { Product } from '@/types/pos';
import { formatCurrency, getStockStatus } from '@/lib/pos-utils';
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
} from 'lucide-react';
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
  const { products, deleteProduct } = useDataStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

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
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    }
    if (status === 'low-stock') {
      return (
        <Badge className="bg-warning text-warning-foreground gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 text-success">
        <CheckCircle className="h-3 w-3" />
        In Stock
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

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Inventory" description="Manage your products and stock levels">
          <Button variant="outline" className="gap-2" onClick={() => setRecordInventoryOpen(true)}>
            <RefreshCw className="h-4 w-4" />
            Record Movement
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning-light flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-foreground">{stats.lowStock}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-destructive-light flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-foreground">{stats.outOfStock}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success-light flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Value</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold text-right">Cost Price</TableHead>
                <TableHead className="font-semibold text-right">Selling Price</TableHead>
                <TableHead className="font-semibold text-center">Quantity</TableHead>
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
