import { z } from 'zod';

// Create employee validation schema
export const createEmployeeSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
    role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support', 'stock_keeper'], {
      errorMap: () => ({ message: 'Invalid role. Must be one of: admin, manager, sales, inventory, support, stock_keeper' })
    }),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters'),
    phone: z
      .string()
      .optional(),
    employeeId: z
      .string()
      .max(20, 'Employee ID must be less than 20 characters')
      .optional(),
  }),
});

// Update employee validation schema
export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee ID format'),
  }),
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .optional(),
    role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support', 'stock_keeper'], {
      errorMap: () => ({ message: 'Invalid role. Must be one of: admin, manager, sales, inventory, support, stock_keeper' })
    }).optional(),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters')
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters')
      .optional(),
    phone: z
      .string()
      .optional(),
    employeeId: z
      .string()
      .max(20, 'Employee ID must be less than 20 characters')
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

// Get employees query schema
export const getEmployeesSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).refine(val => val > 0, 'Page must be greater than 0').optional(),
    limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
    search: z.string().optional(),
    role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support', 'stock_keeper']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

// Delete employee schema
export const deleteEmployeeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee ID format'),
  }),
});

// Employee Targets Validation

// Create employee target validation schema
export const createEmployeeTargetSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion'], {
      errorMap: () => ({ message: 'Invalid target type. Must be one of: sales_revenue, sales_quantity, customer_acquisition, profit_margin, task_completion' })
    }),
    targetValue: z.number().positive('Target value must be positive'),
    period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format'),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format'),
    commissionRate: z.number().min(0).max(100).optional(),
    bonusAmount: z.number().min(0).optional(),
  }).refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  ),
});

// Update employee target validation schema
export const updateEmployeeTargetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid target ID format'),
  }),
  body: z.object({
    targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion']).optional(),
    targetValue: z.number().positive('Target value must be positive').optional(),
    period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format').optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format').optional(),
    isActive: z.boolean().optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    bonusAmount: z.number().min(0).optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  ),
});

// Get employee targets query schema
export const getEmployeeTargetsSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion']).optional(),
    period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().transform(val => parseInt(val)).refine(val => val > 0, 'Page must be greater than 0').optional(),
    limit: z.string().transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
  }),
});

// Update target progress schema
export const updateTargetProgressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid target ID format'),
  }),
  body: z.object({
    currentValue: z.number().min(0, 'Current value cannot be negative'),
    notes: z.string().optional(),
  }),
});

// Delete target schema
export const deleteTargetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid target ID format'),
  }),
});

// Bulk create targets schema
export const bulkCreateTargetsSchema = z.object({
  body: z.object({
    targets: z.array(z.object({
      userId: z.string().uuid('Invalid user ID format'),
      targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion']),
      targetValue: z.number().positive('Target value must be positive'),
      period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
      startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format'),
      endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format'),
      commissionRate: z.number().min(0).max(100).optional(),
      bonusAmount: z.number().min(0).optional(),
    })).min(1, 'At least one target must be provided').max(50, 'Maximum 50 targets allowed'),
  }),
});
