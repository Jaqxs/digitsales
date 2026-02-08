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
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  Receipt,
  Printer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReceiptModal } from '@/components/receipt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      { id: 'all', name: 'All Products' },
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

    // Auto-open drawer on first item for feedback
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

  const paymentMethods = [
    { id: 'cash' as PaymentMethod, name: 'Cash', icon: Banknote },
    { id: 'card' as PaymentMethod, name: 'Card', icon: CreditCard },
    { id: 'mpesa' as PaymentMethod, name: 'M-Pesa', icon: Smartphone },
    { id: 'bank-transfer' as PaymentMethod, name: 'Bank', icon: Building2 },
  ];

  return (
    <MainLayout>
      <PageContent className="h-full overflow-hidden p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header Area */}
          <div className="bg-card border-b border-border shadow-sm px-6 py-4 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow">
                  <ShoppingBag className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Checkout</h1>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">
                    Authorized Cashier: {currentUser?.name || 'Staff'}
                  </p>
                </div>
              </div>

              <div className="relative flex-1 w-full max-w-xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search products, SKU or barcodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-muted/40 border-none rounded-2xl shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div className="flex bg-muted p-1 rounded-2xl border border-border shadow-sm shrink-0">
                <button
                  onClick={() => setPriceType('retail')}
                  className={cn(
                    'px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                    priceType === 'retail' ? 'bg-card text-primary shadow-sm scale-100' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Tag className="h-3 w-3" />
                  Retail
                </button>
                <button
                  onClick={() => setPriceType('wholesale')}
                  className={cn(
                    'px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                    priceType === 'wholesale' ? 'bg-card text-accent shadow-sm scale-100' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Zap className="h-3 w-3" />
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
                    "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-glow-sm"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid - Full Width for Neatness */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-[2000px] mx-auto">
              {filteredProducts.map((product) => {
                const price = priceType === 'wholesale' && product.wholesalePrice
                  ? Number(product.wholesalePrice)
                  : Number(product.sellingPrice);

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'group flex flex-col p-1 rounded-[24px] bg-card border border-border/60 text-left transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 relative overflow-hidden',
                      Number(product.quantity) <= 0 && 'opacity-60 cursor-not-allowed grayscale'
                    )}
                    disabled={Number(product.quantity) <= 0}
                  >
                    <div className="aspect-[1/1] rounded-[20px] bg-muted/30 flex items-center justify-center p-6 relative overflow-hidden">
                      <Package className="h-10 w-10 text-muted-foreground/40 group-hover:scale-110 group-hover:text-primary/60 transition-all duration-500" />
                      {Number(product.quantity) <= Number(product.lowStockThreshold) && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="destructive" className="h-5 px-1.5 text-[8px] font-black uppercase ring-2 ring-background">LOW STOCK</Badge>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 text-[10px] font-bold text-muted-foreground/60">
                        {Number(product.quantity)} In Stock
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono mb-4 uppercase tracking-tighter">{product.sku}</p>

                      <div className="mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none mb-1">
                            {priceType === 'wholesale' && product.wholesalePrice ? 'Wholesale Price' : 'Unit Price'}
                          </span>
                          <span className={cn(
                            "text-xl font-black tracking-tighter leading-tight",
                            priceType === 'wholesale' && product.wholesalePrice ? "text-accent" : "text-primary"
                          )}>
                            {formatCurrency(price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Package className="h-20 w-20 text-muted-foreground/10 mb-4" />
                <p className="text-muted-foreground font-bold">No products matching your search.</p>
              </div>
            )}
          </div>

          {/* Large Floating Cart reviewing Button - Appearing after selection */}
          {cart.length > 0 && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <button
                onClick={() => setCartOpen(true)}
                className="h-[72px] px-10 rounded-full bg-primary text-primary-foreground shadow-[0_20px_50px_rgba(20,53,124,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-6 ring-4 ring-background"
              >
                <div className="relative">
                  <ShoppingCart className="h-7 w-7" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-white border-2 border-primary rounded-full text-[10px] font-black">
                    {cartItemsCount}
                  </Badge>
                </div>
                <div className="h-8 w-px bg-primary-foreground/20 hidden md:block" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Checkout Order</span>
                  <span className="text-2xl font-black tracking-tighter">{formatCurrency(total)}</span>
                </div>
                <ChevronRight className="h-5 w-5 opacity-50" />
              </button>
            </div>
          )}
        </div>

        {/* Clean Proper Cart Sheet */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-card flex flex-col border-none shadow-2xl rounded-l-[40px] overflow-hidden">
            <div className="p-8 pb-4 border-b border-border bg-muted/10">
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-black tracking-tighter">Your Bag</SheetTitle>
                  <button onClick={() => { setCart([]); setCartOpen(false) }} className="text-[10px] text-destructive font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
                    Clear Order
                  </button>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.product.id} className="group p-4 rounded-3xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <p className="font-bold text-base tracking-tight leading-tight mb-1">{item.product.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {formatCurrency(getCartItemPrice(item))} per {item.product.unit || 'unit'}
                      </p>
                    </div>
                    <p className="font-black text-primary text-base pt-1">
                      {formatCurrency(getCartItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-muted/50 rounded-2xl p-1 border border-border/30">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-9 w-9 flex items-center justify-center hover:bg-card hover:shadow-sm rounded-xl transition-all"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-9 w-9 flex items-center justify-center hover:bg-card hover:shadow-sm rounded-xl transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] font-black text-muted-foreground/40 hover:text-destructive uppercase tracking-widest transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 md:p-10 bg-card border-t border-border shadow-[0_-10px_50px_rgba(0,0,0,0.05)] space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                  <span>VAT ({business.vatRate}%)</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Grand Total</span>
                    <span className="text-4xl font-black text-primary tracking-tighter leading-none">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-16 rounded-[24px] text-lg font-black btn-brand-orange shadow-xl hover:scale-[1.02] active:scale-95 gap-3"
                onClick={() => setCheckoutMode(true)}
              >
                <CreditCard className="h-6 w-6" />
                Continue to Pay
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Proper Design Payment Modal */}
        <Dialog open={checkoutMode} onOpenChange={setCheckoutMode}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none rounded-[40px] shadow-2xl">
            <div className="bg-primary p-10 text-primary-foreground text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-3xl font-black tracking-tight mb-2 uppercase italic">Finalize Sale</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold uppercase text-[10px] tracking-widest">Select payment method below</DialogDescription>
              </DialogHeader>
              <div className="mt-10 mb-4 relative z-10">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-50 mb-2">Total Amount Due</p>
                <h3 className="text-7xl font-black tracking-tighter italic">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-10 bg-card">
              <div className="grid grid-cols-2 gap-4 mb-10">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-[32px] border-2 transition-all duration-300 relative group",
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5 shadow-inner scale-100 shadow-primary/5"
                        : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-all",
                      selectedPayment === method.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
                      <method.icon className="h-6 w-6" />
                    </div>
                    <span className="font-black text-[11px] uppercase tracking-widest leading-none">{method.name}</span>
                    {selectedPayment === method.id && (
                      <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                          <Check className="h-3 w-3 stroke-[5px]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Button
                  className="w-full h-16 rounded-[24px] text-xl font-black btn-brand-orange shadow-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em]"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Syncing...</span>
                    </div>
                  ) : (
                    "Confirm & Pay"
                  )}
                </Button>
                <button
                  className="w-full text-center text-[10px] font-black text-muted-foreground/60 hover:text-foreground transition-colors uppercase tracking-[0.4em]"
                  onClick={() => setCheckoutMode(false)}
                >
                  Return to bag
                </button>
              </div>
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
