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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReceiptModal } from '@/components/receipt';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'construction-equipment', name: 'Construction' },
  { id: 'power-tools', name: 'Power Tools' },
  { id: 'hand-tools', name: 'Hand Tools' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'building-materials', name: 'Materials' },
];

const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType }[] = [
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'mpesa', name: 'M-Pesa', icon: Smartphone },
  { id: 'bank-transfer', name: 'Bank', icon: Building2 },
];

import { useSettingsStore } from '@/stores/settingsStore';

const PointOfSale = () => {
  const { products, addSale, fetchProducts } = useDataStore();
  const { user: currentUser } = useAuth();
  const { business } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [showCart, setShowCart] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const { toast } = useToast();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.quantity > 0;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const currentProduct = products.find(p => p.id === product.id);
        if (!currentProduct || existing.quantity >= currentProduct.quantity) {
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
            if (currentProduct && newQty > currentProduct.quantity) {
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

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const vat = calculateVAT(subtotal);
  const total = subtotal + vat;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to cart before checkout',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create sale object structured for backend
      const saleData = {
        employeeId: currentUser?.id || '',
        customerId: null,
        subtotal: Number(subtotal),
        discountAmount: 0,
        taxAmount: Number(vat),
        totalAmount: Number(total),
        paymentMethod: (selectedPayment === 'bank-transfer' ? 'bank_transfer' : selectedPayment) as PaymentMethod,
        status: 'completed' as const,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discountAmount: 0,
          taxAmount: calculateVAT(item.product.sellingPrice * item.quantity),
          lineTotal: (item.product.sellingPrice * item.quantity) + calculateVAT(item.product.sellingPrice * item.quantity)
        })),
      } as any;

      // Add sale to store and get the persistent sale object
      const completedSale = await addSale(saleData);

      setLastSale(completedSale);
      setReceiptOpen(true);

      toast({
        title: 'Sale completed!',
        description: `Total: ${formatCurrency(total)} via ${selectedPayment}`,
      });
      clearCart();
      setShowCart(false);
    } catch (error) {
      toast({
        title: 'Sale failed',
        description: 'There was an error processing the sale. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <MainLayout>
      <PageContent className="h-[calc(100vh-0px)] overflow-hidden p-0">
        <div className="flex h-full flex-col lg:flex-row">
          {/* Products Section */}
          <div className="flex-1 flex flex-col border-r border-border min-h-0">
            {/* Search & Categories */}
            <div className="p-3 sm:p-4 border-b border-border bg-card">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="whitespace-nowrap text-xs sm:text-sm h-8 px-2 sm:px-3"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-background pb-20 lg:pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'flex flex-col p-3 sm:p-4 rounded-xl border border-border bg-card text-left transition-all duration-200 hover:shadow-card-hover hover:border-primary/30 active:scale-[0.98]',
                      product.quantity === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={product.quantity === 0}
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground text-xs sm:text-sm truncate mb-0.5 sm:mb-1">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">{product.sku}</p>
                    <div className="mt-auto flex items-center justify-between gap-1">
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <Badge
                        variant={product.quantity <= product.lowStockThreshold ? 'destructive' : 'secondary'}
                        className="text-[9px] sm:text-xs px-1 sm:px-2"
                      >
                        {product.quantity}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Package className="h-12 w-12 mb-4 opacity-50" />
                  <p>No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Cart Toggle Button */}
          <button
            onClick={() => setShowCart(!showCart)}
            className={cn(
              'lg:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all',
              cart.length > 0 ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
            )}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <>
                <span className="font-bold">{formatCurrency(total)}</span>
                <Badge className="bg-primary-foreground text-primary">{cartItemsCount}</Badge>
              </>
            )}
            <ChevronUp className={cn('h-4 w-4 transition-transform', showCart && 'rotate-180')} />
          </button>

          {/* Cart Section - Slide up on mobile */}
          <div
            className={cn(
              'fixed lg:relative inset-x-0 bottom-0 lg:inset-auto z-40',
              'w-full lg:w-[380px] xl:w-[400px] flex flex-col bg-card',
              'transition-transform duration-300 ease-out',
              'max-h-[85vh] lg:max-h-none rounded-t-2xl lg:rounded-none shadow-2xl lg:shadow-none',
              showCart ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
            )}
          >
            {/* Cart Header */}
            <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground text-sm sm:text-base">Current Sale</h2>
                {cart.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{cartItemsCount} items</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground h-8 px-2">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8"
                  onClick={() => setShowCart(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-[120px] max-h-[30vh] lg:max-h-none">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                  <ShoppingCart className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs mt-1">Tap products to add them</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-medium text-xs sm:text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Payment Methods */}
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Payment</p>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={selectedPayment === method.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPayment(method.id)}
                      className="flex flex-col h-auto py-1.5 sm:py-2 gap-0.5 sm:gap-1"
                    >
                      <method.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-[10px] sm:text-xs">{method.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT ({business.vatRate}%)</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 sm:gap-2 h-10 sm:h-11 text-xs sm:text-sm"
                  disabled={cart.length === 0}
                >
                  <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Hold
                </Button>
                <Button
                  className="flex-1 gap-1.5 sm:gap-2 h-10 sm:h-11 text-xs sm:text-sm"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Complete Sale
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContent>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={lastSale}
      />
    </MainLayout>
  );
};

export default PointOfSale;
