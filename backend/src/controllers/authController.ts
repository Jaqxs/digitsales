import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema, createUserSchema, updateUserSchema, updateUserProfileSchema } from '../validations/auth';
import { ApiError } from '../middleware/errorHandler';

const createApiError = (message: string, statusCode: number = 500): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Login controller
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const { body } = loginSchema.parse(req);

    // Login user
    const { user, tokens } = await AuthService.login(body);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          profile: user.userProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    next(error);
  }
};

// Register controller
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const { body } = registerSchema.parse(req);

    // Register user
    const { user, tokens } = await AuthService.register(body);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.userProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      },
      message: 'Registration successful',
    });
  } catch (error: any) {
    next(error);
  }
};

// Refresh token controller
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const { body } = refreshTokenSchema.parse(req);

    // Refresh tokens
    const { user, tokens } = await AuthService.refreshAccessToken(body.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.userProfile,
        },
        tokens,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    const user = await AuthService.getUserById(req.user.id);

    if (!user) {
      throw createApiError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          profile: user.userProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update current user profile
export const updateCurrentUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    // Validate input
    const { body } = updateUserProfileSchema.parse(req);

    // Update profile
    const user = await AuthService.updateUserProfile(req.user.id, body);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: user.userProfile,
          updatedAt: user.updatedAt,
        },
      },
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Change current user password
export const changeCurrentUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    // Validate input
    const { body } = changePasswordSchema.parse(req);

    // Change password
    await AuthService.changePassword(req.user.id, body.currentPassword, body.newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Create new user (admin only)
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createApiError('User not authenticated', 401);
    }

    // Validate input
    const { body } = createUserSchema.parse(req);

    // Create user
    const user = await AuthService.createUser(body, req.user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.userProfile,
          createdAt: user.createdAt,
        },
      },
      message: 'User created successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as any;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await AuthService.getAllUsers({
      page,
      limit,
      search,
      role,
      isActive,
    });

    res.status(200).json({
      success: true,
      data: {
        users: result.users.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.userProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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

// Get user by ID (admin only)
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await AuthService.getUserById(id);

    if (!user) {
      throw createApiError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.userProfile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update user (admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    const { body } = updateUserSchema.parse(req);

    // Update user
    const user = await AuthService.updateUser(id, body);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          profile: user.userProfile,
          updatedAt: user.updatedAt,
        },
      },
      message: 'User updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await AuthService.deleteUser(id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Deactivate user (admin only)
export const deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await AuthService.deactivateUser(id);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Reactivate user (admin only)
export const reactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await AuthService.reactivateUser(id);

    res.status(200).json({
      success: true,
      message: 'User reactivated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};
