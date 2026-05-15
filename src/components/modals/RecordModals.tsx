import { useState } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, calculateVAT } from '@/lib/pos-utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, ShoppingCart } from 'lucide-react';
import { Product } from '@/types/pos';

interface RecordSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { useSettingsStore } from '@/stores/settingsStore';

export function RecordSaleModal({ open, onOpenChange }: RecordSaleModalProps) {
  const { products, addSale } = useDataStore();
  const { user: currentUser } = useAuth();
  const { business } = useSettingsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mpesa' | 'bank-transfer'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');

  const product = products.find(p => p.id === selectedProduct);
  const unitPrice = product ? (priceType === 'wholesale' && product.wholesalePrice ? product.wholesalePrice : product.sellingPrice) : 0;
  const subtotal = unitPrice * quantity;
  const vatRate = business.vatRate / 100;
  const vat = subtotal * vatRate;
  const total = subtotal + vat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || quantity < 1) {
      toast({
        title: 'Invalid sale',
        description: 'Please select a product and quantity.',
        variant: 'destructive',
      });
      return;
    }

    if (!product) return;

    if (quantity > product.quantity) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${product.quantity} ${product.unit} available.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    await addSale({
      items: [{
        productId: product.id,
        quantity,
        unitPrice: unitPrice,
        discountAmount: 0,
        taxAmount: calculateVAT(unitPrice * quantity),
        lineTotal: (unitPrice * quantity) + calculateVAT(unitPrice * quantity)
      }] as any,
      subtotal: Number(subtotal),
      discountAmount: 0,
      taxAmount: Number(vat),
      totalAmount: Number(total),
      paymentMethod: paymentMethod === 'bank-transfer' ? 'bank_transfer' : paymentMethod,
      customerId: null,
      notes: customerName ? `Customer: ${customerName}` : 'Walk-in Customer',
      employeeId: currentUser?.id || undefined,
      status: 'awaiting_delivery',
    } as any);

    toast({
      title: 'Sale recorded',
      description: `${quantity}x ${product.name} - ${formatCurrency(total)}`,
    });

    setIsSubmitting(false);
    setSelectedProduct('');
    setQuantity(1);
    setCustomerName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Record Quick Sale
          </DialogTitle>
          <DialogDescription>
            Record a sale without using the POS interface
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.filter(p => p.quantity > 0).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span>{p.name} ({p.quantity} available)</span>
                      <span className="text-[10px] text-muted-foreground">
                        Retail: {formatCurrency(p.sellingPrice)}
                        {p.wholesalePrice ? ` | Wholesale: ${formatCurrency(p.wholesalePrice)}` : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select value={priceType} onValueChange={(v: any) => setPriceType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail Price</SelectItem>
                  <SelectItem value="wholesale">Wholesale Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                max={product?.quantity || 999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name (Optional)</Label>
            <Input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
            />
          </div>

          {product && (
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({business.vatRate}%):</span>
                <span>{formatCurrency(vat)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedProduct}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RecordInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordInventoryModal({ open, onOpenChange }: RecordInventoryModalProps) {
  const { products, updateStock, addStockRecord } = useDataStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState<'in' | 'out'>('in');
  const [reason, setReason] = useState('');

  const product = products.find(p => p.id === selectedProduct);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || quantity < 1) {
      toast({
        title: 'Invalid entry',
        description: 'Please select a product and enter quantity.',
        variant: 'destructive',
      });
      return;
    }

    if (!product) return;

    const change = type === 'out' ? -quantity : quantity;
    const newStock = product.quantity + change;

    if (newStock < 0) {
      toast({
        title: 'Insufficient stock',
        description: `Cannot remove ${quantity} units. Only ${product.quantity} available.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addStockRecord({
        productId: product.id,
        productName: product.name,
        type: type,
        quantity,
        previousStock: product.quantity,
        newStock,
        reason: reason || `Stock ${type}`,
        createdBy: 'Current User',
      });

      toast({
        title: 'Inventory updated',
        description: `${product.name}: ${product.quantity} → ${newStock} ${product.unit}`,
      });

      setSelectedProduct('');
      setQuantity(0);
      setReason('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error updating inventory',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Record Inventory Movement
          </DialogTitle>
          <DialogDescription>
            Record stock in or stock out for any product
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (Current: {p.quantity} {p.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: 'in' | 'out') => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (Received)</SelectItem>
                  <SelectItem value="out">Stock Out (Used/Damaged)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Notes</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New shipment from supplier"
            />
          </div>

          {product && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="font-medium">{product.quantity} {product.unit}</span>
              </div>
              {quantity > 0 && (
                <div className="flex justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground">New Stock:</span>
                  <span className={`font-bold ${type === 'in' ? 'text-success' : 'text-destructive'}`}>
                    {type === 'in' ? product.quantity + quantity : product.quantity - quantity} {product.unit}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedProduct || quantity < 1}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Movement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RecordExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { Receipt, Calendar, Info, DollarSign } from 'lucide-react';

export function RecordExpenseModal({ open, onOpenChange }: RecordExpenseModalProps) {
  const { addExpense } = useDataStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<any>('others');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !amount || Number(amount) <= 0) {
      toast({
        title: 'Invalid expense',
        description: 'Please provide a title and a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        title,
        amount: Number(amount),
        category,
        date: new Date(date),
        description,
      });

      toast({
        title: 'Expense recorded',
        description: `${title}: ${formatCurrency(Number(amount))}`,
      });

      setTitle('');
      setAmount('');
      setCategory('others');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error recording expense',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            Record Expense
          </DialogTitle>
          <DialogDescription>
            Record business costs and operational expenses
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title / Purpose *</Label>
            <div className="relative">
              <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Shop Rent - May"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent & Lease</SelectItem>
                <SelectItem value="utilities">Utilities (Water/Elec)</SelectItem>
                <SelectItem value="salaries">Salaries & Wages</SelectItem>
                <SelectItem value="supplies">Office Supplies</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="taxes">Taxes & Fees</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
