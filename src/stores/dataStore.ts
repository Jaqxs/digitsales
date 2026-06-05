import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product, Customer, Employee, Sale, PaymentMethod, Expense,
} from '@/types/pos';
import {
  productAPI, customerAPI, employeeAPI, saleAPI, inventoryAPI, reportAPI,
} from '@/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface UserData {
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  sales: Sale[];
  stockRecords: StockRecord[];
  expenses: Expense[];
}

interface DataStore extends UserData {
  loading: {
    products: boolean;
    customers: boolean;
    employees: boolean;
    sales: boolean;
    locations: boolean;
  };

  currentUserId: string | null;
  allUserData: Record<string, UserData>;
  useLocalFallback: boolean; // true when backend is unreachable

  setCurrentUser: (userId: string | null) => void;

  // Locations
  locations: any[];
  fetchLocations: () => Promise<void>;

  // Fetch actions (load from cloud into local state)
  fetchProducts: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchEmployees: (params?: { isActive?: boolean }) => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchStockRecords: () => Promise<void>;
  fetchExpenses: () => Promise<void>;

  // Mutation actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, quantityChange: number, type: 'in' | 'out' | 'adjustment', reason: string) => Promise<void>;
  addStockRecord: (record: Omit<StockRecord, 'id' | 'createdAt'>) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalPurchases'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'totalSales'> & { password?: string; employeeId?: string }) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;

  addExpense: (expense: Omit<Expense, 'id' | 'recordedBy'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

// ─── Default empty user bucket ───────────────────────────────────────────────

const DEFAULT_USER_DATA: UserData = {
  products: [],
  customers: [],
  employees: [],
  sales: [],
  stockRecords: [],
  expenses: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map backend product shape → frontend Product shape */
function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    barcode: p.barcode || '',
    category: p.category?.name || p.category || 'General',
    description: p.description || '',
    costPrice: Number(p.costPrice ?? p.cost_price ?? 0),
    sellingPrice: Number(p.sellingPrice ?? p.selling_price ?? 0),
    wholesalePrice: Number(p.wholesalePrice ?? p.wholesale_price ?? 0),
    quantity: Number(p.quantity ?? p.currentStock ?? 0),
    lowStockThreshold: Number(p.lowStockThreshold ?? p.low_stock_threshold ?? 10),
    supplier: p.supplier || '',
    unit: p.unit || 'unit',
    isTaxInclusive: p.isTaxInclusive ?? false,
    taxRate: Number(p.taxRate ?? 18),
    status: p.status || 'approved',
    defaultLocationId: p.defaultLocationId || '',
    reservedQuantity: Number(p.reservedQuantity ?? 0),
    bonusQuantity: Number(p.bonusQuantity ?? 0),
    packingUnit: p.packingUnit || '',
    packingSize: Number(p.packingSize ?? 0),
    salesRepId: p.salesRepId || '',
    expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined,
    createdAt: new Date(p.createdAt || Date.now()),
    updatedAt: new Date(p.updatedAt || Date.now()),
  };
}

function mapCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
    email: c.email || '',
    phone: c.phone || '',
    address: c.address || '',
    loyaltyPoints: Number(c.loyaltyPoints ?? 0),
    totalPurchases: Number(c.totalPurchases ?? c.totalSpent ?? 0),
    createdAt: new Date(c.createdAt || Date.now()),
  };
}

function mapEmployee(e: any): Employee {
  return {
    id: e.id,
    name: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim(),
    email: e.email || '',
    role: e.role || 'sales',
    phone: e.phone || '',
    salesTarget: Number(e.salesTarget ?? 0),
    totalSales: Number(e.totalSales ?? 0),
    commission: Number(e.commission ?? 0),
    createdAt: new Date(e.createdAt || Date.now()),
  };
}

function mapSale(s: any): Sale {
  return {
    id: s.id,
    items: (s.items || s.saleItems || []).map((item: any) => ({
      product: item.product || { id: item.productId, name: item.productName || '' },
      quantity: Number(item.quantity),
      discount: Number(item.discount ?? 0),
      unitPrice: Number(item.unitPrice ?? item.price ?? 0),
      total: Number(item.total ?? item.subtotal ?? 0),
    })),
    subtotal: Number(s.subtotal ?? 0),
    discount: Number(s.discount ?? 0),
    tax: Number(s.tax ?? s.vat ?? 0),
    total: Number(s.total ?? s.grandTotal ?? 0),
    paymentMethod: s.paymentMethod || 'cash',
    status: s.status || 'completed',
    customer: s.customer || null,
    customerId: s.customerId || null,
    cashier: s.cashier || s.createdBy || null,
    notes: s.notes || '',
    createdAt: new Date(s.createdAt || Date.now()),
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      loading: { products: false, customers: false, employees: false, sales: false, locations: false },
      currentUserId: null,
      allUserData: {},
      useLocalFallback: false,
      ...DEFAULT_USER_DATA,

      locations: [
        { id: 'loc-001', name: 'Main Warehouse' },
        { id: 'loc-002', name: 'Front Store' },
        { id: 'loc-003', name: 'Yard Storage' },
      ],

      // ── Helper: write to both local state and per-user bucket ──
      syncAndSet: (update: Partial<UserData>) => {
        set((state) => {
          const newState = { ...state, ...update };
          if (state.currentUserId) {
            newState.allUserData = {
              ...state.allUserData,
              [state.currentUserId]: {
                products: newState.products,
                customers: newState.customers,
                employees: newState.employees,
                sales: newState.sales,
                stockRecords: newState.stockRecords,
                expenses: newState.expenses,
              },
            };
          }
          return newState;
        });
      },

      setCurrentUser: (userId) => {
        if (!userId) {
          set({ currentUserId: null, ...DEFAULT_USER_DATA });
          return;
        }
        const { allUserData } = get();
        const userData = allUserData[userId] || DEFAULT_USER_DATA;
        set({ currentUserId: userId, ...userData });
      },

      // ── Locations ─────────────────────────────────────────────
      fetchLocations: async () => {
        try {
          const locs = await inventoryAPI.getLocations();
          if (Array.isArray(locs) && locs.length > 0) set({ locations: locs });
        } catch {
          /* keep default locations */
        }
      },

      // ── Products ─────────────────────────────────────────────
      fetchProducts: async () => {
        set(s => ({ loading: { ...s.loading, products: true } }));
        try {
          const data = await productAPI.getAllProducts({ limit: 500 });
          const products = (data.products || []).map(mapProduct);
          get().syncAndSet({ products });
          set({ useLocalFallback: false });
        } catch (err: any) {
          console.warn('⚠️ fetchProducts: using local cache —', err.message);
          set({ useLocalFallback: true });
        } finally {
          set(s => ({ loading: { ...s.loading, products: false } }));
        }
      },

      addProduct: async (productData) => {
        // Optimistic local update
        const tempId = `prod-${Date.now()}`;
        const optimistic: Product = {
          ...productData,
          id: tempId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Product;
        get().syncAndSet({ products: [...get().products, optimistic] });

        try {
          const res = await productAPI.createProduct(productData);
          const created = mapProduct(res.product || res);
          // Replace the optimistic entry with the real one
          get().syncAndSet({
            products: get().products.map(p => p.id === tempId ? created : p),
          });
        } catch (error: any) {
          // Revert optimistic update
          get().syncAndSet({
            products: get().products.filter(p => p.id !== tempId),
          });
          throw error;
        }
      },

      updateProduct: async (id, updates) => {
        const original = get().products.find(p => p.id === id);
        // Optimistic
        get().syncAndSet({
          products: get().products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p),
        });
        try {
          await productAPI.updateProduct(id, updates);
        } catch (error: any) {
          // Revert
          if (original) {
            get().syncAndSet({
              products: get().products.map(p => p.id === id ? original : p),
            });
          }
          throw error;
        }
      },

      deleteProduct: async (id) => {
        const original = get().products.find(p => p.id === id);
        get().syncAndSet({ products: get().products.filter(p => p.id !== id) });
        try {
          await productAPI.deleteProduct(id);
        } catch (error: any) {
          // Revert
          if (original) {
            get().syncAndSet({
              products: [...get().products, original],
            });
          }
          throw error;
        }
      },

      updateStock: async (productId, quantityChange, type, reason) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const previous = product.quantity;
        const newQty = Math.max(0, previous + quantityChange);

        const newRecord: StockRecord = {
          id: `stk-${Date.now()}`,
          productId,
          productName: product.name,
          type,
          quantity: Math.abs(quantityChange),
          previousStock: previous,
          newStock: newQty,
          reason,
          createdAt: new Date(),
          createdBy: 'system',
        };

        get().syncAndSet({
          products: get().products.map(p => p.id === productId ? { ...p, quantity: newQty, updatedAt: new Date() } : p),
          stockRecords: [newRecord, ...get().stockRecords],
        });

        try {
          if (['damaged', 'lost', 'found', 'correction'].includes(type)) {
            await inventoryAPI.adjustStock({ productId, quantity: Math.abs(quantityChange), type: type as any, reason });
          }
        } catch {
          /* keep optimistic */
        }
      },

      addStockRecord: async (record) => {
        const newRecord: StockRecord = { ...record, id: `stk-${Date.now()}`, createdAt: new Date() };
        // Also adjust actual product quantity
        const product = get().products.find(p => p.id === record.productId);
        if (product) {
          const change = record.type === 'in' ? record.quantity : record.type === 'out' ? -record.quantity : record.newStock - product.quantity;
          get().syncAndSet({
            products: get().products.map(p => p.id === record.productId ? { ...p, quantity: record.newStock, updatedAt: new Date() } : p),
            stockRecords: [newRecord, ...get().stockRecords],
          });
          try {
            await inventoryAPI.adjustStock({ productId: record.productId, quantity: record.quantity, type: record.type, reason: record.reason });
          } catch { /* keep */ }
        }
      },

      // ── Customers ─────────────────────────────────────────────
      fetchCustomers: async () => {
        set(s => ({ loading: { ...s.loading, customers: true } }));
        try {
          const data = await customerAPI.getAllCustomers({ limit: 500 });
          const customers = (data.customers || []).map(mapCustomer);
          get().syncAndSet({ customers });
        } catch (err: any) {
          console.warn('⚠️ fetchCustomers: using local cache —', err.message);
        } finally {
          set(s => ({ loading: { ...s.loading, customers: false } }));
        }
      },

      addCustomer: async (customerData) => {
        const tempId = `cust-${Date.now()}`;
        const optimistic: Customer = { ...customerData, id: tempId, loyaltyPoints: 0, totalPurchases: 0, createdAt: new Date() };
        get().syncAndSet({ customers: [...get().customers, optimistic] });
        try {
          const res = await customerAPI.createCustomer(customerData);
          const created = mapCustomer(res.customer || res);
          get().syncAndSet({ customers: get().customers.map(c => c.id === tempId ? created : c) });
        } catch (error: any) {
          // Revert
          get().syncAndSet({
            customers: get().customers.filter(c => c.id !== tempId),
          });
          throw error;
        }
      },

      updateCustomer: async (id, updates) => {
        const original = get().customers.find(c => c.id === id);
        get().syncAndSet({ customers: get().customers.map(c => c.id === id ? { ...c, ...updates } : c) });
        try {
          await customerAPI.updateCustomer(id, updates);
        } catch (error: any) {
          if (original) {
            get().syncAndSet({
              customers: get().customers.map(c => c.id === id ? original : c),
            });
          }
          throw error;
        }
      },

      deleteCustomer: async (id) => {
        const original = get().customers.find(c => c.id === id);
        get().syncAndSet({ customers: get().customers.filter(c => c.id !== id) });
        try {
          await customerAPI.deleteCustomer(id);
        } catch (error: any) {
          if (original) {
            get().syncAndSet({
              customers: [...get().customers, original],
            });
          }
          throw error;
        }
      },

      // ── Employees ─────────────────────────────────────────────
      fetchEmployees: async (params) => {
        set(s => ({ loading: { ...s.loading, employees: true } }));
        try {
          const data = await employeeAPI.getAllEmployees({ limit: 200, ...params });
          const employees = (data.employees || []).map(mapEmployee);
          get().syncAndSet({ employees });
        } catch (err: any) {
          console.warn('⚠️ fetchEmployees: using local cache —', err.message);
        } finally {
          set(s => ({ loading: { ...s.loading, employees: false } }));
        }
      },

      addEmployee: async (employeeData) => {
        const tempId = `emp-${Date.now()}`;
        const optimistic: Employee = {
          id: tempId,
          name: `${(employeeData as any).firstName || ''} ${(employeeData as any).lastName || ''}`.trim() || employeeData.name,
          email: employeeData.email,
          role: employeeData.role,
          phone: employeeData.phone,
          salesTarget: employeeData.salesTarget,
          totalSales: 0,
          commission: employeeData.commission,
          createdAt: new Date(),
        };
        get().syncAndSet({ employees: [...get().employees, optimistic] });
        try {
          const res = await employeeAPI.createEmployee(employeeData);
          const created = mapEmployee(res.employee || res);
          get().syncAndSet({ employees: get().employees.map(e => e.id === tempId ? created : e) });
        } catch (error: any) {
          get().syncAndSet({
            employees: get().employees.filter(e => e.id !== tempId),
          });
          throw error;
        }
      },

      updateEmployee: async (id, updates) => {
        const original = get().employees.find(e => e.id === id);
        get().syncAndSet({ employees: get().employees.map(e => e.id === id ? { ...e, ...updates } : e) });
        try {
          await employeeAPI.updateEmployee(id, updates);
        } catch (error: any) {
          if (original) {
            get().syncAndSet({
              employees: get().employees.map(e => e.id === id ? original : e),
            });
          }
          throw error;
        }
      },

      deleteEmployee: async (id) => {
        const original = get().employees.find(e => e.id === id);
        get().syncAndSet({ employees: get().employees.filter(e => e.id !== id) });
        try {
          await employeeAPI.deleteEmployee(id);
        } catch (error: any) {
          if (original) {
            get().syncAndSet({
              employees: [...get().employees, original],
            });
          }
          throw error;
        }
      },

      // ── Sales ─────────────────────────────────────────────────
      fetchSales: async () => {
        set(s => ({ loading: { ...s.loading, sales: true } }));
        try {
          const data = await saleAPI.getAllSales({ limit: 500 });
          const sales = (data.sales || []).map(mapSale);
          get().syncAndSet({ sales });
        } catch (err: any) {
          console.warn('⚠️ fetchSales: using local cache —', err.message);
        } finally {
          set(s => ({ loading: { ...s.loading, sales: false } }));
        }
      },

      addSale: async (saleData) => {
        const tempId = `sale-${Date.now()}`;
        const optimistic: Sale = { ...saleData, id: tempId, createdAt: new Date() };

        // Deduct stock locally first
        saleData.items.forEach(item => {
          const productId = item.product?.id || item.productId;
          if (productId) {
            get().updateStock(productId, -item.quantity, 'out', `POS Sale ${tempId}`);
          }
        });
        get().syncAndSet({ sales: [optimistic, ...get().sales] });

        try {
          // Map to backend shape
          const payload = {
            employeeId: saleData.employeeId || get().currentUserId || null,
            customerId: saleData.customerId || null,
            subtotal: Number(saleData.subtotal || 0),
            discountAmount: Number(saleData.discountAmount || saleData.discount || 0),
            taxAmount: Number(saleData.taxAmount || saleData.tax || 0),
            totalAmount: Number(saleData.totalAmount || saleData.total || 0),
            paymentMethod: (saleData.paymentMethod === 'bank-transfer' ? 'bank_transfer' : saleData.paymentMethod),
            notes: saleData.notes || '',
            items: saleData.items.map(item => {
              const productId = item.product?.id || item.productId;
              const unitPrice = item.unitPrice ?? item.product?.sellingPrice ?? 0;
              const quantity = item.quantity;
              const discountAmount = item.discountAmount ?? item.discount ?? 0;
              const taxAmount = item.taxAmount ?? 0;
              const lineTotal = item.lineTotal ?? (Number(unitPrice) * Number(quantity) - Number(discountAmount));
              return {
                productId,
                quantity: Number(quantity),
                unitPrice: Number(unitPrice),
                taxAmount: Number(taxAmount),
                discountAmount: Number(discountAmount),
                lineTotal: Number(lineTotal),
              };
            }),
          };
          const res = await saleAPI.createSale(payload);
          const created = mapSale(res.sale || res);
          get().syncAndSet({ sales: get().sales.map(s => s.id === tempId ? created : s) });
          return created;
        } catch (error: any) {
          // Revert optimistic sale and product stock levels
          get().syncAndSet({
            sales: get().sales.filter(s => s.id !== tempId),
          });
          saleData.items.forEach(item => {
            const productId = item.product?.id || item.productId;
            if (productId) {
              get().updateStock(productId, item.quantity, 'in', `POS Sale Revert ${tempId}`);
            }
          });
          throw error;
        }
      },

      // ── Stock Records ─────────────────────────────────────────
      fetchStockRecords: async () => {
        try {
          const data = await inventoryAPI.getLedger({ limit: 200 });
          const records: StockRecord[] = (data.entries || []).map((e: any) => ({
            id: e.id,
            productId: e.productId || '',
            productName: e.product?.name || e.productName || '',
            type: e.type || 'adjustment',
            quantity: Number(e.quantity || 0),
            previousStock: Number(e.previousStock || 0),
            newStock: Number(e.newStock || 0),
            reason: e.reason || '',
            createdAt: new Date(e.createdAt || Date.now()),
            createdBy: e.createdBy || e.user?.email || 'system',
          }));
          get().syncAndSet({ stockRecords: records });
        } catch {
          /* keep local */
        }
      },

      // ── Expenses ─────────────────────────────────────────────
      fetchExpenses: async () => {
        try {
          // Expenses come from local only (backend may not have this endpoint yet)
          // Once the backend endpoint is available, wire it here
        } catch { /* keep local */ }
      },

      addExpense: async (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: `exp-${Date.now()}`,
          recordedBy: 'system',
        };
        get().syncAndSet({ expenses: [newExpense, ...get().expenses] });
      },

      updateExpense: async (id, updates) => {
        get().syncAndSet({ expenses: get().expenses.map(e => e.id === id ? { ...e, ...updates } : e) });
      },

      deleteExpense: async (id) => {
        get().syncAndSet({ expenses: get().expenses.filter(e => e.id !== id) });
      },
    }),
    { name: 'digitsales-data' }
  )
);
