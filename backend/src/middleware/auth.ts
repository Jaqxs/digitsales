import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access token is required',
          type: 'AuthenticationError'
        }
      });
      return;
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found or inactive',
          type: 'AuthenticationError'
        }
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        message: error.message || 'Invalid or expired token',
        type: 'AuthenticationError'
      }
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          type: 'AuthenticationError'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          type: 'AuthorizationError'
        }
      });
      return;
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = authorize('admin');
export const requireManager = authorize('admin', 'manager');
export const requireInventory = authorize('admin', 'manager', 'inventory');
export const requireSales = authorize('admin', 'manager', 'sales');

// Combined middleware for common use cases
export const requireAuth = authenticate;
export const requireAdminAuth = [authenticate, requireAdmin];
export const requireManagerAuth = [authenticate, requireManager];
export const requireInventoryAuth = [authenticate, requireInventory];
export const requireSalesAuth = [authenticate, requireSales];
