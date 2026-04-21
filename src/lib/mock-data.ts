/**
 * ─── MOCK DATA FOR PREVIEW MODE ───────────────────────────────────────────────
 * Realistic data for a hardware / construction supplies POS system.
 * Used when the backend is not running.
 */

import { Product, Customer, Employee, Sale, UserRole } from '@/types/pos';
import { StockRecord } from '@/stores/dataStore';

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001', name: 'Makita Angle Grinder 4"', sku: 'MKT-AG-001',
    barcode: '4902764012034', category: 'power-tools',
    description: '720W angle grinder with paddle switch', costPrice: 4500, sellingPrice: 6800,
    wholesalePrice: 6200, quantity: 34, lowStockThreshold: 10, supplier: 'Makita East Africa',
    unit: 'pcs', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'prod-002', name: 'Bosch Drill 13mm 500W', sku: 'BSH-DR-002',
    barcode: '3165140557023', category: 'power-tools',
    description: 'Corded drill with keyless chuck', costPrice: 5200, sellingPrice: 7500,
    wholesalePrice: 6900, quantity: 18, lowStockThreshold: 5, supplier: 'Bosch Kenya',
    unit: 'pcs', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-02-10'), updatedAt: new Date('2024-11-18'),
  },
  {
    id: 'prod-003', name: 'PVC Pipe 2" x 6m', sku: 'PVC-2-6M',
    barcode: '5901234123457', category: 'plumbing',
    description: 'Heavy duty PVC pressure pipe', costPrice: 320, sellingPrice: 480,
    wholesalePrice: 440, quantity: 120, lowStockThreshold: 30, supplier: 'Boresha Plumbers',
    unit: 'pcs', isTaxInclusive: true, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-11-15'),
  },
  {
    id: 'prod-004', name: 'PPR Elbow 25mm', sku: 'PPR-EL-25',
    barcode: '5901234123458', category: 'plumbing',
    description: '90° PPR elbow fitting', costPrice: 45, sellingPrice: 80,
    quantity: 350, lowStockThreshold: 100, supplier: 'Boresha Plumbers',
    unit: 'pcs', isTaxInclusive: true, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-11-10'),
  },
  {
    id: 'prod-005', name: 'Safety Helmet (Orange)', sku: 'SAF-HLM-OR',
    barcode: '6901480100009', category: 'safety-equipment',
    description: 'ANSI approved construction helmet', costPrice: 350, sellingPrice: 600,
    wholesalePrice: 540, quantity: 8, lowStockThreshold: 15, supplier: 'SafeGuard Ltd',
    unit: 'pcs', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-03-05'), updatedAt: new Date('2024-11-22'),
  },
  {
    id: 'prod-006', name: 'Cement Portland 50kg', sku: 'CEM-PO-50',
    barcode: '6001148018237', category: 'building-materials',
    description: 'Premium Portland cement bag', costPrice: 650, sellingPrice: 850,
    wholesalePrice: 790, quantity: 200, lowStockThreshold: 50, supplier: 'Savanna Cement',
    unit: 'bags', isTaxInclusive: true, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-11-25'),
  },
  {
    id: 'prod-007', name: 'M10 Hex Bolts (50pcs)', sku: 'FST-M10-HX',
    barcode: '7501031311309', category: 'fasteners',
    description: 'Galvanized M10 hex bolts with nuts', costPrice: 180, sellingPrice: 320,
    wholesalePrice: 280, quantity: 4, lowStockThreshold: 20, supplier: 'FastenPro',
    unit: 'boxes', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-11-10'),
  },
  {
    id: 'prod-008', name: 'Steel Wire 2mm x 100m', sku: 'STL-WR-2MM',
    barcode: '7501031311310', category: 'building-materials',
    description: 'Galvanized steel binding wire', costPrice: 1100, sellingPrice: 1600,
    wholesalePrice: 1450, quantity: 45, lowStockThreshold: 10, supplier: 'MetalWorks Kenya',
    unit: 'rolls', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-02-20'), updatedAt: new Date('2024-11-12'),
  },
  {
    id: 'prod-009', name: 'Hacksaw Frame Adjustable', sku: 'HND-HS-ADJ',
    barcode: '8901042440014', category: 'hand-tools',
    description: '12" adjustable hacksaw frame', costPrice: 220, sellingPrice: 380,
    wholesalePrice: 340, quantity: 22, lowStockThreshold: 8, supplier: 'ToolMaster',
    unit: 'pcs', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-03-10'), updatedAt: new Date('2024-11-08'),
  },
  {
    id: 'prod-010', name: 'Cable 2.5mm² Twin & Earth', sku: 'ELC-CB-2.5',
    barcode: '9501101000028', category: 'electrical',
    description: '2.5mm² T&E cable, 100m roll', costPrice: 3800, sellingPrice: 5200,
    wholesalePrice: 4800, quantity: 15, lowStockThreshold: 5, supplier: 'Kenwest Cables',
    unit: 'rolls', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-01-30'), updatedAt: new Date('2024-11-20'),
  },
  {
    id: 'prod-011', name: 'Safety Boots Steel Toe', sku: 'SAF-BT-STL',
    barcode: '6901480200001', category: 'safety-equipment',
    description: 'S3 rated steel toe safety boots', costPrice: 1800, sellingPrice: 2800,
    wholesalePrice: 2500, quantity: 12, lowStockThreshold: 6, supplier: 'SafeGuard Ltd',
    unit: 'pairs', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-03-15'), updatedAt: new Date('2024-11-05'),
  },
  {
    id: 'prod-012', name: 'Circular Saw 185mm 1200W', sku: 'MKT-CS-185',
    barcode: '4902764020008', category: 'power-tools',
    description: 'Makita circular saw with guide rail', costPrice: 8500, sellingPrice: 12000,
    wholesalePrice: 11000, quantity: 0, lowStockThreshold: 3, supplier: 'Makita East Africa',
    unit: 'pcs', isTaxInclusive: false, taxRate: 16, reservedQuantity: 0, bonusQuantity: 0,
    status: 'approved', createdAt: new Date('2024-04-01'), updatedAt: new Date('2024-11-01'),
  },
];

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cust-001', name: 'Kariuki Construction Ltd', email: 'orders@kariukiconst.co.ke', phone: '0722111222', address: 'Industrial Area, Nairobi', loyaltyPoints: 1450, totalPurchases: 284500, createdAt: new Date('2024-01-10') },
  { id: 'cust-002', name: 'Otieno Hardware Supplies', email: 'otieno@hardwaresupplies.co.ke', phone: '0733222333', address: 'Kisumu CBD', loyaltyPoints: 880, totalPurchases: 175200, createdAt: new Date('2024-02-05') },
  { id: 'cust-003', name: 'Wanjiku Plumbing Works', email: 'wanjiku@plumbingworks.co.ke', phone: '0700333444', address: 'Westlands, Nairobi', loyaltyPoints: 320, totalPurchases: 64000, createdAt: new Date('2024-03-20') },
  { id: 'cust-004', name: 'Mombasa Road Builders', email: 'procurement@mrbuilders.co.ke', phone: '0755444555', address: 'Mombasa Road, Nairobi', loyaltyPoints: 2100, totalPurchases: 421000, createdAt: new Date('2024-01-15') },
  { id: 'cust-005', name: 'Hassan Electrical Services', email: 'hassan@electricalservices.co.ke', phone: '0710555666', address: 'South B, Nairobi', loyaltyPoints: 560, totalPurchases: 112000, createdAt: new Date('2024-04-10') },
  { id: 'cust-006', name: 'Akinyi Building Solutions', email: 'akinyi@buildingsolutions.co.ke', phone: '0720666777', address: 'Thika Town', loyaltyPoints: 740, totalPurchases: 148800, createdAt: new Date('2024-02-28') },
  { id: 'cust-007', name: 'Peter Kamau (Individual)', phone: '0712777888', address: 'Kahawa West', loyaltyPoints: 45, totalPurchases: 9000, createdAt: new Date('2024-05-15') },
  { id: 'cust-008', name: 'Nakuru Development Corp', email: 'nd@nakurudev.co.ke', phone: '0786888999', address: 'Nakuru CBD', loyaltyPoints: 1870, totalPurchases: 374000, createdAt: new Date('2024-01-08') },
];

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp-001', name: 'Brian Mwangi', email: 'brian.mwangi@zantrixpos.com', role: 'admin' as UserRole, phone: '0700111001', salesTarget: 500000, totalSales: 687000, commission: 3.5, createdAt: new Date('2023-06-01') },
  { id: 'emp-002', name: 'Grace Achieng', email: 'grace.achieng@zantrixpos.com', role: 'manager' as UserRole, phone: '0700111002', salesTarget: 400000, totalSales: 512000, commission: 3.0, createdAt: new Date('2023-07-15') },
  { id: 'emp-003', name: 'James Kipchoge', email: 'james.kipchoge@zantrixpos.com', role: 'sales' as UserRole, phone: '0700111003', salesTarget: 250000, totalSales: 298000, commission: 2.5, createdAt: new Date('2023-09-01') },
  { id: 'emp-004', name: 'Fatuma Omar', email: 'fatuma.omar@zantrixpos.com', role: 'sales' as UserRole, phone: '0700111004', salesTarget: 250000, totalSales: 231000, commission: 2.5, createdAt: new Date('2024-01-10') },
  { id: 'emp-005', name: 'Kevin Njoroge', email: 'kevin.njoroge@zantrixpos.com', role: 'inventory' as UserRole, phone: '0700111005', salesTarget: 0, totalSales: 0, commission: 0, createdAt: new Date('2023-10-01') },
  { id: 'emp-006', name: 'Amina Wekesa', email: 'amina.wekesa@zantrixpos.com', role: 'stock_keeper' as UserRole, phone: '0700111006', salesTarget: 0, totalSales: 0, commission: 0, createdAt: new Date('2024-02-01') },
];

// ─── HELPER: create a sale ────────────────────────────────────────────────────

function makeSale(
  id: string,
  daysAgo: number,
  productIds: { id: string; qty: number; disc: number }[],
  customerId: string | undefined,
  employeeId: string,
  method: 'cash' | 'mpesa' | 'bank-transfer' | 'card',
  status: 'completed' | 'refunded' | 'partial-refund' | 'awaiting_delivery' = 'completed',
): Sale {
  const product = (pid: string) => MOCK_PRODUCTS.find(p => p.id === pid)!;
  const items = productIds.map(({ id: pid, qty, disc }) => ({
    product: product(pid),
    quantity: qty,
    discount: disc,
  }));
  const subtotal = items.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0);
  const discount = items.reduce((s, i) => s + i.discount, 0);
  const vat = Math.round((subtotal - discount) * 0.16);
  const total = subtotal - discount + vat;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));

  return { id, items, subtotal, discount, vat, total, paymentMethod: method, customerId, employeeId, createdAt: date, status };
}

// ─── SALES ────────────────────────────────────────────────────────────────────

export const MOCK_SALES: Sale[] = [
  makeSale('sale-001', 0,  [{ id: 'prod-001', qty: 2, disc: 0 }, { id: 'prod-009', qty: 3, disc: 150 }], 'cust-001', 'emp-003', 'mpesa'),
  makeSale('sale-002', 0,  [{ id: 'prod-006', qty: 10, disc: 500 }], 'cust-004', 'emp-003', 'bank-transfer'),
  makeSale('sale-003', 1,  [{ id: 'prod-002', qty: 1, disc: 0 }, { id: 'prod-010', qty: 2, disc: 200 }], 'cust-005', 'emp-004', 'cash'),
  makeSale('sale-004', 1,  [{ id: 'prod-003', qty: 5, disc: 0 }, { id: 'prod-004', qty: 20, disc: 100 }], 'cust-003', 'emp-004', 'mpesa'),
  makeSale('sale-005', 2,  [{ id: 'prod-005', qty: 4, disc: 0 }, { id: 'prod-011', qty: 2, disc: 0 }], 'cust-002', 'emp-003', 'bank-transfer'),
  makeSale('sale-006', 2,  [{ id: 'prod-008', qty: 3, disc: 300 }], 'cust-008', 'emp-003', 'cash'),
  makeSale('sale-007', 3,  [{ id: 'prod-001', qty: 5, disc: 500 }, { id: 'prod-007', qty: 10, disc: 0 }], 'cust-001', 'emp-003', 'bank-transfer'),
  makeSale('sale-008', 3,  [{ id: 'prod-006', qty: 20, disc: 1000 }], 'cust-004', 'emp-004', 'bank-transfer'),
  makeSale('sale-009', 5,  [{ id: 'prod-002', qty: 2, disc: 0 }], 'cust-006', 'emp-004', 'mpesa'),
  makeSale('sale-010', 5,  [{ id: 'prod-010', qty: 1, disc: 0 }, { id: 'prod-009', qty: 2, disc: 0 }], undefined, 'emp-003', 'cash'),
  makeSale('sale-011', 7,  [{ id: 'prod-003', qty: 10, disc: 200 }, { id: 'prod-004', qty: 30, disc: 0 }], 'cust-002', 'emp-003', 'bank-transfer'),
  makeSale('sale-012', 7,  [{ id: 'prod-012', qty: 1, disc: 0 }], 'cust-001', 'emp-004', 'mpesa'),
  makeSale('sale-013', 10, [{ id: 'prod-001', qty: 3, disc: 0 }, { id: 'prod-005', qty: 5, disc: 500 }], 'cust-008', 'emp-003', 'bank-transfer'),
  makeSale('sale-014', 10, [{ id: 'prod-006', qty: 15, disc: 800 }], 'cust-004', 'emp-003', 'bank-transfer'),
  makeSale('sale-015', 12, [{ id: 'prod-008', qty: 2, disc: 0 }], 'cust-007', 'emp-004', 'cash'),
  makeSale('sale-016', 14, [{ id: 'prod-002', qty: 1, disc: 0 }, { id: 'prod-001', qty: 1, disc: 0 }], 'cust-005', 'emp-003', 'mpesa'),
  makeSale('sale-017', 14, [{ id: 'prod-003', qty: 8, disc: 0 }, { id: 'prod-004', qty: 15, disc: 100 }], 'cust-003', 'emp-004', 'cash'),
  makeSale('sale-018', 17, [{ id: 'prod-010', qty: 3, disc: 300 }], 'cust-006', 'emp-003', 'bank-transfer'),
  makeSale('sale-019', 20, [{ id: 'prod-009', qty: 5, disc: 0 }, { id: 'prod-007', qty: 8, disc: 0 }], 'cust-002', 'emp-004', 'mpesa'),
  makeSale('sale-020', 20, [{ id: 'prod-006', qty: 25, disc: 1500 }], 'cust-008', 'emp-003', 'bank-transfer'),
  makeSale('sale-021', 23, [{ id: 'prod-011', qty: 3, disc: 0 }, { id: 'prod-005', qty: 2, disc: 0 }], 'cust-001', 'emp-004', 'cash'),
  makeSale('sale-022', 25, [{ id: 'prod-001', qty: 4, disc: 400 }], 'cust-004', 'emp-003', 'mpesa'),
  makeSale('sale-023', 28, [{ id: 'prod-002', qty: 2, disc: 0 }, { id: 'prod-010', qty: 1, disc: 0 }], 'cust-005', 'emp-003', 'bank-transfer'),
  makeSale('sale-024', 30, [{ id: 'prod-003', qty: 6, disc: 100 }], 'cust-003', 'emp-004', 'cash'),
  makeSale('sale-025', 35, [{ id: 'prod-006', qty: 30, disc: 2000 }], 'cust-008', 'emp-003', 'bank-transfer'),
  makeSale('sale-026', 40, [{ id: 'prod-012', qty: 1, disc: 1000 }], 'cust-001', 'emp-004', 'mpesa'),
  makeSale('sale-027', 45, [{ id: 'prod-008', qty: 5, disc: 0 }, { id: 'prod-007', qty: 20, disc: 0 }], 'cust-002', 'emp-003', 'bank-transfer'),
  makeSale('sale-028', 50, [{ id: 'prod-001', qty: 8, disc: 800 }], 'cust-004', 'emp-003', 'mpesa'),
  makeSale('sale-029', 55, [{ id: 'prod-010', qty: 4, disc: 400 }], 'cust-006', 'emp-004', 'bank-transfer'),
  makeSale('sale-030', 60, [{ id: 'prod-006', qty: 40, disc: 3000 }, { id: 'prod-008', qty: 6, disc: 0 }], 'cust-008', 'emp-003', 'bank-transfer'),
  // Refunded sale
  makeSale('sale-031', 8, [{ id: 'prod-002', qty: 1, disc: 0 }], 'cust-007', 'emp-004', 'cash', 'refunded'),
];

// ─── STOCK RECORDS ────────────────────────────────────────────────────────────

export const MOCK_STOCK_RECORDS: StockRecord[] = [
  { id: 'stk-001', productId: 'prod-001', productName: 'Makita Angle Grinder 4"', type: 'in', quantity: 20, previousStock: 14, newStock: 34, reason: 'Purchase order #PO-2024-011', createdAt: new Date(Date.now() - 2 * 86400000), createdBy: 'kevin.njoroge@zantrixpos.com' },
  { id: 'stk-002', productId: 'prod-005', productName: 'Safety Helmet (Orange)', type: 'out', quantity: 12, previousStock: 20, newStock: 8, reason: 'Sales order bulk dispatch', createdAt: new Date(Date.now() - 3 * 86400000), createdBy: 'amina.wekesa@zantrixpos.com' },
  { id: 'stk-003', productId: 'prod-012', productName: 'Circular Saw 185mm 1200W', type: 'out', quantity: 3, previousStock: 3, newStock: 0, reason: 'Sale to Kariuki Construction', createdAt: new Date(Date.now() - 5 * 86400000), createdBy: 'james.kipchoge@zantrixpos.com' },
  { id: 'stk-004', productId: 'prod-006', productName: 'Cement Portland 50kg', type: 'in', quantity: 100, previousStock: 100, newStock: 200, reason: 'Restocking from Savanna Cement', createdAt: new Date(Date.now() - 7 * 86400000), createdBy: 'kevin.njoroge@zantrixpos.com' },
  { id: 'stk-005', productId: 'prod-007', productName: 'M10 Hex Bolts (50pcs)', type: 'adjustment', quantity: -3, previousStock: 7, newStock: 4, reason: 'Stock count discrepancy correction', createdAt: new Date(Date.now() - 8 * 86400000), createdBy: 'amina.wekesa@zantrixpos.com' },
  { id: 'stk-006', productId: 'prod-003', productName: 'PVC Pipe 2" x 6m', type: 'in', quantity: 60, previousStock: 60, newStock: 120, reason: 'Purchase order #PO-2024-009', createdAt: new Date(Date.now() - 10 * 86400000), createdBy: 'kevin.njoroge@zantrixpos.com' },
  { id: 'stk-007', productId: 'prod-010', productName: 'Cable 2.5mm² Twin & Earth', type: 'in', quantity: 5, previousStock: 10, newStock: 15, reason: 'Purchase order #PO-2024-010', createdAt: new Date(Date.now() - 12 * 86400000), createdBy: 'kevin.njoroge@zantrixpos.com' },
  { id: 'stk-008', productId: 'prod-002', productName: 'Bosch Drill 13mm 500W', type: 'out', quantity: 2, previousStock: 20, newStock: 18, reason: 'Sales dispatch — invoice #INV-204', createdAt: new Date(Date.now() - 14 * 86400000), createdBy: 'james.kipchoge@zantrixpos.com' },
];
