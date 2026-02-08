import { useState, useMemo, useEffect } from 'react';
import { MainLayout, PageContent } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/stores/dataStore';
import { Product, CartItem, PaymentMethod, Sale } from '@/types/pos';
import { formatCurrency, calculateVAT } from '@/lib/pos-utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  ShoppingCart,
  Package,
  X,
  Check,
  Zap,
  Tag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReceiptModal } from '@/components/receipt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSettingsStore } from '@/stores/settingsStore';

const PointOfSale = () => {
  const { products, addSale, fetchProducts } = useDataStore();
  const { user: currentUser } = useAuth();
  const { business } = useSettingsStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return [
      { id: 'all', name: 'All Categories' },
      ...uniqueCats.map(cat => ({ id: cat, name: cat }))
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const currentProduct = products.find(p => p.id === product.id);
        if (!currentProduct || existing.quantity >= Number(currentProduct.quantity)) {
          toast({
            title: 'Stock limit reached',
            description: `Only ${currentProduct?.quantity || 0} units available`,
            variant: 'destructive',
          });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const currentProduct = products.find(p => p.id === productId);
            const newQty = item.quantity + delta;
            if (currentProduct && newQty > Number(currentProduct.quantity)) {
              toast({
                title: 'Stock limit',
                description: `Only ${currentProduct.quantity} units available`,
                variant: 'destructive',
              });
              return item;
            }
            return { ...item, quantity: Math.max(0, newQty) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const getCartItemPrice = (item: CartItem) => {
    return priceType === 'wholesale' && item.product.wholesalePrice
      ? Number(item.product.wholesalePrice)
      : Number(item.product.sellingPrice);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + getCartItemPrice(item) * item.quantity,
    0
  );
  const vat = calculateVAT(subtotal);
  const total = subtotal + vat;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const saleData = {
        employeeId: currentUser?.id,
        customerId: null,
        subtotal: Number(subtotal),
        discountAmount: 0,
        taxAmount: Number(vat),
        totalAmount: Number(total),
        paymentMethod: (selectedPayment === 'bank-transfer' ? 'bank_transfer' : selectedPayment) as PaymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: getCartItemPrice(item),
          discountAmount: 0,
          taxAmount: calculateVAT(getCartItemPrice(item) * item.quantity),
          lineTotal: (getCartItemPrice(item) * item.quantity) + calculateVAT(getCartItemPrice(item) * item.quantity)
        })),
      } as any;

      const completedSale = await addSale(saleData);
      setLastSale(completedSale);
      setReceiptOpen(true);
      setCheckoutMode(false);
      setCart([]);
      toast({
        title: 'Success!',
        description: 'Sale processed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Sale failed',
        description: error.message || 'Error processing sale',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType }[] = [
    { id: 'cash', name: 'Cash', icon: Banknote },
    { id: 'card', name: 'Card', icon: CreditCard },
    { id: 'mpesa', name: 'M-Pesa', icon: Smartphone },
    { id: 'bank-transfer', name: 'Bank', icon: Building2 },
  ];

  return (
    <MainLayout>
      <PageContent className="h-full overflow-hidden p-0 bg-background flex">
        {/* Left Side: Products */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Header */}
          <div className="p-4 bg-card border-b border-border shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Point of Sale</h1>
                  <p className="text-xs text-muted-foreground">{business.name}</p>
                </div>
              </div>

              <div className="relative flex-1 w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-lg"
                />
              </div>

              <div className="flex bg-muted p-1 rounded-lg border border-border">
                <button
                  onClick={() => setPriceType('retail')}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-bold transition-all',
                    priceType === 'retail' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  Retail
                </button>
                <button
                  onClick={() => setPriceType('wholesale')}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-xs font-bold transition-all',
                    priceType === 'wholesale' ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  Wholesale
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const price = priceType === 'wholesale' && product.wholesalePrice
                  ? Number(product.wholesalePrice)
                  : Number(product.sellingPrice);

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all text-left group',
                      Number(product.quantity) <= 0 && 'opacity-60 cursor-not-allowed grayscale'
                    )}
                    disabled={Number(product.quantity) <= 0}
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center p-4 relative">
                      <Package className="h-10 w-10 text-muted-foreground/50 group-hover:scale-110 transition-transform" />
                      {Number(product.quantity) <= Number(product.lowStockThreshold) && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="px-1.5 py-0 text-[10px] uppercase font-bold">Low</Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{product.sku}</p>
                      </div>

                      <div className="mt-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                            {priceType === 'retail' ? 'Retail' : 'Wholesale'}
                          </span>
                          <span className={cn(
                            "text-lg font-black tracking-tight",
                            priceType === 'wholesale' ? "text-accent" : "text-primary"
                          )}>
                            {formatCurrency(price)}
                          </span>
                        </div>
                        <p className="text-[10px] mt-1 font-bold text-muted-foreground">{Number(product.quantity)} in stock</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Cart Sidebar (desktop) */}
        <div className="hidden lg:flex w-[350px] flex-col bg-card shadow-xl z-10">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Current Sale</h2>
            </div>
            {cart.length > 0 && (
              <Badge variant="outline" className="rounded-full px-2 font-bold border-primary/20 text-primary">
                {cartItemsCount}
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <ShoppingCart className="h-12 w-12 mb-4" />
                <p className="text-sm font-medium">Your cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="p-3 rounded-lg border border-border bg-background hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate leading-tight">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCurrency(getCartItemPrice(item))} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-primary text-sm shrink-0">
                      {formatCurrency(getCartItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-muted rounded-md border border-border p-0.5">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="h-6 w-6 flex items-center justify-center hover:bg-card rounded transition-colors"><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="h-6 w-6 flex items-center justify-center hover:bg-card rounded transition-colors"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-muted/10 border-t border-border space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <span>VAT ({business.vatRate}%)</span>
                <span>{formatCurrency(vat)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-border">
                <span className="tracking-tight text-foreground">Total</span>
                <span className="text-primary tracking-tighter">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base font-bold btn-brand-orange shadow-lg gap-2"
              disabled={cart.length === 0}
              onClick={() => setCheckoutMode(true)}
            >
              <CreditCard className="h-5 w-5" />
              Pay Now
            </Button>
          </div>
        </div>

        {/* Mobile Cart Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <Button className="h-14 w-14 rounded-full shadow-2xl btn-brand-orange relative" onClick={() => setShowMobileCart(true)}>
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-white text-[10px] font-bold border-2 border-white flex items-center justify-center">
                {cartItemsCount}
              </div>
            )}
          </Button>
        </div>

        {/* Mobile Cart Overlay */}
        <Dialog open={showMobileCart} onOpenChange={setShowMobileCart}>
          <DialogContent className="sm:max-w-[400px] p-0 flex flex-col h-[80vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <DialogTitle className="font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Cart
              </DialogTitle>
              <button onClick={() => setShowMobileCart(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-primary font-bold">{formatCurrency(getCartItemPrice(item) * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-card space-y-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <Button className="w-full h-12 rounded-xl btn-brand-orange" onClick={() => { setCheckoutMode(true); setShowMobileCart(false); }}>
                Proceed to Checkout
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Modal */}
        <Dialog open={checkoutMode} onOpenChange={setCheckoutMode}>
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
            <div className="bg-primary p-6 text-white text-center">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Select Payment</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Total Due</p>
                <h3 className="text-4xl font-extrabold">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-6 bg-card grid grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all relative overflow-hidden",
                    selectedPayment === method.id
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "border-border bg-background hover:border-primary/30"
                  )}
                >
                  <method.icon className={cn("h-8 w-8 mb-2", selectedPayment === method.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-bold text-xs uppercase tracking-wide">{method.name}</span>
                  {selectedPayment === method.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 bg-muted/20 border-t border-border space-y-3">
              <Button
                className="w-full h-14 rounded-xl text-lg font-bold btn-brand-orange shadow-lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Complete Sale"}
              </Button>
              <button className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest" onClick={() => setCheckoutMode(false)}>
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal */}
        <ReceiptModal
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          sale={lastSale}
          cashierName={currentUser?.name}
        />
      </PageContent>
    </MainLayout>
  );
};

export default PointOfSale;
