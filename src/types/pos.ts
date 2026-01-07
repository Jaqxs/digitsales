export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  supplier?: string;
  unit: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory =
  | 'construction-equipment'
  | 'power-tools'
  | 'hand-tools'
  | 'plumbing'
  | 'electrical'
  | 'safety-equipment'
  | 'fasteners'
  | 'building-materials';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  employeeId: string;
  createdAt: Date;
  status: 'completed' | 'refunded' | 'partial-refund' | 'awaiting_delivery';
}

export type PaymentMethod = 'cash' | 'card' | 'mpesa' | 'bank-transfer';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  salesTarget: number;
  totalSales: number;
  commission: number;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  // Additional fields from backend
  isActive?: boolean;
  lastLoginAt?: string | null;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    employeeId?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'manager' | 'sales' | 'inventory' | 'support' | 'stock_keeper';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  products: string[];
  createdAt: Date;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
  salesGrowth: number;
  topProducts: { name: string; sales: number }[];
  recentSales: Sale[];
  salesByCategory: { category: string; value: number }[];
  monthlySales: { month: string; sales: number; orders: number }[];
}
