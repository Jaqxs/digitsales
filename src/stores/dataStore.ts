import { create } from 'zustand';
import { Product, Customer, Employee, Sale, CartItem, PaymentMethod, ProductCategory } from '@/types/pos';
import { localDb } from '@/services/localDb';

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
  updateStock: (id: string, quantity: number) => Promise<void>;

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
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>;

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
      const products = await localDb.fetchProducts();
      set({ products });
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, products: false } }));
    }
  },

  addProduct: async (productData) => {
    try {
      const newProduct: Product = {
        ...productData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const product = await localDb.addProduct(newProduct);
      set((state) => ({ products: [...state.products, product] }));
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const updatedProduct = await localDb.updateProduct(id, updates);
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
      await localDb.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  },

  updateStock: async (id, quantityChange) => {
    try {
      const updatedProduct = await localDb.updateStock(id, quantityChange);
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? updatedProduct : p
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
      const customers = await localDb.fetchCustomers();
      set({ customers });
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, customers: false } }));
    }
  },

  addCustomer: async (customerData) => {
    try {
      const newCustomer: Customer = {
        ...customerData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        loyaltyPoints: 0,
        totalPurchases: 0,
      };
      const customer = await localDb.addCustomer(newCustomer);
      set((state) => ({ customers: [...state.customers, customer] }));
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      const updatedCustomer = await localDb.updateCustomer(id, updates);
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
      await localDb.deleteCustomer(id);
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
      const employees = await localDb.fetchEmployees();
      set({ employees });
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, employees: false } }));
    }
  },

  addEmployee: async (employeeData) => {
    try {
      const newEmployee: Employee = {
        ...employeeData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        totalSales: 0,
      };
      const employee = await localDb.addEmployee(newEmployee);
      set((state) => ({ employees: [...state.employees, employee] }));
    } catch (error) {
      console.error('Failed to add employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id, updates) => {
    try {
      const updatedEmployee = await localDb.updateEmployee(id, updates);
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
      await localDb.deleteEmployee(id);
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
      const sales = await localDb.fetchSales();
      set({ sales });
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      set((state) => ({ loading: { ...state.loading, sales: false } }));
    }
  },

  addSale: async (saleData) => {
    try {
      const newSale: Sale = {
        ...saleData,
        id: crypto.randomUUID().slice(0, 8).toUpperCase(), // Short ID for sales
        createdAt: new Date(),
      };

      const sale = await localDb.addSale(newSale);
      set((state) => ({ sales: [sale, ...state.sales] }));

      // Update product stock after successful sale
      sale.items.forEach((item) => {
        get().updateStock(item.product.id, -item.quantity);
      });
    } catch (error) {
      console.error('Failed to add sale:', error);
      throw error;
    }
  },

  // Stock records
  fetchStockRecords: async () => {
    try {
      const stockRecords = await localDb.fetchStockRecords();
      set({ stockRecords });
    } catch (error) {
      console.error('Failed to fetch stock records:', error);
    }
  },

  addStockRecord: async (recordData) => {
    try {
      const newRecord: StockRecord = {
        ...recordData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      const record = await localDb.addStockRecord(newRecord);
      set((state) => ({ stockRecords: [record, ...state.stockRecords] }));
    } catch (error) {
      console.error('Failed to add stock record:', error);
      throw error;
    }
  },
}));
