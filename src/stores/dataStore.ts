import { create } from 'zustand';
import { Product, Customer, Employee, Sale, CartItem, PaymentMethod, ProductCategory } from '@/types/pos';
import { mockProducts, mockEmployees, mockCustomers } from '@/data/mock-data';

interface DataStore {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, quantity: number) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalPurchases'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'totalSales'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void;

  // Stock records
  stockRecords: StockRecord[];
  addStockRecord: (record: Omit<StockRecord, 'id' | 'createdAt'>) => void;
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

let productIdCounter = 100;
let customerIdCounter = 100;
let employeeIdCounter = 100;
let saleIdCounter = 1250;
let stockRecordIdCounter = 1;

export const useDataStore = create<DataStore>((set, get) => ({
  products: [...mockProducts],
  customers: [
    ...mockCustomers,
    {
      id: '3',
      name: 'Dodoma Builders',
      email: 'sales@dodomabuilders.co.tz',
      phone: '+255 744 555 000',
      address: 'Dodoma City Center',
      loyaltyPoints: 5200,
      totalPurchases: 45000000,
      createdAt: new Date('2024-02-18'),
    },
    {
      id: '4',
      name: 'Arusha Hardware',
      email: 'info@arushahardware.co.tz',
      phone: '+255 788 123 456',
      address: 'Arusha Town',
      loyaltyPoints: 3800,
      totalPurchases: 32000000,
      createdAt: new Date('2024-04-10'),
    },
    {
      id: '5',
      name: 'Morogoro Construction',
      email: 'orders@morogoroconst.co.tz',
      phone: '+255 755 999 888',
      address: 'Morogoro CBD',
      loyaltyPoints: 2100,
      totalPurchases: 18500000,
      createdAt: new Date('2024-06-05'),
    },
  ],
  employees: [...mockEmployees],
  sales: [],
  stockRecords: [],

  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: String(++productIdCounter),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  updateStock: (id, quantityChange) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(0, p.quantity + quantityChange), updatedAt: new Date() } : p
      ),
    }));
  },

  addCustomer: (customer) => {
    const newCustomer: Customer = {
      ...customer,
      id: String(++customerIdCounter),
      loyaltyPoints: 0,
      totalPurchases: 0,
      createdAt: new Date(),
    };
    set((state) => ({ customers: [...state.customers, newCustomer] }));
  },

  updateCustomer: (id, updates) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCustomer: (id) => {
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
  },

  addEmployee: (employee) => {
    const newEmployee: Employee = {
      ...employee,
      id: String(++employeeIdCounter),
      totalSales: 0,
      createdAt: new Date(),
    };
    set((state) => ({ employees: [...state.employees, newEmployee] }));
  },

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  deleteEmployee: (id) => {
    set((state) => ({ employees: state.employees.filter((e) => e.id !== id) }));
  },

  addSale: (sale) => {
    const newSale: Sale = {
      ...sale,
      id: String(++saleIdCounter),
      createdAt: new Date(),
    };
    // Update product stock
    sale.items.forEach((item) => {
      get().updateStock(item.product.id, -item.quantity);
    });
    set((state) => ({ sales: [newSale, ...state.sales] }));
  },

  addStockRecord: (record) => {
    const newRecord: StockRecord = {
      ...record,
      id: String(++stockRecordIdCounter),
      createdAt: new Date(),
    };
    set((state) => ({ stockRecords: [newRecord, ...state.stockRecords] }));
  },
}));
