import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employeeService';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createEmployeeTargetSchema,
  updateEmployeeTargetSchema,
  getEmployeeTargetsSchema,
  updateTargetProgressSchema,
  bulkCreateTargetsSchema,
} from '../validations/employees';

const createApiError = (message: string, statusCode: number = 500): ApiError => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
import { ApiError } from '../middleware/errorHandler';

// Get all employees
export const getAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string as any;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await EmployeeService.getAllEmployees({
      page,
      limit,
      search,
      role,
      isActive,
    });

    res.status(200).json({
      success: true,
      data: {
        employees: result.employees.map(employee => ({
          id: employee.id,
          name: employee.userProfile
            ? `${employee.userProfile.firstName} ${employee.userProfile.lastName}`
            : employee.email,
          email: employee.email,
          role: employee.role,
          phone: employee.userProfile?.phone || '',
          avatar: employee.userProfile?.avatarUrl,
          isActive: employee.isActive,
          salesTarget: 0, // TODO: Calculate from active targets
          totalSales: 0, // TODO: Calculate from sales data
          commission: 0, // TODO: Get from active targets
          createdAt: employee.createdAt.toISOString(),
          updatedAt: employee.updatedAt.toISOString(),
          targets: employee.employeeTargets,
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get employee by ID
export const getEmployeeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await EmployeeService.getEmployeeById(id);

    if (!employee) {
      throw createApiError('Employee not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.userProfile
            ? `${employee.userProfile.firstName} ${employee.userProfile.lastName}`
            : employee.email,
          email: employee.email,
          role: employee.role,
          phone: employee.userProfile?.phone || '',
          avatar: employee.userProfile?.avatarUrl,
          isActive: employee.isActive,
          salesTarget: 0, // TODO: Calculate from active targets
          totalSales: 0, // TODO: Calculate from sales data
          commission: 0, // TODO: Get from active targets
          createdAt: employee.createdAt.toISOString(),
          updatedAt: employee.updatedAt.toISOString(),
          targets: employee.employeeTargets,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Create employee
export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    // Validate input
    const { body } = createEmployeeSchema.parse(req);

    // Create employee
    const employee = await EmployeeService.createEmployee(body, req.user.id);

    res.status(201).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.userProfile
            ? `${employee.userProfile.firstName} ${employee.userProfile.lastName}`
            : employee.email,
          email: employee.email,
          role: employee.role,
          phone: employee.userProfile?.phone || '',
          avatar: employee.userProfile?.avatarUrl,
          isActive: employee.isActive,
          salesTarget: 0,
          totalSales: 0,
          commission: 0,
          createdAt: employee.createdAt.toISOString(),
          updatedAt: employee.updatedAt.toISOString(),
          targets: employee.employeeTargets,
        },
      },
      message: 'Employee created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Update employee
export const updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Validate input
    const { body } = updateEmployeeSchema.parse(req);

    // Update employee
    const employee = await EmployeeService.updateEmployee(id, body);

    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.userProfile
            ? `${employee.userProfile.firstName} ${employee.userProfile.lastName}`
            : employee.email,
          email: employee.email,
          role: employee.role,
          phone: employee.userProfile?.phone || '',
          avatar: employee.userProfile?.avatarUrl,
          isActive: employee.isActive,
          salesTarget: 0,
          totalSales: 0,
          commission: 0,
          createdAt: employee.createdAt.toISOString(),
          updatedAt: employee.updatedAt.toISOString(),
          targets: employee.employeeTargets,
        },
      },
      message: 'Employee updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete employee
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await EmployeeService.deleteEmployee(id);

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Employee Targets Controllers

// Get employee targets
export const getEmployeeTargets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query params
    const { query } = getEmployeeTargetsSchema.parse(req);

    const result = await EmployeeService.getEmployeeTargets({
      ...query,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        targets: result.targets,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Create employee target
export const createEmployeeTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    // Validate input
    const { body } = createEmployeeTargetSchema.parse(req);

    // Create target
    const target = await EmployeeService.createEmployeeTarget(body, req.user.id);

    res.status(201).json({
      success: true,
      data: { target },
      message: 'Employee target created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Update employee target
export const updateEmployeeTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { body } = updateEmployeeTargetSchema.parse(req);

    // Update target
    const target = await EmployeeService.updateEmployeeTarget(id, body);

    res.status(200).json({
      success: true,
      data: { target },
      message: 'Employee target updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete employee target
export const deleteEmployeeTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await EmployeeService.deleteEmployeeTarget(id);

    res.status(200).json({
      success: true,
      message: 'Employee target deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Update target progress
export const updateTargetProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { body } = updateTargetProgressSchema.parse(req);

    // Update progress
    const target = await EmployeeService.updateTargetProgress(id, body.currentValue, body.notes);

    res.status(200).json({
      success: true,
      data: { target },
      message: 'Target progress updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Bulk create targets
export const bulkCreateTargets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    // Validate input
    const { body } = bulkCreateTargetsSchema.parse(req);

    // Create targets
    const targets = await EmployeeService.bulkCreateTargets(body.targets, req.user.id);

    res.status(201).json({
      success: true,
      data: { targets },
      message: `${targets.length} employee targets created successfully`,
    });
  } catch (error: any) {
    next(error);
  }
};
