import { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductStatus } from '@/types/pos';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency } from '@/lib/pos-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, AlertTriangle, LayoutGrid, DollarSign, Warehouse, Truck, CheckCircle2 } from 'lucide-react';

const categoryOptions: { value: ProductCategory; label: string }[] = [
  { value: 'construction-equipment', label: 'Construction Equipment' },
  { value: 'power-tools', label: 'Power Tools' },
  { value: 'hand-tools', label: 'Hand Tools' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'safety-equipment', label: 'Safety Equipment' },
  { value: 'fasteners', label: 'Fasteners' },
  { value: 'building-materials', label: 'Building Materials' },
];

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const { addProduct, updateProduct, locations, fetchLocations, employees, fetchEmployees } = useDataStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'hand-tools' as ProductCategory,
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    quantity: 0,
    lowStockThreshold: 10,
    supplier: '',
    unit: 'unit',
    // New ERP Fields
    defaultLocationId: '',
    isTaxInclusive: false,
    taxRate: 18,
    reservedQuantity: 0,
    bonusQuantity: 0,
    packingUnit: '',
    packingSize: 0,
    salesRepId: '',
    expiryDate: '',
    status: 'approved' as ProductStatus,
  });

  useEffect(() => {
    if (open) {
      fetchLocations();
      fetchEmployees();

      setFormData({
        name: product?.name || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        category: product?.category || 'hand-tools' as ProductCategory,
        description: product?.description || '',
        costPrice: product?.costPrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        wholesalePrice: product?.wholesalePrice || 0,
        quantity: product?.quantity || 0,
        lowStockThreshold: product?.lowStockThreshold || 10,
        supplier: product?.supplier || '',
        unit: product?.unit || 'unit',
        defaultLocationId: product?.defaultLocationId || '',
        isTaxInclusive: product?.isTaxInclusive || false,
        taxRate: product?.taxRate || 18,
        reservedQuantity: product?.reservedQuantity || 0,
        bonusQuantity: product?.bonusQuantity || 0,
        packingUnit: product?.packingUnit || '',
        packingSize: product?.packingSize || 0,
        salesRepId: product?.salesRepId || '',
        expiryDate: product?.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
        status: product?.status || 'draft',
      });
      setActiveTab('general');
    }
  }, [open, product, fetchLocations, fetchEmployees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in product name and SKU.',
        variant: 'destructive',
      });
      setActiveTab('general');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      };

      if (product) {
        await updateProduct(product.id, payload as any);
        toast({ title: 'Product updated', description: `${formData.name} has been updated.` });
      } else {
        await addProduct(payload as any);
        toast({ title: 'Product added', description: `${formData.name} has been added to inventory.` });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error saving product',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6 text-primary" />
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Update product information and ERP levels' : 'Add a new professional item to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="financials" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financials
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="logistics" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Logistics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Stanley Hammer 20oz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. HND-000001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 8901234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as ProductCategory })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Base Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit">Unit / Pcs</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="bag">Bag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Primary Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="e.g. BuildPro Supplies"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description and features..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (TZS)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Retail Price (TZS)</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wholesalePrice">Wholesale Price (TZS)</Label>
                    <Input
                      id="wholesalePrice"
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">VAT / Tax Percentage (%)</Label>
                    <Select
                      value={formData.taxRate.toString()}
                      onValueChange={(value) => setFormData({ ...formData, taxRate: Number(value) })}
                    >
                      <SelectTrigger id="taxRate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (Exempt)</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="18">18% (Standard)</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm mt-6">
                    <div className="space-y-0.5">
                      <Label htmlFor="tax-inc">Price Includes Tax</Label>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Toggle if the selling price already includes VAT.
                      </p>
                    </div>
                    <Switch
                      id="tax-inc"
                      checked={formData.isTaxInclusive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isTaxInclusive: checked })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Total Physical Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Min. Stock Alert Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reserved">Reserved Quantity</Label>
                    <Input
                      id="reserved"
                      type="number"
                      value={formData.reservedQuantity}
                      onChange={(e) => setFormData({ ...formData, reservedQuantity: Number(e.target.value) })}
                      placeholder="Promised to customers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bonus">Free / Bonus Quantity</Label>
                    <Input
                      id="bonus"
                      type="number"
                      value={formData.bonusQuantity}
                      onChange={(e) => setFormData({ ...formData, bonusQuantity: Number(e.target.value) })}
                      placeholder="Sample / Bonus stock"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="location">Warehouse / Storage Location</Label>
                    <Select
                      value={formData.defaultLocationId}
                      onValueChange={(value) => setFormData({ ...formData, defaultLocationId: value })}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Select Warehouse Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} {loc.isActive ? '' : '(Inactive)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="logistics" className="space-y-4 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="packingUnit">Packing Type</Label>
                    <Input
                      id="packingUnit"
                      value={formData.packingUnit}
                      onChange={(e) => setFormData({ ...formData, packingUnit: e.target.value })}
                      placeholder="e.g. Master Carton / Box"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packingSize">Packing Level (Qty/Pkg)</Label>
                    <Input
                      id="packingSize"
                      type="number"
                      value={formData.packingSize}
                      onChange={(e) => setFormData({ ...formData, packingSize: Number(e.target.value) })}
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesRep">Assigned Promoter/Sales Rep</Label>
                    <Select
                      value={formData.salesRepId}
                      onValueChange={(value) => setFormData({ ...formData, salesRepId: value })}
                    >
                      <SelectTrigger id="salesRep">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Batch Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="status">Product Approval Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as ProductStatus })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              {opt.value === 'approved' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                              {opt.value === 'pending' && <Loader2 className="h-3 w-3 text-yellow-500" />}
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-6 border-t bg-muted/20">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {product ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function StockAdjustmentModal({ open, onOpenChange, product }: StockAdjustmentModalProps) {
  const { addStockRecord } = useDataStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState<'in' | 'out' | 'adjustment' | 'set'>('in');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || (type !== 'set' && quantity === 0)) return;

    setIsSubmitting(true);

    let change = 0;
    if (type === 'in') change = Math.abs(quantity);
    else if (type === 'out') change = -Math.abs(quantity);
    else if (type === 'adjustment') change = quantity; // Allow literal adjustment
    else if (type === 'set') change = quantity - product.quantity;

    const newStock = product.quantity + change;

    if (newStock < 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Stock cannot go below zero.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await addStockRecord({
        productId: product.id,
        productName: product.name,
        type: type === 'set' ? 'adjustment' : (type as any),
        quantity: Math.abs(change),
        previousStock: product.quantity,
        newStock,
        reason: reason || (type === 'set' ? `Stock set to ${quantity}` : `Stock ${type}`),
        createdBy: 'Current User',
      });

      toast({
        title: 'Stock updated',
        description: `${product.name}: ${product.quantity} → ${newStock} ${product.unit}`,
      });

      setQuantity(0);
      setReason('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Adjustment failed',
        description: error.message || 'Could not update stock.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Update stock for {product.name} (Current: {product.quantity} {product.unit})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'in' | 'out' | 'adjustment')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock In (Add)</SelectItem>
                <SelectItem value="out">Stock Out (Remove)</SelectItem>
                <SelectItem value="adjustment">Relative Adjustment</SelectItem>
                <SelectItem value="set">Set Level (Override)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={type === 'set' ? "0" : "1"}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New shipment received"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || quantity === 0}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmModal({ open, onOpenChange, title, description, onConfirm }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    // Minimal wait for UI feedback, but rely on the actual async operation
    await onConfirm();
    setIsDeleting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
