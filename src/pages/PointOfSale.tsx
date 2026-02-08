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
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
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

  const currentPrice = (product: Product) => {
    return priceType === 'wholesale' && product.wholesalePrice
      ? Number(product.wholesalePrice)
      : Number(product.sellingPrice);
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
        title: 'Transaction Successful',
        description: 'The sale has been recorded and inventory updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Transaction Failed',
        description: error.message || 'Error processing sale',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType; color: string }[] = [
    { id: 'cash', name: 'Cash', icon: Banknote, color: 'text-emerald-500' },
    { id: 'card', name: 'Card', icon: CreditCard, color: 'text-blue-500' },
    { id: 'mpesa', name: 'M-Pesa', icon: Smartphone, color: 'text-orange-500' },
    { id: 'bank-transfer', name: 'Bank Transfer', icon: Building2, color: 'text-indigo-500' },
  ];

  return (
    <MainLayout>
      <PageContent className="h-full overflow-hidden p-0 bg-[#f8fafc]">
        <div className="flex h-full flex-col">
          {/* Dashboard Header */}
          <header className="px-6 py-6 bg-white border-b border-slate-200 z-30">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between mx-auto max-w-[1800px] w-full">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terminal.01</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentUser?.name || 'Authorized Cashier'}</p>
                </div>
              </div>

              <div className="relative flex-1 max-w-2xl w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                  placeholder="Search inventory, UPC or scan SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl shadow-sm focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all text-base font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setPriceType('retail')}
                    className={cn(
                      'px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                      priceType === 'retail' ? 'bg-white text-slate-900 shadow-md scale-100' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    Retail
                  </button>
                  <button
                    onClick={() => setPriceType('wholesale')}
                    className={cn(
                      'px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                      priceType === 'wholesale' ? 'bg-white text-orange-600 shadow-md scale-100' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    Wholesale
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Categories Bar */}
          <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "h-9 px-5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#f8fafc]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6 max-w-[1800px] mx-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={cn(
                    'group flex flex-col rounded-[32px] bg-white border border-slate-200/60 p-2 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 hover:border-slate-300 relative',
                    Number(product.quantity) <= 0 && 'opacity-50 grayscale pointer-events-none'
                  )}
                >
                  <div className="aspect-[4/5] rounded-[24px] bg-slate-50 flex flex-col items-center justify-center p-6 mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Package className="h-12 w-12 text-slate-300 group-hover:text-slate-600 transition-all duration-500 group-hover:scale-110" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge
                        className={cn(
                          "w-full justify-center py-1.5 rounded-xl border-none font-black text-[10px] uppercase tracking-tighter",
                          Number(product.quantity) <= Number(product.lowStockThreshold) ? "bg-red-50 text-red-600" : "bg-white/80 text-slate-600 backdrop-blur-md"
                        )}
                      >
                        {Number(product.quantity)} In Stock
                      </Badge>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-2 group-hover:text-slate-900 transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    <div className="flex flex-col">
                      {/* Prominent Current Price */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {priceType === 'retail' ? 'Retail Price' : 'Wholesale Price'}
                        </span>
                        <span className={cn(
                          "text-xl font-black tracking-tighter",
                          priceType === 'wholesale' ? "text-orange-600" : "text-slate-900"
                        )}>
                          {formatCurrency(currentPrice(product))}
                        </span>
                      </div>

                      {/* Inactive secondary price */}
                      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">
                          {priceType === 'retail' ? 'WSL' : 'RTL'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 line-through decoration-slate-200">
                          {formatCurrency(priceType === 'retail' ? Number(product.wholesalePrice || 0) : Number(product.sellingPrice))}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                  <Layers className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No Items Located</h3>
                <p className="text-slate-400 font-medium">Try adjusting your filters or search keywords.</p>
              </div>
            )}
          </main>

          {/* Premium Floating Cart */}
          {cart.length > 0 && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <button
                onClick={() => setCartOpen(true)}
                className="group h-[80px] px-10 rounded-[40px] bg-slate-900 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-8 border border-white/10 backdrop-blur-xl bg-slate-900/95"
              >
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-orange-500 text-white border-2 border-slate-900 rounded-full text-xs font-black shadow-lg">
                    {cartItemsCount}
                  </Badge>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-1">Total Checkout</span>
                  <span className="text-3xl font-black tracking-tighter leading-none">{formatCurrency(total)}</span>
                </div>

                <div className="h-10 w-px bg-white/10 hidden md:block" />

                <div className="hidden md:flex items-center gap-2 text-white/50 group-hover:text-white transition-colors font-bold text-sm uppercase tracking-widest">
                  <span>Review Bag</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* High-End Cart Drawer */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white border-none shadow-2xl flex flex-col">
            <div className="p-8 pb-6 border-b border-slate-100">
              <SheetHeader>
                <div className="flex items-center justify-between mb-2">
                  <SheetTitle className="text-3xl font-black text-slate-900 tracking-tighter italic">Cart Summary</SheetTitle>
                  <button onClick={() => { setCart([]); setCartOpen(false) }} className="h-10 w-10 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-900" />
                  Reviewing {cartItemsCount} individual units
                </p>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-8 md:px-10 py-8 space-y-6 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.product.id} className="group animate-in fade-in slide-in-from-right-4">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <p className="font-black text-lg text-slate-800 tracking-tight leading-tight mb-1 group-hover:text-slate-900 transition-colors uppercase">{item.product.name}</p>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                        <Tag className="h-3 w-3" />
                        {formatCurrency(getCartItemPrice(item))} per unit
                      </p>
                    </div>
                    <p className="font-black text-slate-900 text-lg tracking-tighter shrink-0 pt-1">
                      {formatCurrency(getCartItemPrice(item) * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 shadow-inner">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-slate-900 active:scale-90 transition-all"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="w-12 text-center text-base font-black text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 hover:text-slate-900 active:scale-90 transition-all"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                  <div className="mt-6 border-b border-slate-50" />
                </div>
              ))}
            </div>

            <div className="p-10 bg-slate-50 pt-10 border-t border-slate-100 flex flex-col gap-8 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
              <div className="space-y-4">
                <div className="flex justify-between text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                  <span>Service VAT ({business.vatRate}%)</span>
                  <span className="text-slate-900">{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Grant Total</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-20 rounded-[30px] text-xl font-black bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all gap-4 flex items-center justify-center uppercase tracking-widest"
                onClick={() => setCheckoutMode(true)}
              >
                <CreditCard className="h-7 w-7" />
                Checkout
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* High-End Payment Modal */}
        <Dialog open={checkoutMode} onOpenChange={setCheckoutMode}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[40px] shadow-2xl">
            <div className="bg-slate-900 p-10 text-white flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-800 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

              <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center mb-6 relative z-10 backdrop-blur-md border border-white/10">
                <CreditCard className="h-8 w-8 text-white" />
              </div>

              <DialogHeader className="relative z-10 text-center">
                <DialogTitle className="text-4xl font-black tracking-tighter mb-1 lowercase">ready to pay?</DialogTitle>
                <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5 inline-block mx-auto">
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">transaction verification required</p>
                </div>
              </DialogHeader>

              <div className="mt-12 text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 mb-2">final amount</p>
                <h3 className="text-7xl font-black tracking-tighter italic">{formatCurrency(total)}</h3>
              </div>
            </div>

            <div className="p-10 bg-white">
              <div className="grid grid-cols-2 gap-4 mb-10">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-[32px] border-2 transition-all duration-300 relative group overflow-hidden",
                      selectedPayment === method.id
                        ? "border-slate-900 bg-slate-50 shadow-xl shadow-slate-100 scale-100"
                        : "border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                      selectedPayment === method.id ? "bg-slate-900 text-white" : "bg-white text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 shadow-sm")}>
                      <method.icon className="h-6 w-6" />
                    </div>
                    <span className="font-black text-[11px] uppercase tracking-widest text-slate-600">{method.name}</span>
                    {selectedPayment === method.id && (
                      <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
                        <div className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg">
                          <Check className="h-3 w-3 stroke-[5px]" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <Button
                  className="w-full h-20 rounded-[30px] text-xl font-black bg-slate-900 text-white shadow-2xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em]"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Syncing...</span>
                    </div>
                  ) : (
                    "Authorize Pay"
                  )}
                </Button>
                <button
                  className="w-full text-center text-[10px] font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-[0.4em]"
                  onClick={() => setCheckoutMode(false)}
                >
                  cancel transaction
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
