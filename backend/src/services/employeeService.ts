import { prisma } from '../config/database';
import { User, UserRole } from '@prisma/client';

export interface EmployeeWithTargets extends User {
  userProfile?: any;
  employeeTargets?: any[];
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeId?: string;
}

export interface UpdateEmployeeData {
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  employeeId?: string;
  isActive?: boolean;
}

export interface EmployeeTargetData {
  userId: string;
  targetType: 'sales_revenue' | 'sales_quantity' | 'customer_acquisition' | 'profit_margin' | 'task_completion';
  targetValue: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  commissionRate?: number;
  bonusAmount?: number;
}

export class EmployeeService {
  // Get all employees with optional filtering
  static async getAllEmployees(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<{
    employees: EmployeeWithTargets[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
    } = options || {};

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        {
          userProfile: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { employeeId: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get employees with their targets
    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userProfile: true,
          employeeTargets: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      employees,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get employee by ID
  static async getEmployeeById(id: string): Promise<EmployeeWithTargets | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
        employeeTargets: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Create new employee
  static async createEmployee(employeeData: CreateEmployeeData, createdBy: string): Promise<EmployeeWithTargets> {
    const { email, password, role, firstName, lastName, phone, employeeId } = employeeData;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if employee ID already exists
    if (employeeId) {
      const existingEmployee = await prisma.userProfile.findUnique({
        where: { employeeId },
      });

      if (existingEmployee) {
        throw new Error('Employee ID already exists');
      }
    }

    // Hash password
    const { hashPassword } = await import('./authService');
    const passwordHash = await hashPassword(password);

    // Create employee
    const employee = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        userProfile: {
          create: {
            firstName,
            lastName,
            phone,
            employeeId,
          },
        },
      },
      include: {
        userProfile: true,
        employeeTargets: true,
      },
    });

    return employee;
  }

  // Update employee
  static async updateEmployee(id: string, updateData: UpdateEmployeeData): Promise<EmployeeWithTargets> {
    const { email, role, isActive, firstName, lastName, phone, employeeId } = updateData;

    // Check if email is being changed and already exists
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    // Check if employee ID is being changed and already exists
    if (employeeId) {
      const existingEmployee = await prisma.userProfile.findFirst({
        where: {
          employeeId,
          userId: { not: id },
        },
      });

      if (existingEmployee) {
        throw new Error('Employee ID already in use');
      }
    }

    // Update employee
    const employee = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        userProfile: {
          upsert: {
            create: {
              firstName: firstName || '',
              lastName: lastName || '',
              phone,
              employeeId,
            },
            update: {
              ...(firstName && { firstName }),
              ...(lastName && { lastName }),
              ...(phone !== undefined && { phone }),
              ...(employeeId !== undefined && { employeeId }),
            },
          },
        },
      },
      include: {
        userProfile: true,
        employeeTargets: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return employee;
  }

  // Delete employee (soft delete by setting isActive to false)
  static async deleteEmployee(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Employee Targets Management

  // Get employee targets
  static async getEmployeeTargets(options?: {
    userId?: string;
    targetType?: string;
    period?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    targets: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      targetType,
      period,
      isActive = true,
      page = 1,
      limit = 10,
    } = options || {};

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (userId) where.userId = userId;
    if (targetType) where.targetType = targetType;
    if (period) where.period = period;
    if (isActive !== undefined) where.isActive = isActive;

    // Get targets
    const [targets, total] = await Promise.all([
      prisma.employeeTargets.findMany({
        where,
        include: {
          user: {
            include: {
              userProfile: true,
            },
          },
          creator: {
            include: {
              userProfile: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeTargets.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      targets,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Create employee target
  static async createEmployeeTarget(targetData: EmployeeTargetData, createdBy: string): Promise<any> {
    const { userId, targetType, targetValue, period, startDate, endDate, commissionRate, bonusAmount } = targetData;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create target
    const target = await prisma.employeeTargets.create({
      data: {
        userId,
        targetType,
        targetValue,
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        commissionRate,
        bonusAmount,
        createdBy,
      },
      include: {
        user: {
          include: {
            userProfile: true,
          },
        },
        creator: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    return target;
  }

  // Update employee target
  static async updateEmployeeTarget(id: string, updateData: Partial<EmployeeTargetData & { isActive?: boolean }>): Promise<any> {
    const { targetType, targetValue, period, startDate, endDate, commissionRate, bonusAmount, isActive } = updateData;

    const target = await prisma.employeeTargets.update({
      where: { id },
      data: {
        ...(targetType && { targetType }),
        ...(targetValue && { targetValue }),
        ...(period && { period }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(commissionRate !== undefined && { commissionRate }),
        ...(bonusAmount !== undefined && { bonusAmount }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          include: {
            userProfile: true,
          },
        },
        creator: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    return target;
  }

  // Delete employee target
  static async deleteEmployeeTarget(id: string): Promise<void> {
    await prisma.employeeTargets.delete({
      where: { id },
    });
  }

  // Update target progress
  static async updateTargetProgress(id: string, currentValue: number, notes?: string): Promise<any> {
    const target = await prisma.employeeTargets.update({
      where: { id },
      data: {
        currentValue,
        updatedAt: new Date(),
      },
      include: {
        user: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    // TODO: Log progress update in audit trail
    // You could create a separate table for target progress history

    return target;
  }

  // Bulk create targets
  static async bulkCreateTargets(targets: EmployeeTargetData[], createdBy: string): Promise<any[]> {
    const createdTargets = await prisma.$transaction(
      targets.map(target =>
        prisma.employeeTargets.create({
          data: {
            userId: target.userId,
            targetType: target.targetType,
            targetValue: target.targetValue,
            period: target.period,
            startDate: new Date(target.startDate),
            endDate: new Date(target.endDate),
            commissionRate: target.commissionRate,
            bonusAmount: target.bonusAmount,
            createdBy,
          },
          include: {
            user: {
              include: {
                userProfile: true,
              },
            },
          },
        })
      )
    );

    return createdTargets;
  }
}
