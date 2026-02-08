import { useState, useMemo, useEffect } from 'react';
import { MainLayout, PageContent } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/stores/dataStore';
import { useSettingsStore } from '@/stores/settingsStore';
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

const PointOfSale = () => {
  const { products, addSale, fetchProducts } = useDataStore();
  const { user: currentUser } = useAuth();
  const { business } = useSettingsStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [showCart, setShowCart] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return [
      { id: 'all', name: 'All' },
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
    { id: 'bank-transfer', name: 'Bank', icon: Building2, color: 'text-primary' },
  ];

  return (
    <MainLayout>
      <PageContent className="h-[calc(100vh-0px)] overflow-hidden p-0 bg-secondary/30">
        <div className="flex h-full flex-col lg:flex-row">
          {/* Main POS Section */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header / Search */}
            <div className="p-4 bg-card border-b border-border space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">New Sale</h1>
                    <p className="text-xs text-muted-foreground">{currentUser?.name || 'Cashier'}</p>
                  </div>
                </div>

                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, SKU or scan barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-muted/30 border-none shadow-inner"
                  />
                </div>

                <div className="flex bg-muted p-1 rounded-xl border border-border shadow-sm">
                  <button
                    onClick={() => setPriceType('retail')}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      priceType === 'retail' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Retail
                  </button>
                  <button
                    onClick={() => setPriceType('wholesale')}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      priceType === 'wholesale' ? 'bg-card text-brand-orange shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Wholesale
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "h-9 px-4 rounded-lg whitespace-nowrap transition-all",
                      selectedCategory === cat.id ? "bg-primary text-primary-foreground shadow-glow-sm" : "hover:bg-muted"
                    )}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24 lg:pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'group flex flex-col p-0 rounded-2xl border border-border bg-card text-left transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 relative overflow-hidden',
                      Number(product.quantity) <= 0 && 'opacity-60 cursor-not-allowed grayscale'
                    )}
                    disabled={Number(product.quantity) <= 0}
                  >
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-active:scale-95">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono mb-3">{product.sku}</p>

                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-muted/50 group-hover:bg-primary/5 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Retail</span>
                            <span className="text-sm font-bold text-primary">{formatCurrency(Number(product.sellingPrice))}</span>
                          </div>
                          {product.wholesalePrice && (
                            <div className="flex flex-col items-end border-l border-muted/50 pl-2">
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Wholesale</span>
                              <span className="text-sm font-bold text-brand-orange">{formatCurrency(Number(product.wholesalePrice))}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={Number(product.quantity) <= Number(product.lowStockThreshold) ? 'destructive' : 'secondary'}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {Number(product.quantity)} in stock
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Cart */}
          <div className="hidden lg:flex w-[400px] flex-col bg-card border-l border-border shadow-2xl relative z-10">
            <div className="p-6 border-b border-border bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight">Current Sale</h2>
                </div>
                {cart.length > 0 && (
                  <Badge variant="outline" className="h-6 rounded-full px-3 bg-secondary/50 font-bold border-primary/20">
                    {cartItemsCount}
                  </Badge>
                )}
              </div>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-[10px] text-destructive hover:underline font-semibold uppercase tracking-wider">
                  Discard Order
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-in">
                  <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4 border-2 border-dashed border-muted">
                    <ShoppingCart className="h-10 w-10 opacity-30" />
                  </div>
                  <p className="font-semibold text-foreground">Cart is empty</p>
                  <p className="text-xs max-w-[200px] text-center mt-2 opacity-70">Tap a product from the left to start processing a new sale.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="group p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-card hover:shadow-sm transition-all animate-in">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate leading-tight">{item.product.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatCurrency(getCartItemPrice(item))} per {item.product.unit || 'unit'}
                        </p>
                      </div>
                      <p className="font-bold text-primary text-sm shrink-0">
                        {formatCurrency(getCartItemPrice(item) * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-card rounded-xl border border-border p-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-destructive/60 hover:text-destructive p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-card border-t border-border space-y-4">
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>VAT ({business.vatRate}%)</span>
                  <span className="font-medium">{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-border">
                  <span className="tracking-tight">Grand Total</span>
                  <span className="text-primary tracking-tighter">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full h-14 rounded-2xl text-base font-bold btn-brand-orange shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all hover:scale-[1.02] active:scale-95 gap-3"
                  disabled={cart.length === 0}
                  onClick={() => setCheckoutMode(true)}
                >
                  <CreditCard className="h-6 w-6" />
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            className={cn(
              "h-16 w-16 rounded-full shadow-2xl transition-all scale-110",
              cart.length > 0 ? "btn-brand-orange" : "bg-card border border-border text-foreground"
            )}
            onClick={() => setShowCart(!showCart)}
          >
            {showCart ? <X className="h-7 w-7" /> : <ShoppingCart className="h-7 w-7" />}
            {cart.length > 0 && !showCart && (
              <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-primary text-white font-bold border-2 border-white">
                {cartItemsCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile Sidebar overlay */}
        <div className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          showCart ? "opacity-100" : "opacity-0 pointer-events-none"
        )} onClick={() => setShowCart(false)} />

        <div className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[32px] p-6 transition-transform duration-300 ease-out shadow-[-10px_0_30px_rgba(0,0,0,0.2)]",
          showCart ? "translate-y-0" : "translate-y-full"
        )}>
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Active Order
          </h2>

          <div className="max-h-[50vh] overflow-y-auto mb-6 space-y-3 pr-2">
            {cart.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground italic">Your cart is feeling lonely...</p>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-primary font-bold">{formatCurrency(getCartItemPrice(item) * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                    <span className="font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-2xl font-black">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full h-16 rounded-2xl text-lg font-bold btn-brand-orange shadow-xl"
              disabled={cart.length === 0}
              onClick={() => {
                setCheckoutMode(true);
                setShowCart(false);
              }}
            >
              Checkout Now
            </Button>
          </div>
        </div>

        {/* Checkout / Payment Modal */}
        <Dialog open={checkoutMode} onOpenChange={setCheckoutMode}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
            <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-3xl font-black tracking-tight mb-2">Final Step</DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">Select a payment method to complete the transaction.</DialogDescription>
              </DialogHeader>
              <div className="mt-8 mb-2 relative z-10">
                <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-70 mb-1">Total Payable</p>
                <h3 className="text-5xl font-black tracking-tighter">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-8 bg-card">
              <div className="grid grid-cols-2 gap-4 mb-8">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all duration-200 relative",
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-muted-foreground/10 bg-muted/10 hover:border-primary/30 hover:bg-muted/20"
                    )}
                  >
                    <method.icon className={cn("h-8 w-8 mb-3", method.color)} />
                    <span className="font-bold text-sm">{method.name}</span>
                    {selectedPayment === method.id && (
                      <div className="absolute top-2 right-2 text-primary">
                        <CircleCheck className="h-5 w-5 fill-primary text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full h-16 rounded-2xl text-lg font-bold btn-brand-orange shadow-xl glow"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : `Complete ${selectedPayment.replace('-', ' ')} Payment`}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground font-semibold"
                  onClick={() => setCheckoutMode(false)}
                >
                  Go back to order
                </Button>
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
