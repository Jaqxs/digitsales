import { useState, useMemo } from 'react';
import { MainLayout, PageContent } from '@/components/layout';
import { mockProducts } from '@/data/mock-data';
import { Product, CartItem, PaymentMethod } from '@/types/pos';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { id: 'all', name: 'All Products' },
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

const PointOfSale = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast({
            title: 'Stock limit reached',
            description: `Only ${product.quantity} units available`,
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
            const newQty = item.quantity + delta;
            if (newQty > item.product.quantity) {
              toast({
                title: 'Stock limit',
                description: `Only ${item.product.quantity} units available`,
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to cart before checkout',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sale completed!',
      description: `Total: ${formatCurrency(total)} via ${selectedPayment}`,
    });
    clearCart();
  };

  return (
    <MainLayout>
      <PageContent className="h-[calc(100vh-0px)] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Products Section */}
          <div className="flex-1 flex flex-col border-r border-border">
            {/* Search & Categories */}
            <div className="p-4 border-b border-border bg-card">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="whitespace-nowrap"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-background">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      'flex flex-col p-4 rounded-xl border border-border bg-card text-left transition-all duration-200 hover:shadow-card-hover hover:border-primary/30',
                      product.quantity === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={product.quantity === 0}
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground text-sm truncate mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bold text-foreground">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <Badge
                        variant={product.quantity <= product.lowStockThreshold ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {product.quantity} {product.unit}
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

          {/* Cart Section */}
          <div className="w-[400px] flex flex-col bg-card">
            {/* Cart Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Current Sale</h2>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs mt-1">Click products to add them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.sellingPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-border p-4 space-y-4">
              {/* Payment Methods */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Payment Method</p>
                <div className="grid grid-cols-4 gap-2">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={selectedPayment === method.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPayment(method.id)}
                      className="flex flex-col h-auto py-2 gap-1"
                    >
                      <method.icon className="h-4 w-4" />
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (18%)</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full h-12 text-lg font-semibold gap-2"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                <Check className="h-5 w-5" />
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </PageContent>
    </MainLayout>
  );
};

export default PointOfSale;
