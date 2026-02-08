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
  Receipt,
  Printer,
  ChevronUp,
  Tag,
  CircleCheck,
  Zap,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReceiptModal } from '@/components/receipt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSettingsStore } from '@/stores/settingsStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  const [cartOpen, setCartOpen] = useState(false);

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

    // Auto open cart on first item for better UX feedback
    if (cart.length === 0) {
      setCartOpen(true);
    }
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
      setCartOpen(false);
      setCart([]);
      toast({
        title: 'Success!',
        description: 'Order processed successfully.',
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

  const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType; color: string }[] = [
    { id: 'cash', name: 'Cash', icon: Banknote, color: 'text-success' },
    { id: 'card', name: 'Card', icon: CreditCard, color: 'text-info' },
    { id: 'mpesa', name: 'M-Pesa', icon: Smartphone, color: 'text-brand-orange' },
    { id: 'bank-transfer', name: 'Bank Transfer', icon: Building2, color: 'text-primary' },
  ];

  return (
    <MainLayout>
      <PageContent className="h-full overflow-hidden p-0 bg-secondary/20">
        <div className="flex h-full flex-col">
          {/* Header - Neat and clean */}
          <div className="p-4 bg-card border-b border-border shadow-sm relative z-20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow">
                  <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-black tracking-tight">Quick POS</h1>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">{currentUser?.name || 'Cashier'}</p>
                </div>
              </div>

              <div className="relative flex-1 w-full max-w-2xl px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, SKU or barcodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-muted/40 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex bg-muted p-1 rounded-2xl border border-border shadow-sm shrink-0">
                <button
                  onClick={() => setPriceType('retail')}
                  className={cn(
                    'px-6 py-2 rounded-xl text-xs font-bold transition-all',
                    priceType === 'retail' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Retail
                </button>
                <button
                  onClick={() => setPriceType('wholesale')}
                  className={cn(
                    'px-6 py-2 rounded-xl text-xs font-bold transition-all',
                    priceType === 'wholesale' ? 'bg-card text-brand-orange shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Wholesale
                </button>
              </div>
            </div>
          </div>

          {/* Subheader: Categories */}
          <div className="px-4 py-3 bg-card border-b border-border overflow-x-auto no-scrollbar flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "h-8 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    selectedCategory === cat.id
                      ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid - Full Width for neatness */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'group flex flex-col p-0 rounded-3xl border-2 border-transparent bg-card text-left transition-all duration-300 hover:shadow-2xl hover:border-primary/40 relative overflow-hidden',
                    Number(product.quantity) <= 0 && 'opacity-60 grayscale cursor-not-allowed'
                  )}
                  disabled={Number(product.quantity) <= 0}
                >
                  <div className="aspect-square bg-muted/30 flex items-center justify-center p-6 relative">
                    <Package className="h-10 w-10 text-muted-foreground group-hover:scale-110 group-hover:text-primary transition-all" />
                    {Number(product.quantity) <= Number(product.lowStockThreshold) && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="destructive" className="h-5 rounded-full px-2 text-[8px] font-black uppercase">Low</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-foreground text-sm leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono mb-4">{product.sku}</p>

                    <div className="mt-auto space-y-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-bold">RETAIL</span>
                          <span className="text-sm font-black text-primary">{formatCurrency(Number(product.sellingPrice))}</span>
                        </div>
                        {product.wholesalePrice && (
                          <div className="flex items-center justify-between opacity-70">
                            <span className="text-[10px] text-muted-foreground font-bold">WHOLESALE</span>
                            <span className="text-sm font-black text-brand-orange">{formatCurrency(Number(product.wholesalePrice))}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-muted-foreground/60 border-t border-border/50 pt-2">
                        <Zap className="h-3 w-3" />
                        <span>{Number(product.quantity)} available</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="h-20 w-20 mb-4 opacity-10" />
                <p className="text-lg font-bold">No products matching your search</p>
              </div>
            )}
          </div>

          {/* Floating Cart Indicator - Appears when items are selected */}
          {cart.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Button
                onClick={() => setCartOpen(true)}
                className="h-16 px-8 rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_rgba(var(--primary),0.3)] hover:scale-105 active:scale-95 transition-all gap-4 ring-4 ring-background"
              >
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-brand-orange text-white border-2 border-primary rounded-full text-[10px] font-black">
                    {cartItemsCount}
                  </Badge>
                </div>
                <div className="h-6 w-px bg-primary-foreground/20" />
                <div className="text-left">
                  <p className="text-[10px] font-bold opacity-70 leading-none uppercase tracking-widest">View Cart</p>
                  <p className="text-xl font-black leading-none">{formatCurrency(total)}</p>
                </div>
                <ChevronRight className="h-5 w-5 opacity-70" />
              </Button>
            </div>
          )}
        </div>

        {/* Cart Drawer (Sheet) - Neat and organized */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-card border-none shadow-2xl rounded-l-[32px] overflow-hidden flex flex-col">
            <div className="p-8 pb-4 border-b border-border bg-muted/10">
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-black tracking-tighter">Your Order</SheetTitle>
                  <button onClick={() => { setCart([]); setCartOpen(false) }} className="text-xs text-destructive font-black uppercase tracking-wider hover:opacity-70 transition-opacity">
                    Clear All
                  </button>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.product.id} className="group p-4 rounded-3xl bg-secondary/30 border border-transparent hover:border-primary/20 hover:bg-card hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <p className="font-bold text-base truncate tracking-tight">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(getCartItemPrice(item))} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-black text-primary text-base">
                      {formatCurrency(getCartItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-muted rounded-2xl border border-border p-1 shadow-inner">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-card hover:shadow-sm rounded-xl transition-all"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-8 w-8 flex items-center justify-center hover:bg-card hover:shadow-sm rounded-xl transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-10 w-10 flex items-center justify-center text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-full transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-card border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground font-semibold text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold text-sm">
                  <span>VAT ({business.vatRate}%)</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-lg font-bold tracking-tight">Total Amount</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full h-16 rounded-[24px] text-lg font-black btn-brand-orange shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 gap-3"
                onClick={() => setCheckoutMode(true)}
              >
                <CreditCard className="h-6 w-6" />
                Checkout Now
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={checkoutMode} onOpenChange={setCheckoutMode}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
            <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-3xl font-black tracking-tight mb-2 uppercase">Payment</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold">Select how the customer is paying</DialogDescription>
              </DialogHeader>
              <div className="mt-8 mb-2 relative z-10">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black opacity-60 mb-1">Total Due</p>
                <h3 className="text-6xl font-black tracking-tighter">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-8 bg-card">
              <div className="grid grid-cols-2 gap-4 mb-8">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all duration-300 relative",
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5 shadow-inner scale-105"
                        : "border-muted/50 bg-muted/10 hover:border-primary/20 hover:bg-muted/30"
                    )}
                  >
                    <method.icon className={cn("h-8 w-8 mb-3", method.color)} />
                    <span className="font-black text-xs uppercase tracking-wider">{method.name}</span>
                    {selectedPayment === method.id && (
                      <div className="absolute -top-2 -right-2">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <Check className="h-4 w-4 stroke-[4px]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Button
                  className="w-full h-16 rounded-[20px] text-lg font-black btn-brand-orange shadow-xl hover:scale-[1.02] active:scale-95"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 animate-pulse" />
                      Processing...
                    </div>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                <button
                  className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                  onClick={() => setCheckoutMode(false)}
                >
                  Back to Bag
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
