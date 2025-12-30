import { useState } from 'react';
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
  const { business } = useSettingsStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mpesa' | 'bank-transfer'>('cash');
  const [customerName, setCustomerName] = useState('');

  const product = products.find(p => p.id === selectedProduct);
  const subtotal = product ? product.sellingPrice * quantity : 0;
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

    addSale({
      items: [{ product, quantity, discount: 0 }],
      subtotal,
      discount: 0,
      vat,
      total,
      paymentMethod,
      customerId: undefined, // Or selected customer ID if we had a dropdown
      customerName: customerName || 'Walk-in Customer',
      employeeId: '1',
      status: 'completed',
    });

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
                    {p.name} ({p.quantity} available) - {formatCurrency(p.sellingPrice)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
    await new Promise(resolve => setTimeout(resolve, 300));

    updateStock(product.id, change);
    addStockRecord({
      productId: product.id,
      productName: product.name,
      type,
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

    setIsSubmitting(false);
    setSelectedProduct('');
    setQuantity(0);
    setReason('');
    onOpenChange(false);
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
