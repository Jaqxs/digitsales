import { persist } from 'zustand/middleware';

interface UserData {
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  sales: Sale[];
  stockRecords: StockRecord[];
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
  
  setCurrentUser: (userId: string | null) => void;
  
  // Locations
  locations: any[];
  fetchLocations: () => Promise<void>;

  // Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, quantityChange: number, type: 'in' | 'out' | 'adjustment', reason: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalPurchases'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'totalSales'> & { password?: string, employeeId?: string }) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;
}

const DEFAULT_USER_DATA: UserData = {
  products: MOCK_PRODUCTS,
  customers: MOCK_CUSTOMERS,
  employees: MOCK_EMPLOYEES,
  sales: MOCK_SALES,
  stockRecords: MOCK_STOCK_RECORDS,
};

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      loading: {
        products: false,
        customers: false,
        employees: false,
        sales: false,
        locations: false,
      },

      currentUserId: null,
      allUserData: {},
      
      ...DEFAULT_USER_DATA,
      
      locations: [
        { id: 'loc-001', name: 'Main Warehouse' },
        { id: 'loc-002', name: 'Front Store' },
        { id: 'loc-003', name: 'Yard Storage' },
      ],

      setCurrentUser: (userId) => {
        if (!userId) {
          set({ currentUserId: null, ...DEFAULT_USER_DATA });
          return;
        }
        const { allUserData } = get();
        const userData = allUserData[userId] || DEFAULT_USER_DATA;
        set({
          currentUserId: userId,
          ...userData
        });
      },

      // Helper to update state and sync with multi-user map
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
              }
            };
          }
          return newState;
        });
      },

      addProduct: async (productData) => {
        const newProduct: Product = {
          ...productData,
          id: `prod-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Product;
        get().syncAndSet({ products: [...get().products, newProduct] });
      },

      updateProduct: async (id, updates) => {
        get().syncAndSet({
          products: get().products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        });
      },

      deleteProduct: async (id) => {
        get().syncAndSet({ products: get().products.filter((p) => p.id !== id) });
      },

      updateStock: async (productId, quantityChange, type, reason) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const previous = product.quantity;
        const newQty = Math.max(0, previous + quantityChange);

        const newProducts = get().products.map((p) =>
          p.id === productId ? { ...p, quantity: newQty, updatedAt: new Date() } : p
        );
        
        const newRecords: StockRecord[] = [
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
            createdBy: 'admin@digitsales.io',
          },
          ...get().stockRecords,
        ];

        get().syncAndSet({ products: newProducts, stockRecords: newRecords });
      },

      addCustomer: async (customerData) => {
        const newCustomer: Customer = {
          ...customerData,
          id: `cust-${Date.now()}`,
          loyaltyPoints: 0,
          totalPurchases: 0,
          createdAt: new Date(),
        };
        get().syncAndSet({ customers: [...get().customers, newCustomer] });
      },

      updateCustomer: async (id, updates) => {
        get().syncAndSet({
          customers: get().customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        });
      },

      deleteCustomer: async (id) => {
        get().syncAndSet({ customers: get().customers.filter((c) => c.id !== id) });
      },

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
        get().syncAndSet({ employees: [...get().employees, newEmployee] });
      },

      updateEmployee: async (id, updates) => {
        get().syncAndSet({
          employees: get().employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        });
      },

      deleteEmployee: async (id) => {
        get().syncAndSet({ employees: get().employees.filter((e) => e.id !== id) });
      },

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
        get().syncAndSet({ sales: [newSale, ...get().sales] });
        return newSale;
      },

      fetchLocations: async () => {},
    }),
    {
      name: 'digitsales-multi-data',
    }
  )
);

