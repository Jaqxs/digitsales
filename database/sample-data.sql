-- Zantrix POS System Sample Data
-- Run this after init.sql to populate the database with sample data

-- ==========================================
-- SAMPLE CUSTOMERS
-- ==========================================

INSERT INTO customers (name, email, phone, address, customer_type, created_at) VALUES
('Mwanza Construction Ltd', 'orders@mwanzaconst.co.tz', '+255 712 345 678', 'Nyamagana, Mwanza', 'business', NOW()),
('Dar Hardware Store', 'info@darhardware.co.tz', '+255 754 321 000', 'Kariakoo, Dar es Salaam', 'business', NOW()),
('Arusha Builders Co.', 'contact@arushabuilders.co.tz', '+255 765 432 100', 'Sokon II, Arusha', 'business', NOW()),
('Dodoma Cement Supply', 'sales@dodomacement.co.tz', '+255 713 456 789', 'Central Business District, Dodoma', 'business', NOW()),
('Tanga Construction Materials', 'info@tangaconst.co.tz', '+255 714 567 890', 'Port Area, Tanga', 'business', NOW()),
('John Kamau', 'john.kamau@email.com', '+255 712 111 222', 'Mikocheni, Dar es Salaam', 'individual', NOW()),
('Grace Mushi', 'grace.mushi@email.com', '+255 713 222 333', 'Masaki, Dar es Salaam', 'individual', NOW()),
('Walk-in Customer', NULL, NULL, NULL, 'individual', NOW());

-- ==========================================
-- SAMPLE PRODUCTS
-- ==========================================

INSERT INTO products (name, sku, barcode, category, description, cost_price, selling_price, quantity, low_stock_threshold, supplier, unit, category_id, location_id, created_at) VALUES
('Heavy Duty Cement Mixer', 'CON-000001', '8901234567890', 'construction-equipment', 'Industrial cement mixer with 350L capacity', 2500000, 3200000, 8, 3, 'BuildPro Supplies', 'unit', (SELECT id FROM product_categories WHERE name = 'Construction Tools'), (SELECT id FROM stock_locations WHERE name = 'Main Warehouse'), NOW()),
('Bosch Professional Drill', 'PWR-000002', '8901234567891', 'power-tools', '18V Cordless hammer drill with battery', 450000, 650000, 25, 5, 'Bosch Tanzania', 'unit', (SELECT id FROM product_categories WHERE name = 'Construction Tools'), (SELECT id FROM stock_locations WHERE name = 'Retail Store'), NOW()),
('Steel Scaffolding Set', 'CON-000003', '8901234567892', 'construction-equipment', 'Complete scaffolding set - 10 sections', 1800000, 2400000, 4, 2, 'SafeHeight Ltd', 'set', (SELECT id FROM product_categories WHERE name = 'Construction Tools'), (SELECT id FROM stock_locations WHERE name = 'Main Warehouse'), NOW()),
('Stanley Hammer 20oz', 'HND-000004', '8901234567893', 'hand-tools', 'Professional claw hammer with fiberglass handle', 35000, 55000, 120, 20, 'Stanley Works TZ', 'unit', (SELECT id FROM product_categories WHERE name = 'Hardware'), (SELECT id FROM stock_locations WHERE name = 'Retail Store'), NOW()),
('PVC Pipe 4" (per meter)', 'PLB-000005', '8901234567894', 'plumbing', 'Heavy duty PVC pipe for drainage', 8000, 12000, 500, 50, 'PipeMaster Co', 'meter', (SELECT id FROM product_categories WHERE name = 'Plumbing'), (SELECT id FROM stock_locations WHERE name = 'Main Warehouse'), NOW()),
('Electrical Wire Roll (100m)', 'ELC-000006', '8901234567895', 'electrical', '2.5mm copper wire for residential use', 180000, 250000, 45, 10, 'Prysmian Tanzania', 'roll', (SELECT id FROM product_categories WHERE name = 'Electrical'), (SELECT id FROM stock_locations WHERE name = 'Retail Store'), NOW()),
('Safety Helmet (Yellow)', 'SAF-000007', '8901234567896', 'safety-equipment', 'OSHA approved construction helmet', 15000, 25000, 200, 30, '3M Tanzania', 'unit', (SELECT id FROM product_categories WHERE name = 'Safety Equipment'), (SELECT id FROM stock_locations WHERE name = 'Retail Store'), NOW()),
('Concrete Nails (5kg box)', 'FST-000008', '8901234567897', 'fasteners', 'Galvanized concrete nails 3 inch', 45000, 70000, 85, 15, 'FastFix Supplies', 'box', (SELECT id FROM product_categories WHERE name = 'Hardware'), (SELECT id FROM stock_locations WHERE name = 'Main Warehouse'), NOW()),
('Portland Cement (50kg)', 'BLD-000009', '8901234567898', 'building-materials', 'Type I Portland cement bag', 22000, 32000, 350, 50, 'Twiga Cement', 'bag', (SELECT id FROM product_categories WHERE name = 'Building Materials'), (SELECT id FROM stock_locations WHERE name = 'Main Warehouse'), NOW()),
('Angle Grinder 7"', 'PWR-000010', '8901234567899', 'power-tools', 'DeWalt industrial angle grinder', 320000, 480000, 2, 5, 'DeWalt Africa', 'unit', (SELECT id FROM product_categories WHERE name = 'Construction Tools'), (SELECT id FROM stock_locations WHERE name = 'Retail Store'), NOW()),
('Steel Rebars (12mm)', 'BLD-000011', '8901234567800', 'building-materials', 'High tensile steel rebars per meter', 12000, 18000, 2000, 100, 'SteelCorp TZ', 'meter', (SELECT id FROM product_categories WHERE name = 'Building Materials'), (SELECT id FROM stock_locations WHERE name = 'Main Warehouse'), NOW()),
('Paint Brush Set', 'PNT-000012', '8901234567801', 'paint-finishes', 'Professional paint brush set (5pcs)', 25000, 40000, 75, 15, 'Dulux Tanzania', 'set', (SELECT id FROM product_categories WHERE name = 'Paint & Finishes'), (SELECT id FROM stock_locations WHERE name = 'Retail Store'), NOW());

-- ==========================================
-- SAMPLE SALES
-- ==========================================

-- Insert sales records
INSERT INTO sales (customer_id, total, payment_method, payment_status, status, created_at, updated_at) VALUES
((SELECT id FROM customers WHERE name = 'Mwanza Construction Ltd'), 2450000, 'mpesa', 'paid', 'completed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
((SELECT id FROM customers WHERE name = 'Walk-in Customer'), 680000, 'cash', 'paid', 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
((SELECT id FROM customers WHERE name = 'Dar Hardware Store'), 4250000, 'bank_transfer', 'paid', 'completed', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
((SELECT id FROM customers WHERE name = 'Walk-in Customer'), 55000, 'cash', 'paid', 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
((SELECT id FROM customers WHERE name = 'Arusha Builders Co.'), 3180000, 'card', 'paid', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
((SELECT id FROM customers WHERE name = 'Walk-in Customer'), 275000, 'mpesa', 'paid', 'completed', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 2 hours'),
((SELECT id FROM customers WHERE name = 'Dodoma Cement Supply'), 1280000, 'bank_transfer', 'paid', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
((SELECT id FROM customers WHERE name = 'John Kamau'), 95000, 'cash', 'paid', 'completed', NOW() - INTERVAL '2 days 3 hours', NOW() - INTERVAL '2 days 3 hours');

-- Get sale IDs for sale items
-- Note: In a real scenario, you'd use the returned IDs from the INSERT above

-- Sample sale items (assuming sale IDs start from 1)
INSERT INTO sale_items (sale_id, product_id, quantity, price, line_total) VALUES
(1, (SELECT id FROM products WHERE sku = 'CON-000001'), 1, 3200000, 3200000),
(1, (SELECT id FROM products WHERE sku = 'PWR-000002'), 2, 650000, 1300000),
(1, (SELECT id FROM products WHERE sku = 'CON-000003'), 1, 2400000, 2400000),

(2, (SELECT id FROM products WHERE sku = 'PWR-000010'), 1, 480000, 480000),
(2, (SELECT id FROM products WHERE sku = 'HND-000004'), 4, 55000, 220000),

(3, (SELECT id FROM products WHERE sku = 'BLD-000009'), 50, 32000, 1600000),
(3, (SELECT id FROM products WHERE sku = 'FST-000008'), 10, 70000, 700000),
(3, (SELECT id FROM products WHERE sku = 'PLB-000005'), 200, 12000, 2400000),

(4, (SELECT id FROM products WHERE sku = 'HND-000004'), 1, 55000, 55000),

(5, (SELECT id FROM products WHERE sku = 'CON-000001'), 1, 3200000, 3200000),
(5, (SELECT id FROM products WHERE sku = 'BLD-000011'), 100, 18000, 1800000),

(6, (SELECT id FROM products WHERE sku = 'ELC-000006'), 1, 250000, 250000),
(6, (SELECT id FROM products WHERE sku = 'SAF-000007'), 3, 25000, 75000),

(7, (SELECT id FROM products WHERE sku = 'BLD-000009'), 40, 32000, 1280000),

(8, (SELECT id FROM products WHERE sku = 'HND-000004'), 1, 55000, 55000),
(8, (SELECT id FROM products WHERE sku = 'PNT-000012'), 1, 40000, 40000);

-- ==========================================
-- SAMPLE EMPLOYEES
-- ==========================================

INSERT INTO employees (name, email, phone, role, salary, commission, is_active, created_at) VALUES
('Amina Juma', 'amina@zantrix.co.tz', '+255 712 345 678', 'admin', 800000, 5, true, NOW()),
('John Mwanga', 'john@zantrix.co.tz', '+255 713 456 789', 'sales', 500000, 3, true, NOW()),
('Grace Mushi', 'grace@zantrix.co.tz', '+255 714 567 890', 'inventory', 450000, 0, true, NOW()),
('Peter Kimaro', 'peter@zantrix.co.tz', '+255 715 678 901', 'sales', 480000, 4, true, NOW()),
('Sarah Nkomo', 'sarah@zantrix.co.tz', '+255 716 789 012', 'support', 400000, 0, true, NOW());

-- ==========================================
-- UPDATE STOCK QUANTITIES
-- ==========================================

-- Update product quantities based on sales
UPDATE products SET quantity = quantity - 1 WHERE sku = 'CON-000001';
UPDATE products SET quantity = quantity - 2 WHERE sku = 'PWR-000002';
UPDATE products SET quantity = quantity - 1 WHERE sku = 'CON-000003';
UPDATE products SET quantity = quantity - 1 WHERE sku = 'PWR-000010';
UPDATE products SET quantity = quantity - 4 WHERE sku = 'HND-000004';
UPDATE products SET quantity = quantity - 50 WHERE sku = 'BLD-000009';
UPDATE products SET quantity = quantity - 10 WHERE sku = 'FST-000008';
UPDATE products SET quantity = quantity - 200 WHERE sku = 'PLB-000005';
UPDATE products SET quantity = quantity - 100 WHERE sku = 'BLD-000011';
UPDATE products SET quantity = quantity - 1 WHERE sku = 'ELC-000006';
UPDATE products SET quantity = quantity - 3 WHERE sku = 'SAF-000007';
UPDATE products SET quantity = quantity - 1 WHERE sku = 'PNT-000012';

-- ==========================================
-- SAMPLE STOCK RECORDS
-- ==========================================

INSERT INTO stock_records (product_id, type, quantity, previous_stock, new_stock, reason, created_by, created_at) VALUES
((SELECT id FROM products WHERE sku = 'BLD-000009'), 'in', 100, 250, 350, 'Initial stock', 'System', NOW() - INTERVAL '30 days'),
((SELECT id FROM products WHERE sku = 'CON-000001'), 'in', 10, 0, 8, 'New shipment', 'System', NOW() - INTERVAL '15 days'),
((SELECT id FROM products WHERE sku = 'PWR-000002'), 'out', 5, 30, 25, 'Sale adjustment', 'System', NOW() - INTERVAL '2 days');

-- ==========================================
-- UPDATE CUSTOMER LOYALTY POINTS
-- ==========================================

UPDATE customers SET
  loyalty_points = 15000,
  total_purchases = 125000000
WHERE name = 'Mwanza Construction Ltd';

UPDATE customers SET
  loyalty_points = 8500,
  total_purchases = 78500000
WHERE name = 'Dar Hardware Store';

UPDATE customers SET
  loyalty_points = 2500,
  total_purchases = 18500000
WHERE name = 'Arusha Builders Co.';

-- ==========================================
-- UPDATE EMPLOYEE SALES TARGETS AND PERFORMANCE
-- ==========================================

UPDATE employees SET
  total_sales = 45000,
  sales_target = 50000
WHERE name = 'Amina Juma';

UPDATE employees SET
  total_sales = 28000,
  sales_target = 30000
WHERE name = 'John Mwanga';

UPDATE employees SET
  total_sales = 32000,
  sales_target = 35000
WHERE name = 'Peter Kimaro';
