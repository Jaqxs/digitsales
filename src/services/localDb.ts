import { Product, Sale, Customer, Employee, StockRecord } from '@/types/pos';

const STORAGE_KEYS = {
    PRODUCTS: 'zantrix_products',
    SALES: 'zantrix_sales',
    CUSTOMERS: 'zantrix_customers',
    EMPLOYEES: 'zantrix_employees',
    STOCK_RECORDS: 'zantrix_stock_records',
};

// Seed Data
const SEED_PRODUCTS: Product[] = [
    {
        id: 'p1',
        name: 'Cement (Simba)',
        sku: 'CEM-001',
        category: 'building-materials',
        description: '50kg Bag of Portland Cement',
        costPrice: 15000,
        sellingPrice: 18500,
        quantity: 100,
        lowStockThreshold: 20,
        unit: 'bag',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'p2',
        name: 'Iron Bar 12mm',
        sku: 'STL-012',
        category: 'construction-equipment',
        description: 'Standard 12mm Iron Bar',
        costPrice: 22000,
        sellingPrice: 28000,
        quantity: 50,
        lowStockThreshold: 10,
        unit: 'pc',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const SEED_EMPLOYEES: Employee[] = [
    {
        id: 'e1',
        name: 'John Doe',
        email: 'john@zantrix.com',
        role: 'sales',
        phone: '+255 123 456 789',
        salesTarget: 5000000,
        totalSales: 0,
        commission: 5,
        createdAt: new Date(),
    },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class LocalDbService {
    private get<T>(key: string): T[] {
        const data = localStorage.getItem(key);
        if (!data) return [];
        try {
            return JSON.parse(data, (key, value) => {
                // Simple date parser for keys that look like dates or ending in At
                if (typeof value === 'string' && (key.endsWith('At') || key === 'date')) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) return date;
                }
                return value;
            });
        } catch (e) {
            console.error(`Error parsing ${key} from localStorage`, e);
            return [];
        }
    }

    private set<T>(key: string, data: T[]): void {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // --- Products ---
    async fetchProducts(): Promise<Product[]> {
        await delay(300);
        const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (raw === null) {
            // Seed only if key doesn't exist
            this.set(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
            return SEED_PRODUCTS;
        }
        return this.get<Product>(STORAGE_KEYS.PRODUCTS);
    }

    async addProduct(product: Product): Promise<Product> {
        await delay(300);
        const products = this.get<Product>(STORAGE_KEYS.PRODUCTS);
        const newProduct = { ...product, createdAt: new Date() }; // Ensure date matches type (though it should be passed in)
        products.push(newProduct);
        this.set(STORAGE_KEYS.PRODUCTS, products);
        return newProduct;
    }

    async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
        await delay(200);
        const products = this.get<Product>(STORAGE_KEYS.PRODUCTS);
        const index = products.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Product not found');

        // Explicitly handle date strings if they come from JSON updates incorrectly
        const updatedProduct = { ...products[index], ...updates, updatedAt: new Date() };
        products[index] = updatedProduct;
        this.set(STORAGE_KEYS.PRODUCTS, products);
        return updatedProduct;
    }

    async deleteProduct(id: string): Promise<void> {
        await delay(200);
        const products = this.get<Product>(STORAGE_KEYS.PRODUCTS);
        const filtered = products.filter(p => p.id !== id);
        this.set(STORAGE_KEYS.PRODUCTS, filtered);
    }

    async updateStock(id: string, quantityChange: number): Promise<Product> {
        await delay(100);
        const products = this.get<Product>(STORAGE_KEYS.PRODUCTS);
        const index = products.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Product not found');

        const product = products[index];
        const newQuantity = product.quantity + quantityChange;
        const updatedProduct = { ...product, quantity: newQuantity, updatedAt: new Date() };

        products[index] = updatedProduct;
        this.set(STORAGE_KEYS.PRODUCTS, products);
        return updatedProduct;
    }

    // --- Customers ---
    async fetchCustomers(): Promise<Customer[]> {
        await delay(300);
        return this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
    }

    async addCustomer(customer: Customer): Promise<Customer> {
        await delay(300);
        const customers = this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
        customers.push(customer);
        this.set(STORAGE_KEYS.CUSTOMERS, customers);
        return customer;
    }

    async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
        await delay(200);
        const customers = this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
        const index = customers.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Customer not found');

        const updated = { ...customers[index], ...updates };
        customers[index] = updated;
        this.set(STORAGE_KEYS.CUSTOMERS, customers);
        return updated;
    }

    async deleteCustomer(id: string): Promise<void> {
        await delay(200);
        const customers = this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
        const filtered = customers.filter(c => c.id !== id);
        this.set(STORAGE_KEYS.CUSTOMERS, filtered);
    }

    // --- Employees ---
    async fetchEmployees(): Promise<Employee[]> {
        await delay(300);
        const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
        if (raw === null) {
            // Seed only if key doesn't exist
            this.set(STORAGE_KEYS.EMPLOYEES, SEED_EMPLOYEES);
            return SEED_EMPLOYEES;
        }
        return this.get<Employee>(STORAGE_KEYS.EMPLOYEES);
    }

    async addEmployee(employee: Employee): Promise<Employee> {
        await delay(300);
        const employees = this.get<Employee>(STORAGE_KEYS.EMPLOYEES);
        employees.push(employee);
        this.set(STORAGE_KEYS.EMPLOYEES, employees);
        return employee;
    }

    async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
        await delay(200);
        const employees = this.get<Employee>(STORAGE_KEYS.EMPLOYEES);
        const index = employees.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Employee not found');

        const updated = { ...employees[index], ...updates };
        employees[index] = updated;
        this.set(STORAGE_KEYS.EMPLOYEES, employees);
        return updated;
    }

    async deleteEmployee(id: string): Promise<void> {
        await delay(200);
        const employees = this.get<Employee>(STORAGE_KEYS.EMPLOYEES);
        const filtered = employees.filter(e => e.id !== id);
        this.set(STORAGE_KEYS.EMPLOYEES, filtered);
    }

    // --- Sales ---
    async fetchSales(): Promise<Sale[]> {
        await delay(300);
        return this.get<Sale>(STORAGE_KEYS.SALES).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async addSale(sale: Sale): Promise<Sale> {
        await delay(500);
        const sales = this.get<Sale>(STORAGE_KEYS.SALES);
        sales.push(sale);
        this.set(STORAGE_KEYS.SALES, sales);
        return sale;
    }

    // --- Stock Records ---
    async fetchStockRecords(): Promise<StockRecord[]> {
        await delay(300);
        return this.get<StockRecord>(STORAGE_KEYS.STOCK_RECORDS);
    }

    async addStockRecord(record: StockRecord): Promise<StockRecord> {
        await delay(200);
        const records = this.get<StockRecord>(STORAGE_KEYS.STOCK_RECORDS);
        records.push(record);
        this.set(STORAGE_KEYS.STOCK_RECORDS, records);
        return record;
    }
}

export const localDb = new LocalDbService();
