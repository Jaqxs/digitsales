import { create } from 'zustand';
import { Product, Customer, Employee, Sale, CartItem, PaymentMethod, ProductCategory } from '@/types/pos';
import { api } from '@/services/api';
import { mapApiUserToEmployee, mapApiProductToProduct, mapApiCustomerToCustomer, mapApiSaleToSale } from '@/lib/api-converters';

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
      const response = await api.products.getAllProducts({ limit: 100, isActive: true });
      const mappedProducts = response.products.map(mapApiProductToProduct);
      set({ products: mappedProducts });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, products: false } }));
    }
  },

  addProduct: async (productData) => {
    try {
      const response = await api.products.createProduct(productData);
      const newProduct = mapApiProductToProduct(response);
      set((state) => ({ products: [...state.products, newProduct] }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const response = await api.products.updateProduct(id, updates);
      const updatedProduct = mapApiProductToProduct(response);
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? updatedProduct : p
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
        reason,
      });
      const updatedProduct = mapApiProductToProduct(response);
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? updatedProduct : p
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
      const response = await api.customers.getAllCustomers({ limit: 100, isActive: true });
      const mappedCustomers = response.customers.map(mapApiCustomerToCustomer);
      set({ customers: mappedCustomers });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, customers: false } }));
    }
  },

  addCustomer: async (customerData) => {
    try {
      const response = await api.customers.createCustomer(customerData);
      const newCustomer = mapApiCustomerToCustomer(response);
      set((state) => ({ customers: [...state.customers, newCustomer] }));
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      const response = await api.customers.updateCustomer(id, updates);
      const updatedCustomer = mapApiCustomerToCustomer(response);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? updatedCustomer : c
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
  fetchEmployees: async (params?: { isActive?: boolean }) => {
    set((state) => ({ loading: { ...state.loading, employees: true } }));
    try {
      const isActive = params?.isActive !== undefined ? params.isActive : true;
      // If isActive is active (true/false), pass it. If it's explicitly undefined (meaning 'all'), we might need to handle logic differently if the API requires explicit param.
      // But looking at previous code: api.users.getAllUsers({ limit: 100, isActive: true })
      // The API definition likely takes isActive?: boolean.
      // Let's assume we want to support 'all' by passing undefined if params.isActive is undefined, BUT we default to true if params is missing.

      const response = await api.users.getAllUsers({
        limit: 100,
        isActive: params?.isActive
      });
      const employees = response.users.map(mapApiUserToEmployee);
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
        email: employeeData.email,
        password: employeeData.password || 'temporaryPassword123!',
        role: employeeData.role,
        firstName: (employeeData as any).firstName || employeeData.name.split(' ')[0],
        lastName: (employeeData as any).lastName || employeeData.name.split(' ')[1] || '',
        phone: employeeData.phone,
        employeeId: employeeData.employeeId,
      });

      const newEmployee = mapApiUserToEmployee(response.user);
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
      await api.users.deleteUser(id);
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
      const mappedSales = response.sales.map(mapApiSaleToSale);
      set({ sales: mappedSales });
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, sales: false } }));
    }
  },

  addSale: async (saleData) => {
    try {
      const response = await api.sales.createSale(saleData);
      const createdSale = mapApiSaleToSale(response);

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
