import { z } from 'zod';

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

// Update target progress schema (for tracking current progress)
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
