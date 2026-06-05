import { useState, useEffect, useRef } from 'react';
import { Product, ProductCategory, ProductStatus } from '@/types/pos';
import { useDataStore } from '@/stores/dataStore';
import { useSettingsStore } from '@/stores/settingsStore';
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
import { Loader2, Package, AlertTriangle, DollarSign, Warehouse, Truck, CheckCircle2, Plus, X } from 'lucide-react';

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
  const { categories, addCategory } = useSettingsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [newCategoryInput, setNewCategoryInput] = useState('');

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
        category: product?.category || (categories[0] || ''),
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
      setNewCategoryInput('');
    }
  }, [open, product, fetchLocations, fetchEmployees, categories]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none rounded-[28px] shadow-2xl bg-white">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-3.5 text-xl font-bold tracking-tight text-gray-900">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex flex-col text-left">
              <span>{product ? 'Edit Product' : 'New Product'}</span>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Catalog & Stock Settings</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 p-1.5 bg-gray-100/80 rounded-2xl h-12">
                <TabsTrigger value="general" className="rounded-xl text-xs font-bold gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="financials" className="rounded-xl text-xs font-bold gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Financials</span>
                </TabsTrigger>
                <TabsTrigger value="inventory" className="rounded-xl text-xs font-bold gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  <Warehouse className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Stock</span>
                </TabsTrigger>
                <TabsTrigger value="logistics" className="rounded-xl text-xs font-bold gap-2 py-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                  <Truck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logistics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Designer Jacket"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. JKT-001"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="barcode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 192837465"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card">
                        <SelectValue placeholder="Select or add a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <div className="border-t mt-1 pt-1 px-2 pb-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Add New Category</p>
                          <div className="flex gap-1">
                            <Input
                              value={newCategoryInput}
                              onChange={(e) => setNewCategoryInput(e.target.value)}
                              placeholder="Type category name..."
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (newCategoryInput.trim()) {
                                    addCategory(newCategoryInput.trim());
                                    setFormData({ ...formData, category: newCategoryInput.trim() });
                                    setNewCategoryInput('');
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                if (newCategoryInput.trim()) {
                                  addCategory(newCategoryInput.trim());
                                  setFormData({ ...formData, category: newCategoryInput.trim() });
                                  setNewCategoryInput('');
                                }
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="unit" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Base Unit</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger id="unit" className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card">
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
                  <div className="space-y-1">
                    <Label htmlFor="supplier" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Primary Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="e.g. Global Supplies Ltd"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description, features, materials..."
                    className="rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="financials" className="space-y-6 pt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="costPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Cost Price *</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sellingPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Retail Selling Price *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wholesalePrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Wholesale Price</Label>
                    <Input
                      id="wholesalePrice"
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="taxRate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">VAT / Tax Percentage (%)</Label>
                    <Select
                      value={formData.taxRate.toString()}
                      onValueChange={(value) => setFormData({ ...formData, taxRate: Number(value) })}
                    >
                      <SelectTrigger id="taxRate" className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card">
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
                  <div className="flex items-center justify-between space-x-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 shadow-sm sm:col-span-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="tax-inc" className="text-xs font-bold uppercase tracking-wider text-gray-700">Price Includes Tax</Label>
                      <p className="text-[11px] text-muted-foreground font-medium">
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
                  <div className="space-y-1">
                    <Label htmlFor="quantity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Total Physical Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lowStockThreshold" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Min. Stock Alert Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reserved" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Reserved Quantity</Label>
                    <Input
                      id="reserved"
                      type="number"
                      value={formData.reservedQuantity}
                      onChange={(e) => setFormData({ ...formData, reservedQuantity: Number(e.target.value) })}
                      placeholder="Promised to customers"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bonus" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Free / Bonus Quantity</Label>
                    <Input
                      id="bonus"
                      type="number"
                      value={formData.bonusQuantity}
                      onChange={(e) => setFormData({ ...formData, bonusQuantity: Number(e.target.value) })}
                      placeholder="Sample / Bonus stock"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Warehouse / Storage Location</Label>
                    <Select
                      value={formData.defaultLocationId}
                      onValueChange={(value) => setFormData({ ...formData, defaultLocationId: value })}
                    >
                      <SelectTrigger id="location" className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card">
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
                  <div className="space-y-1">
                    <Label htmlFor="packingUnit" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Packing Type</Label>
                    <Input
                      id="packingUnit"
                      value={formData.packingUnit}
                      onChange={(e) => setFormData({ ...formData, packingUnit: e.target.value })}
                      placeholder="e.g. Box / Carton"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="packingSize" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Packing Level (Qty/Pkg)</Label>
                    <Input
                      id="packingSize"
                      type="number"
                      value={formData.packingSize}
                      onChange={(e) => setFormData({ ...formData, packingSize: Number(e.target.value) })}
                      placeholder="e.g. 12"
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="salesRep" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Assigned Promoter/Sales Rep</Label>
                    <Select
                      value={formData.salesRepId}
                      onValueChange={(value) => setFormData({ ...formData, salesRepId: value })}
                    >
                      <SelectTrigger id="salesRep" className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card">
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
                  <div className="space-y-1">
                    <Label htmlFor="expiry" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Batch Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Product Approval Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as ProductStatus })}
                    >
                      <SelectTrigger id="status" className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card">
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

          <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-12 px-6 rounded-2xl font-bold border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="h-12 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/95 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all min-w-[120px]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />}
              {product ? 'Save Changes' : 'Create Product'}
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
              placeholder=""
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
