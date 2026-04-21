import { create } from 'zustand';
import { Product, Customer, Employee, Sale, CartItem, PaymentMethod, ProductCategory } from '@/types/pos';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_EMPLOYEES, MOCK_SALES, MOCK_STOCK_RECORDS } from '@/lib/mock-data';

interface DataStore {
  // Loading states
  loading: {
    products: boolean;
    customers: boolean;
    employees: boolean;
    sales: boolean;
    locations: boolean;
  };

  // Locations
  locations: any[];
  fetchLocations: () => Promise<void>;

  // Products
  products: Product[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, quantityChange: number, type: 'in' | 'out' | 'adjustment', reason: string) => Promise<void>;

  // Customers
  customers: Customer[];
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalPurchases'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Employees
  employees: Employee[];
  fetchEmployees: (params?: { isActive?: boolean }) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'totalSales'> & { password?: string, employeeId?: string }) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Sales
  sales: Sale[];
  fetchSales: () => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;

  // Stock records
  stockRecords: StockRecord[];
  fetchStockRecords: () => Promise<void>;
  addStockRecord: (record: Omit<StockRecord, 'id' | 'createdAt'>) => Promise<void>;
}

export interface StockRecord {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

export const useDataStore = create<DataStore>((set, get) => ({
  loading: {
    products: false,
    customers: false,
    employees: false,
    sales: false,
    locations: false,
  },

  // Pre-loaded mock data
  products: MOCK_PRODUCTS,
  customers: MOCK_CUSTOMERS,
  employees: MOCK_EMPLOYEES,
  sales: MOCK_SALES,
  stockRecords: MOCK_STOCK_RECORDS,
  locations: [
    { id: 'loc-001', name: 'Main Warehouse' },
    { id: 'loc-002', name: 'Front Store' },
    { id: 'loc-003', name: 'Yard Storage' },
  ],

  // ── Fetch (no-ops — data is pre-loaded) ──────────────────────────────────
  fetchProducts: async () => {},
  fetchCustomers: async () => {},
  fetchEmployees: async () => {},
  fetchSales: async () => {},
  fetchStockRecords: async () => {},
  fetchLocations: async () => {},

  // ── Products ─────────────────────────────────────────────────────────────
  addProduct: async (productData) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  updateProduct: async (id, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }));
  },

  deleteProduct: async (id) => {
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  updateStock: async (productId, quantityChange, type, reason) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const previous = product.quantity;
    const newQty = Math.max(0, previous + quantityChange);

    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, quantity: newQty, updatedAt: new Date() } : p
      ),
      stockRecords: [
        {
          id: `stk-${Date.now()}`,
          productId,
          productName: product.name,
          type,
          quantity: Math.abs(quantityChange),
          previousStock: previous,
          newStock: newQty,
          reason,
          createdAt: new Date(),
          createdBy: 'admin@zantrixpos.com',
        },
        ...state.stockRecords,
      ],
    }));
  },

  // ── Customers ────────────────────────────────────────────────────────────
  addCustomer: async (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      loyaltyPoints: 0,
      totalPurchases: 0,
      createdAt: new Date(),
    };
    set((state) => ({ customers: [...state.customers, newCustomer] }));
  },

  updateCustomer: async (id, updates) => {
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteCustomer: async (id) => {
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
  },

  // ── Employees ────────────────────────────────────────────────────────────
  addEmployee: async (employeeData) => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: `${(employeeData as any).firstName || ''} ${(employeeData as any).lastName || ''}`.trim() || employeeData.name,
      email: employeeData.email,
      role: employeeData.role,
      phone: employeeData.phone,
      salesTarget: employeeData.salesTarget,
      totalSales: 0,
      commission: employeeData.commission,
      createdAt: new Date(),
    };
    set((state) => ({ employees: [...state.employees, newEmployee] }));
  },

  updateEmployee: async (id, updates) => {
    set((state) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  deleteEmployee: async (id) => {
    set((state) => ({ employees: state.employees.filter((e) => e.id !== id) }));
  },

  // ── Sales ────────────────────────────────────────────────────────────────
  addSale: async (saleData) => {
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      createdAt: new Date(),
    };
    // Deduct stock for each sold item
    saleData.items.forEach(item => {
      get().updateStock(item.product.id, -item.quantity, 'out', `POS Sale ${newSale.id}`);
    });
    set((state) => ({ sales: [newSale, ...state.sales] }));
    return newSale;
  },

  // ── Stock records ────────────────────────────────────────────────────────
  addStockRecord: async (recordData) => {
    await get().updateStock(
      recordData.productId,
      recordData.type === 'out' ? -recordData.quantity : recordData.quantity,
      recordData.type,
      recordData.reason,
    );
  },
}));

