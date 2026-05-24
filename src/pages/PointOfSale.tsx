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
  Filter,
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
      <PageContent className="h-full overflow-hidden p-0 bg-[#f8f9fa]">
        <div className="flex flex-col h-full">
          {/* Elegant Top Navigation */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between shrink-0 z-10 relative gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Products</h1>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Store Catalog</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:flex-1 md:max-w-2xl">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 bg-gray-50/80 border-gray-200 rounded-full text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-sm hover:border-gray-300 transition-all w-full"
                />
              </div>

              <div className="flex bg-gray-100/80 p-1 rounded-full border border-gray-200 shrink-0">
                <button
                  onClick={() => setPriceType('retail')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                    priceType === 'retail' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Retail
                </button>
                <button
                  onClick={() => setPriceType('wholesale')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                    priceType === 'wholesale' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Wholesale
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Left Sidebar - Categories (Filters) */}
            <div className="hidden md:flex w-64 lg:w-72 bg-white border-r border-gray-200 flex-col h-full shrink-0 overflow-y-auto custom-scrollbar">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-xs uppercase tracking-[0.15em] text-gray-900">Categories</h2>
                </div>
                <div className="flex flex-col gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "text-left px-4 py-3 rounded-xl text-sm font-medium transition-all group flex items-center justify-between",
                        selectedCategory === cat.id
                          ? "bg-primary/5 text-primary font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      {selectedCategory === cat.id && (
                        <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Categories (Horizontal Scroll) */}
            <div className="md:hidden flex gap-2 overflow-x-auto p-4 bg-white border-b border-gray-200 no-scrollbar shrink-0 absolute top-0 left-0 right-0 z-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Main Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-gray-50/50 mt-[60px] md:mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 max-w-[1600px] mx-auto pb-24">
                {filteredProducts.map((product) => {
                  const price = priceType === 'wholesale' && product.wholesalePrice
                    ? Number(product.wholesalePrice)
                    : Number(product.sellingPrice);

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={cn(
                        'group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 text-left relative',
                        Number(product.quantity) <= 0 && 'opacity-60 cursor-not-allowed grayscale hover:shadow-none hover:-translate-y-0 hover:border-gray-200'
                      )}
                      disabled={Number(product.quantity) <= 0}
                    >
                      {/* Product Image Placeholder Area */}
                      <div className="aspect-[4/3] bg-gray-50 flex flex-col items-center justify-center p-4 relative border-b border-gray-100/80">
                        <Package className="h-10 w-10 md:h-14 md:w-14 text-gray-300 group-hover:text-primary/40 transition-colors duration-300" />
                        <div className="absolute top-2 right-2 md:top-3 md:right-3">
                          <span className={cn(
                            "px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold shadow-sm backdrop-blur-md",
                            Number(product.quantity) > 10 ? "bg-white/90 text-gray-600" : "bg-red-50/90 text-red-600 border border-red-100"
                          )}>
                            Stock: {Number(product.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 md:p-5 flex flex-col flex-1">
                        <div className="mb-3">
                          <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1 line-clamp-1">{product.category}</p>
                          <h3 className="font-semibold text-gray-900 text-xs md:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5em]">
                            {product.name}
                          </h3>
                        </div>
                        
                        <div className="mt-auto flex items-end justify-between">
                          <div className="flex flex-col">
                            <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
                              {formatCurrency(price)}
                            </span>
                          </div>
                          
                          <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 shadow-sm">
                            <Plus className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <Search className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search or category filter.</p>
                </div>
              )}
            </div>
          </div>

          {/* Large Floating Cart Button */}
          {cart.length > 0 && (
            <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => setCartOpen(true)}
                className="h-14 md:h-16 pl-5 md:pl-6 pr-6 md:pr-8 rounded-full bg-gray-900 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 md:gap-5 border-[3px] md:border-4 border-white"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center bg-primary text-white border-2 border-gray-900 rounded-full text-[9px] md:text-[10px] font-bold">
                    {cartItemsCount}
                  </Badge>
                </div>
                <div className="flex flex-col items-start leading-none border-l border-white/20 pl-3 md:pl-4 py-1">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/60 mb-1 font-semibold">Order Total</span>
                  <span className="text-base md:text-lg font-bold tracking-tight">{formatCurrency(total)}</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Refined Cart Sheet */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white flex flex-col border-none shadow-2xl">
            <div className="p-6 pb-4 border-b border-gray-100 bg-white">
              <SheetHeader className="mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl font-bold tracking-tight text-gray-900">Your Order</SheetTitle>
                    <p className="text-xs text-gray-500 mt-1">{cartItemsCount} items selected</p>
                  </div>
                  <button onClick={() => { setCart([]); setCartOpen(false) }} className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest hover:text-red-500 transition-colors bg-gray-50 px-3 py-1.5 rounded-full">
                    Clear All
                  </button>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar bg-gray-50/30">
              {cart.map((item) => (
                <div key={item.product.id} className="group p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 leading-snug mb-1 line-clamp-2">{item.product.name}</p>
                      <p className="text-xs font-medium text-gray-500">
                        {formatCurrency(getCartItemPrice(item))} each
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm shrink-0">
                      {formatCurrency(getCartItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                    <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-7 w-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-600"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-7 w-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-500 font-medium text-xs">
                  <span>Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium text-xs">
                  <span>VAT ({business.vatRate}%)</span>
                  <span className="text-gray-900">{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grand Total</span>
                    <span className="text-3xl font-bold text-gray-900 tracking-tight leading-none">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all gap-3"
                onClick={() => setCheckoutMode(true)}
                disabled={cart.length === 0}
              >
                <CreditCard className="h-5 w-5" />
                Proceed to Checkout
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Elegant Payment Modal */}
        <Dialog open={checkoutMode} onOpenChange={setCheckoutMode}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-[24px] shadow-2xl bg-white">
            <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-gray-900">Complete Payment</DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">Select your preferred payment method</DialogDescription>
              </DialogHeader>
              <div className="mt-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Amount Due</p>
                <h3 className="text-4xl font-bold tracking-tight text-gray-900">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-3 mb-8">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative group",
                      selectedPayment === method.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mb-3 transition-all",
                      selectedPayment === method.id ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200")}>
                      <method.icon className="h-5 w-5" />
                    </div>
                    <span className={cn("font-semibold text-xs", selectedPayment === method.id ? "text-primary" : "text-gray-700")}>{method.name}</span>
                    {selectedPayment === method.id && (
                      <div className="absolute top-3 right-3">
                        <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Button
                  className="w-full h-14 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing Payment..." : "Confirm & Pay"}
                </Button>
                <button
                  className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                  onClick={() => setCheckoutMode(false)}
                >
                  Cancel and return to cart
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
