# Zantrix POS Backend - Quick Start Implementation Guide

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Git for version control
- A code editor (VS Code recommended)

## Project Setup

### 1. Initialize Backend Project

```bash
# Create backend directory
mkdir zantrix-pos-backend
cd zantrix-pos-backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express cors helmet dotenv bcryptjs jsonwebtoken
npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken ts-node nodemon concurrently

# Install database dependencies
npm install pg drizzle-orm drizzle-kit
npm install -D @types/pg

# Install additional utilities
npm install zod winston morgan express-rate-limit
npm install -D @types/morgan
```

### 2. Project Structure Setup

```
zantrix-pos-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── environment.ts
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── validations/
│   └── app.ts
├── drizzle/
│   ├── migrations/
│   └── schema.ts
├── logs/
├── .env
├── .env.example
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 3. TypeScript Configuration

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 4. Environment Configuration

Create `.env.example`:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/zantrix_pos
DATABASE_SSL=false

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 5. Database Schema (Drizzle ORM)

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

Create `src/models/schema.ts`:
```typescript
import { pgTable, uuid, varchar, timestamp, boolean, decimal, integer, text, date, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'sales', 'inventory', 'support']);
export const customerTypeEnum = pgEnum('customer_type', ['individual', 'business', 'government']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'partial', 'paid', 'overpaid', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'mpesa', 'bank_transfer', 'cheque', 'credit']);
export const saleStatusEnum = pgEnum('sale_status', ['pending', 'completed', 'cancelled', 'refunded', 'on_credit']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('sales'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// User profiles
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  employeeId: varchar('employee_id', { length: 20 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Product categories
export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id').references(() => productCategories.id),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 50 }).unique().notNull(),
  barcode: varchar('barcode', { length: 100 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: uuid('category_id').notNull().references(() => productCategories.id),
  unit: varchar('unit', { length: 50 }).notNull().default('unit'),
  costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 15, scale: 2 }).notNull(),
  currentStock: decimal('current_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  minStockLevel: integer('min_stock_level').notNull().default(0),
  maxStockLevel: integer('max_stock_level'),
  isActive: boolean('is_active').notNull().default(true),
  isTaxable: boolean('is_taxable').notNull().default(true),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('18.00'),
  imageUrl: varchar('image_url', { length: 500 }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Customers
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerType: customerTypeEnum('customer_type').notNull().default('individual'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  companyName: varchar('company_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  taxId: varchar('tax_id', { length: 50 }),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  totalPurchases: decimal('total_purchases', { precision: 15, scale: 2 }).notNull().default('0'),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).default('0'),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Sales
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleNumber: varchar('sale_number', { length: 50 }).unique().notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  employeeId: uuid('employee_id').notNull().references(() => users.id),
  saleDate: timestamp('sale_date', { withTimezone: true }).defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }),

  // Financials
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),

  // Payment info
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('payment_method'),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull().default('0'),
  changeAmount: decimal('change_amount', { precision: 15, scale: 2 }).notNull().default('0'),

  // Status and notes
  status: saleStatusEnum('status').notNull().default('completed'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Sale items
export const saleItems = pgTable('sale_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  lineTotal: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);
export const insertSaleSchema = createInsertSchema(sales);
export const selectSaleSchema = createSelectSchema(sales);
```

### 6. Database Connection

Create `src/config/database.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema';

const connectionString = process.env.DATABASE_URL!;

// Create connection
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema, logger: true });

// Export for testing/cleanup
export const closeDb = () => client.end();
```

### 7. Basic Express App Setup

Create `src/app.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.use('/api/v1', (req, res) => {
  res.json({ message: 'Zantrix POS API v1' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

export default app;
```

### 8. Server Startup

Create `src/server.ts`:
```typescript
import app from './app';
import { closeDb } from './config/database';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Zantrix POS API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    closeDb().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    closeDb().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});
```

### 9. Package.json Scripts

Update `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"nodemon --exec ts-node src/server.ts\" \"drizzle-kit generate\" \"drizzle-kit migrate\"",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "lint": "eslint src/**/*.ts",
    "test": "jest"
  }
}
```

### 10. Database Setup & Migration

```bash
# Create database
createdb zantrix_pos

# Generate migration
npm run db:generate

# Run migration
npm run db:migrate

# Start development server
npm run dev
```

### 11. Basic Authentication Setup

Create `src/controllers/authController.ts`:
```typescript
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users, userProfiles } from '../models/schema';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user profile
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profile || null
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

This gives you a solid foundation to build upon. The complete implementation would continue with:
- Authentication middleware
- Product management endpoints
- Sales processing
- Customer management
- Inventory tracking
- And all other features outlined in the main plan.

Would you like me to continue with implementing any specific part of the backend?
