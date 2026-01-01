import { create } from 'zustand';
import { Product, Customer, Employee, Sale, CartItem, PaymentMethod, ProductCategory } from '@/types/pos';
import { api } from '@/services/api';
import { mapApiUserToEmployee } from '@/lib/api-converters';

interface DataStore {
  // Loading states
  loading: {
    products: boolean;
    customers: boolean;
    employees: boolean;
    sales: boolean;
  };

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
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'totalSales'>) => Promise<void>;
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
  },

  products: [],
  customers: [],
  employees: [],
  sales: [],
  stockRecords: [],

  // Products
  fetchProducts: async () => {
    set((state) => ({ loading: { ...state.loading, products: true } }));
    try {
      const response = await api.products.getAllProducts({ limit: 100 });
      set({ products: response.products });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, products: false } }));
    }
  },

  addProduct: async (productData) => {
    try {
      const response = await api.products.createProduct(productData);
      set((state) => ({ products: [...state.products, response.product] }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const response = await api.products.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? response.product : p
        ),
      }));
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.products.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  updateStock: async (productId, quantityChange, type, reason) => {
    try {
      const response = await api.products.updateStock({
        productId,
        quantityChange,
        type,
        reason
      });
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? response.product : p
        ),
      }));
    } catch (error) {
      console.error('Failed to update stock:', error);
      throw error;
    }
  },

  // Customers
  fetchCustomers: async () => {
    set((state) => ({ loading: { ...state.loading, customers: true } }));
    try {
      const response = await api.customers.getAllCustomers({ limit: 100 });
      set({ customers: response.customers });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, customers: false } }));
    }
  },

  addCustomer: async (customerData) => {
    try {
      const response = await api.customers.createCustomer(customerData);
      set((state) => ({ customers: [...state.customers, response.customer] }));
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      const response = await api.customers.updateCustomer(id, updates);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? response.customer : c
        ),
      }));
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      await api.customers.deleteCustomer(id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  },

  // Employees
  fetchEmployees: async () => {
    set((state) => ({ loading: { ...state.loading, employees: true } }));
    try {
      const response = await api.users.getAllUsers({ role: 'sales', limit: 100 });
      // Map backend users to frontend employee type
      const employees: Employee[] = response.users.map((u: any) => ({
        id: u.id,
        name: u.userProfile ? `${u.userProfile.firstName} ${u.userProfile.lastName}` : u.email,
        email: u.email,
        role: u.role,
        phone: u.userProfile?.phone || '',
        salesTarget: 0, // Need to fetch separately or update backend
        totalSales: 0,
        commission: 0,
        createdAt: new Date(u.createdAt),
      }));
      set({ employees });
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
    }
  },

  addEmployee: async (employeeData) => {
    try {
      // Logic for adding employee via auth/users
      const response = await api.users.createUser({
        ...employeeData,
        password: 'temporaryPassword123!', // Admin sets temporary password
        firstName: (employeeData as any).name.split(' ')[0],
        lastName: (employeeData as any).name.split(' ')[1] || '',
      });

      const newEmployee: Employee = {
        id: response.user.id,
        name: response.user.userProfile
          ? `${response.user.userProfile.firstName} ${response.user.userProfile.lastName}`
          : response.user.email,
        email: response.user.email,
        role: response.user.role,
        phone: response.user.userProfile?.phone || '',
        salesTarget: 0,
        totalSales: 0,
        commission: 0,
        createdAt: new Date(response.user.createdAt),
      };

      set((state) => ({ employees: [...state.employees, newEmployee] }));
    } catch (error) {
      console.error('Failed to add employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id, updates) => {
    try {
      const response = await api.users.updateUser(id, updates as any);
      const updatedEmployee = mapApiUserToEmployee(response.user);
      set((state) => ({
        employees: state.employees.map((e) =>
          e.id === id ? updatedEmployee : e
        ),
      }));
    } catch (error) {
      console.error('Failed to update employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    try {
      await api.users.deactivateUser(id);
      set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete employee:', error);
      throw error;
    }
  },

  // Sales
  fetchSales: async () => {
    set((state) => ({ loading: { ...state.loading, sales: true } }));
    try {
      const response = await api.sales.getAllSales({ limit: 100 });
      set({ sales: response.sales });
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, sales: false } }));
    }
  },

  addSale: async (saleData) => {
    try {
      const response = await api.sales.createSale(saleData);
      const createdSale = response.sale;

      set((state) => ({ sales: [createdSale, ...state.sales] }));

      // Refresh products to get updated stock
      await get().fetchProducts();

      return createdSale;
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  },

  // Stock records
  fetchStockRecords: async () => {
    try {
      const response = await api.inventory.getLedger({ limit: 50 });
      // Map backend entries to frontend StockRecord type
      const records: StockRecord[] = response.entries.map((e: any) => ({
        id: e.id,
        productId: e.productId,
        productName: e.product.name,
        type: e.transactionType,
        quantity: Number(e.quantity),
        previousStock: Number(e.previousStock),
        newStock: Number(e.newStock),
        reason: e.notes || '',
        createdAt: new Date(e.createdAt),
        createdBy: e.creator.email,
      }));
      set({ stockRecords: records });
    } catch (error) {
      console.error('Failed to fetch stock records:', error);
    }
  },

  addStockRecord: async (recordData) => {
    try {
      await api.inventory.adjustStock({
        productId: recordData.productId,
        quantity: recordData.quantity,
        type: recordData.type as any,
        reason: recordData.reason,
      });
      // Refresh products and records
      await Promise.all([
        get().fetchProducts(),
        get().fetchStockRecords(),
      ]);
    } catch (error) {
      console.error('Failed to add stock record:', error);
      throw error;
    }
  },
}));
