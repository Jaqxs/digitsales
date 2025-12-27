import { apiClient } from '../api';
import { z } from 'zod';

// Employee API Schemas
export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support']),
  phone: z.string(),
  avatar: z.string().optional(),
  isActive: z.boolean(),
  salesTarget: z.number(),
  totalSales: z.number(),
  commission: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support']),
  phone: z.string().optional(),
  salesTarget: z.number().min(0).default(0),
  commission: z.number().min(0).max(100).default(0),
});

export const UpdateEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support']).optional(),
  phone: z.string().optional(),
  salesTarget: z.number().min(0).optional(),
  commission: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const EmployeeTargetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion']),
  targetValue: z.number(),
  currentValue: z.number(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  commissionRate: z.number().nullable(),
  bonusAmount: z.number().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateTargetSchema = z.object({
  userId: z.string(),
  targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion']),
  targetValue: z.number().positive(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string(),
  endDate: z.string(),
  commissionRate: z.number().min(0).max(100).optional(),
  bonusAmount: z.number().min(0).optional(),
});

export const UpdateTargetSchema = z.object({
  targetType: z.enum(['sales_revenue', 'sales_quantity', 'customer_acquisition', 'profit_margin', 'task_completion']).optional(),
  targetValue: z.number().positive().optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  bonusAmount: z.number().min(0).optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;
export type CreateEmployeeData = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeData = z.infer<typeof UpdateEmployeeSchema>;
export type EmployeeTarget = z.infer<typeof EmployeeTargetSchema>;
export type CreateTargetData = z.infer<typeof CreateTargetSchema>;
export type UpdateTargetData = z.infer<typeof UpdateTargetSchema>;

// Employee API Service
export class EmployeeApiService {
  // Get all employees
  static async getAllEmployees(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    employees: Employee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params: Record<string, any> = {};
    if (options?.page) params.page = options.page.toString();
    if (options?.limit) params.limit = options.limit.toString();
    if (options?.search) params.search = options.search;
    if (options?.role) params.role = options.role;
    if (options?.isActive !== undefined) params.isActive = options.isActive.toString();

    const response = await apiClient.get<{
      employees: Employee[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/employees', params);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get employees');
  }

  // Get employee by ID
  static async getEmployeeById(id: string): Promise<Employee> {
    const response = await apiClient.get<Employee>(`/employees/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get employee');
  }

  // Create employee
  static async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    const response = await apiClient.post<Employee>('/employees', employeeData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to create employee');
  }

  // Update employee
  static async updateEmployee(id: string, employeeData: UpdateEmployeeData): Promise<Employee> {
    const response = await apiClient.put<Employee>(`/employees/${id}`, employeeData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update employee');
  }

  // Delete employee
  static async deleteEmployee(id: string): Promise<void> {
    const response = await apiClient.delete(`/employees/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete employee');
    }
  }

  // Employee Targets API

  // Get employee targets
  static async getEmployeeTargets(options?: {
    userId?: string;
    targetType?: string;
    period?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    targets: EmployeeTarget[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params: Record<string, any> = {};
    if (options?.userId) params.userId = options.userId;
    if (options?.targetType) params.targetType = options.targetType;
    if (options?.period) params.period = options.period;
    if (options?.isActive !== undefined) params.isActive = options.isActive.toString();
    if (options?.page) params.page = options.page.toString();
    if (options?.limit) params.limit = options.limit.toString();

    const response = await apiClient.get<{
      targets: EmployeeTarget[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/employees/targets', params);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get employee targets');
  }

  // Create employee target
  static async createEmployeeTarget(targetData: CreateTargetData): Promise<EmployeeTarget> {
    const response = await apiClient.post<EmployeeTarget>('/employees/targets', targetData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to create employee target');
  }

  // Update employee target
  static async updateEmployeeTarget(id: string, targetData: UpdateTargetData): Promise<EmployeeTarget> {
    const response = await apiClient.put<EmployeeTarget>(`/employees/targets/${id}`, targetData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update employee target');
  }

  // Delete employee target
  static async deleteEmployeeTarget(id: string): Promise<void> {
    const response = await apiClient.delete(`/employees/targets/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete employee target');
    }
  }

  // Update target progress
  static async updateTargetProgress(id: string, currentValue: number, notes?: string): Promise<EmployeeTarget> {
    const response = await apiClient.patch<EmployeeTarget>(`/employees/targets/${id}/progress`, {
      currentValue,
      notes,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update target progress');
  }

  // Bulk create targets
  static async bulkCreateTargets(targets: CreateTargetData[]): Promise<EmployeeTarget[]> {
    const response = await apiClient.post<EmployeeTarget[]>('/employees/targets/bulk', { targets });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to create employee targets');
  }
}
