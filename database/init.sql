-- Zantrix POS System Database Schema
-- Complete database initialization for PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- ENUM TYPES
-- ==========================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales', 'inventory', 'support');

-- Customer types
CREATE TYPE customer_type AS ENUM ('individual', 'business', 'government');

-- Location types
CREATE TYPE location_type AS ENUM ('warehouse', 'store', 'showroom', 'workshop');

-- Stock transaction types
CREATE TYPE stock_transaction_type AS ENUM ('in', 'out', 'adjustment', 'transfer');

-- Adjustment types
CREATE TYPE adjustment_type AS ENUM ('damaged', 'lost', 'found', 'correction', 'initial');

-- Payment statuses
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overpaid', 'refunded');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'mpesa', 'bank_transfer', 'cheque', 'credit');

-- Sale statuses
CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded', 'on_credit');

-- Purchase order statuses
CREATE TYPE po_status AS ENUM ('draft', 'approved', 'ordered', 'partial', 'received', 'cancelled');

-- Account types for chart of accounts
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'sales',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extends users)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    employee_id VARCHAR(20) UNIQUE, -- For integration with legacy systems
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCT MANAGEMENT
-- ==========================================

-- Product categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id), -- For subcategories
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products master table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES product_categories(id),
    unit VARCHAR(50) NOT NULL DEFAULT 'unit', -- piece, kg, meter, liter, etc.
    cost_price DECIMAL(15,2) NOT NULL CHECK (cost_price >= 0),
    selling_price DECIMAL(15,2) NOT NULL CHECK (selling_price >= 0),
    wholesale_price DECIMAL(15,2), -- Optional wholesale pricing
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    max_stock_level INTEGER,
    current_stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_taxable BOOLEAN NOT NULL DEFAULT true,
    tax_rate DECIMAL(5,2) DEFAULT 18.00, -- Tanzania VAT rate
    image_url VARCHAR(500),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (for products with multiple options)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- e.g., "Size", "Color"
    variant_value VARCHAR(100) NOT NULL, -- e.g., "Large", "Red"
    sku_suffix VARCHAR(20), -- Additional SKU identifier
    additional_price DECIMAL(10,2) DEFAULT 0,
    stock_adjustment DECIMAL(8,3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers/Vendors
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(100),
    payment_terms VARCHAR(100), -- e.g., "Net 30", "COD"
    tax_id VARCHAR(50), -- TIN for Tanzania
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product suppliers (many-to-many)
CREATE TABLE product_suppliers (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    supplier_sku VARCHAR(50), -- Supplier's SKU for this product
    lead_time_days INTEGER,
    minimum_order_quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (product_id, supplier_id)
);

-- ==========================================
-- INVENTORY MANAGEMENT
-- ==========================================

-- Stock locations (warehouses, stores, etc.)
CREATE TABLE stock_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type location_type NOT NULL DEFAULT 'warehouse',
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock ledger (tracks all stock movements)
CREATE TABLE stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    location_id UUID REFERENCES stock_locations(id),
    transaction_type stock_transaction_type NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    previous_stock DECIMAL(12,3) NOT NULL,
    new_stock DECIMAL(12,3) NOT NULL,
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', 'transfer'
    reference_id UUID, -- ID of the related transaction
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock adjustments (for manual corrections)
CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    location_id UUID REFERENCES stock_locations(id),
    adjustment_type adjustment_type NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SALES & CUSTOMERS
-- ==========================================

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_type customer_type NOT NULL DEFAULT 'individual',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100), -- Tanzania regions
    postal_code VARCHAR(20),
    tax_id VARCHAR(50), -- TIN for business customers
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    total_purchases DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales transactions
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated
    customer_id UUID REFERENCES customers(id),
    employee_id UUID NOT NULL REFERENCES users(id), -- Sales person
    location_id UUID REFERENCES stock_locations(id),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE, -- For credit sales

    -- Financials
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2),
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    -- Payment info
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Status and notes
    status sale_status NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items (line items)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2),
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_reference VARCHAR(255), -- M-Pesa ref, card transaction ID, etc.
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PURCHASE ORDERS & PROCUREMENT
-- ==========================================

-- Purchase orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    location_id UUID REFERENCES stock_locations(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    status po_status NOT NULL DEFAULT 'draft',

    -- Financials
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Tracking
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    received_by UUID REFERENCES users(id),
    received_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_ordered DECIMAL(10,3) NOT NULL,
    quantity_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ACCOUNTING & FINANCIAL
-- ==========================================

-- Chart of accounts (basic structure)
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type account_type NOT NULL,
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General ledger entries
CREATE TABLE general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    description TEXT,
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'payment', etc.
    reference_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- EMPLOYEE TARGETS & PERFORMANCE
-- ==========================================

-- Employee targets (monthly/quarterly/annual goals)
CREATE TABLE employee_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type target_type NOT NULL DEFAULT 'monthly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sales_target DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_target DECIMAL(15,2) NOT NULL DEFAULT 0,
    customer_target INTEGER NOT NULL DEFAULT 0, -- Number of customers to acquire
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Commission percentage
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE target_type AS ENUM ('monthly', 'quarterly', 'annual');

-- Target achievements/progress tracking
CREATE TABLE target_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES employee_targets(id) ON DELETE CASCADE,
    period_date DATE NOT NULL,
    sales_achieved DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_achieved DECIMAL(15,2) NOT NULL DEFAULT 0,
    customers_acquired INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Products indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_created_by ON products(created_by);

-- Product variants index
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- Suppliers indexes
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_suppliers_created_by ON suppliers(created_by);

-- Stock ledger indexes
CREATE INDEX idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_stock_ledger_location ON stock_ledger(location_id);
CREATE INDEX idx_stock_ledger_created_at ON stock_ledger(created_at);
CREATE INDEX idx_stock_ledger_reference ON stock_ledger(reference_type, reference_id);

-- Stock adjustments indexes
CREATE INDEX idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);

-- Customers indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_created_by ON customers(created_by);

-- Sales indexes
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_employee ON sales(employee_id);
CREATE INDEX idx_sales_location ON sales(location_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_sale_number ON sales(sale_number);

-- Sale items indexes
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Payment transactions indexes
CREATE INDEX idx_payment_transactions_sale ON payment_transactions(sale_id);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(payment_date);

-- Purchase orders indexes
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Purchase order items indexes
CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(po_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- General ledger indexes
CREATE INDEX idx_general_ledger_account ON general_ledger(account_id);
CREATE INDEX idx_general_ledger_date ON general_ledger(transaction_date);
CREATE INDEX idx_general_ledger_reference ON general_ledger(reference_type, reference_id);

-- Employee targets indexes
CREATE INDEX idx_employee_targets_employee ON employee_targets(employee_id);
CREATE INDEX idx_employee_targets_period ON employee_targets(period_start, period_end);
CREATE INDEX idx_employee_targets_type ON employee_targets(target_type);

-- Target achievements indexes
CREATE INDEX idx_target_achievements_target ON target_achievements(target_id);
CREATE INDEX idx_target_achievements_date ON target_achievements(period_date);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_targets_updated_at BEFORE UPDATE ON employee_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ==========================================

-- Function to generate sale numbers
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
    current_date TEXT;
    next_number INTEGER;
    sale_number TEXT;
BEGIN
    current_date := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM sales
    WHERE sale_number LIKE 'SALE-' || current_date || '-%';

    sale_number := 'SALE-' || current_date || '-' || LPAD(next_number::TEXT, 4, '0');
    RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    current_date TEXT;
    next_number INTEGER;
    po_number TEXT;
BEGIN
    current_date := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM purchase_orders
    WHERE po_number LIKE 'PO-' || current_date || '-%';

    po_number := 'PO-' || current_date || '-' || LPAD(next_number::TEXT, 4, '0');
    RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock(p_product_id UUID, p_quantity DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET current_stock = current_stock + p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- INITIAL DATA SEEDING
-- ==========================================

-- Insert default admin user (password: admin123 - hashed)
INSERT INTO users (email, password_hash, role) VALUES
('admin@zantrix.com', '$2b$10$rOz8vZxKJ9vJcH8v8vJcHO8vJcH8vJcH8vJcH8vJcH8vJcH8vJcH', 'admin');

-- Insert default product categories
INSERT INTO product_categories (name, description, sort_order) VALUES
('Construction Tools', 'Power tools, hand tools, and construction equipment', 1),
('Building Materials', 'Cement, bricks, timber, and other building materials', 2),
('Plumbing', 'Pipes, fittings, and plumbing supplies', 3),
('Electrical', 'Wiring, switches, and electrical components', 4),
('Safety Equipment', 'PPE, safety gear, and protective equipment', 5),
('Hardware', 'Nails, screws, fasteners, and general hardware', 6),
('Paint & Finishes', 'Paint, varnish, and finishing products', 7);

-- Insert default stock location
INSERT INTO stock_locations (name, type, address) VALUES
('Main Warehouse', 'warehouse', '123 Main Street, Dar es Salaam'),
('Retail Store', 'store', '456 Commerce Avenue, Dar es Salaam');

-- Insert basic chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
('1000', 'Cash', 'asset'),
('1100', 'Accounts Receivable', 'asset'),
('1200', 'Inventory', 'asset'),
('2000', 'Accounts Payable', 'liability'),
('3000', 'Owner Equity', 'equity'),
('4000', 'Sales Revenue', 'revenue'),
('5000', 'Cost of Goods Sold', 'expense'),
('5100', 'Operating Expenses', 'expense');

-- ==========================================
-- EMPLOYEE TARGETS & PERFORMANCE
-- ==========================================

-- Employee targets and performance tracking
CREATE TABLE employee_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type target_type NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    period target_period NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    commission_rate DECIMAL(5,2), -- Percentage commission on target achievement
    bonus_amount DECIMAL(15,2) DEFAULT 0, -- Fixed bonus on target achievement
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE target_type AS ENUM ('sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion');
CREATE TYPE target_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Add triggers for updated_at
CREATE TRIGGER update_employee_targets_updated_at BEFORE UPDATE ON employee_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for employee targets
CREATE INDEX idx_employee_targets_user ON employee_targets(user_id);
CREATE INDEX idx_employee_targets_period ON employee_targets(start_date, end_date);
CREATE INDEX idx_employee_targets_active ON employee_targets(is_active);
CREATE INDEX idx_employee_targets_created_by ON employee_targets(created_by);

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- Product stock summary view
CREATE VIEW product_stock_summary AS
SELECT
    p.id,
    p.sku,
    p.name,
    p.current_stock,
    p.min_stock_level,
    p.max_stock_level,
    CASE
        WHEN p.current_stock <= p.min_stock_level THEN 'Low Stock'
        WHEN p.current_stock > p.max_stock_level THEN 'Overstock'
        ELSE 'Normal'
    END as stock_status,
    pc.name as category_name,
    sl.name as location_name
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN stock_locations sl ON sl.id = (
    SELECT location_id
    FROM stock_ledger
    WHERE product_id = p.id
    ORDER BY created_at DESC
    LIMIT 1
)
WHERE p.is_active = true;

-- Sales summary view
CREATE VIEW sales_summary AS
SELECT
    s.id,
    s.sale_number,
    s.sale_date,
    s.total_amount,
    s.payment_status,
    s.status,
    c.first_name || ' ' || c.last_name as customer_name,
    c.company_name,
    u.first_name || ' ' || u.last_name as employee_name,
    COUNT(si.id) as item_count
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN user_profiles u ON s.employee_id = u.user_id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.sale_number, s.sale_date, s.total_amount, s.payment_status, s.status,
         c.first_name, c.last_name, c.company_name, u.first_name, u.last_name;

-- Customer purchase summary view
CREATE VIEW customer_purchase_summary AS
SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.company_name,
    c.email,
    c.loyalty_points,
    c.total_purchases,
    c.current_balance,
    COUNT(s.id) as total_sales,
    MAX(s.sale_date) as last_purchase_date,
    AVG(s.total_amount) as avg_sale_amount
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id AND s.status = 'completed'
WHERE c.is_active = true
GROUP BY c.id, c.first_name, c.last_name, c.company_name, c.email,
         c.loyalty_points, c.total_purchases, c.current_balance;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded based on role requirements)
-- These are placeholder policies - actual policies should be implemented based on business rules

-- ==========================================
-- DATABASE COMPLETED
-- ==========================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Zantrix POS Database schema created successfully!';
END $$;
