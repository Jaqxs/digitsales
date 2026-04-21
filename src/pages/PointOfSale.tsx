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
          <div className="bg-card border-b border-border shadow-sm px-4 py-2 flex flex-col gap-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-foreground tracking-tight">POS</h1>
                </div>
              </div>

              <div className="relative flex-1 w-full max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/40 border-none rounded-xl text-xs"
                />
              </div>

              <div className="flex bg-muted p-1 rounded-xl border border-border shadow-sm shrink-0">
                <button
                  onClick={() => setPriceType('retail')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5',
                    priceType === 'retail' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  Retail
                </button>
                <button
                  onClick={() => setPriceType('wholesale')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5',
                    priceType === 'wholesale' ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground'
                  )}
                >
                  Wholesale
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 max-w-[2000px] mx-auto">
              {filteredProducts.map((product) => {
                const price = priceType === 'wholesale' && product.wholesalePrice
                  ? Number(product.wholesalePrice)
                  : Number(product.sellingPrice);

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'group flex flex-col p-2 rounded-xl bg-card border border-border/60 text-left transition-all hover:shadow-md hover:border-primary/40',
                      Number(product.quantity) <= 0 && 'opacity-60 cursor-not-allowed grayscale'
                    )}
                    disabled={Number(product.quantity) <= 0}
                  >
                    <div className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center p-4 relative mb-2">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                      <div className="absolute bottom-1 right-1 text-[8px] font-bold text-muted-foreground/50">
                        {Number(product.quantity)}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                      <h3 className="font-bold text-[11px] leading-tight mb-1 line-clamp-2 min-h-[2.5em]">
                        {product.name}
                      </h3>
                      <div className="mt-auto pt-1">
                        <span className={cn(
                          "text-xs font-black tracking-tight",
                          priceType === 'wholesale' && product.wholesalePrice ? "text-accent" : "text-primary"
                        )}>
                          {formatCurrency(price)}
                        </span>
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
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => setCartOpen(true)}
                className="h-14 px-6 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-4 ring-4 ring-background"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center bg-accent text-white border-2 border-primary rounded-full text-[8px] font-black">
                    {cartItemsCount}
                  </Badge>
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[14px] font-black tracking-tight">{formatCurrency(total)}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Clean Proper Cart Sheet */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-card flex flex-col border-none shadow-2xl rounded-l-[40px] overflow-hidden">
            <div className="p-6 pb-2 border-b border-border bg-muted/5">
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-black tracking-tight">Order</SheetTitle>
                  <button onClick={() => { setCart([]); setCartOpen(false) }} className="text-[9px] text-destructive font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
                    Clear
                  </button>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.product.id} className="group p-3 rounded-2xl bg-background border border-border/50 hover:border-primary/20 transition-all">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[13px] tracking-tight leading-tight mb-0.5 line-clamp-1">{item.product.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {formatCurrency(getCartItemPrice(item))}
                      </p>
                    </div>
                    <p className="font-black text-primary text-[13px]">
                      {formatCurrency(getCartItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center bg-muted/50 rounded-xl p-0.5 border border-border/30">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-7 w-7 flex items-center justify-center hover:bg-card hover:shadow-sm rounded-lg transition-all"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-7 w-7 flex items-center justify-center hover:bg-card hover:shadow-sm rounded-lg transition-all"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[9px] font-black text-muted-foreground/40 hover:text-destructive uppercase tracking-widest transition-colors"
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
            <div className="bg-primary p-6 text-primary-foreground text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-xl font-black tracking-tight mb-1 uppercase">Payment</DialogTitle>
              </DialogHeader>
              <div className="mt-4 mb-2 relative z-10">
                <p className="text-[8px] uppercase tracking-[0.3em] font-black opacity-50 mb-1">Total Due</p>
                <h3 className="text-4xl font-black tracking-tighter italic">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-6 bg-card">
              <div className="grid grid-cols-2 gap-2 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative group",
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2 transition-all",
                      selectedPayment === method.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                      <method.icon className="h-4 w-4" />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-wider">{method.name}</span>
                    {selectedPayment === method.id && (
                      <div className="absolute top-2 right-2">
                        <div className="h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="h-2 w-2 stroke-[4px]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-12 rounded-xl text-sm font-black btn-brand-orange shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Complete Sale"}
                </Button>
                <button
                  className="w-full text-center text-[9px] font-black text-muted-foreground/60 hover:text-foreground transition-colors uppercase tracking-[0.2em]"
                  onClick={() => setCheckoutMode(false)}
                >
                  Back to Order
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
