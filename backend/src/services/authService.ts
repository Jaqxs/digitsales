import { prisma } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateTokens } from '../utils/jwt';
import { User, UserRole } from '@prisma/client';

// Export utility functions for use in other services
export { hashPassword } from '../utils/password';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithProfile extends User {
  userProfile?: {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    employeeId: string | null;
  } | null;
}

export class AuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<{
    user: UserWithProfile;
    tokens: AuthTokens;
  }> {
    const email = credentials.email.toLowerCase();
    const password = credentials.password;

    // Find user with profile
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userProfile: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<{
    user: UserWithProfile;
    tokens: AuthTokens;
  }> {
    // Verify refresh token
    const decoded = await this.verifyRefreshToken(refreshToken);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  // Register new user
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{
    user: UserWithProfile;
    tokens: AuthTokens;
  }> {
    const email = userData.email.toLowerCase();
    const { password, firstName, lastName, phone } = userData;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and profile in transaction
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.sales, // Default role for new registrations
        isActive: true,
        userProfile: {
          create: {
            firstName,
            lastName,
            phone,
          },
        },
      },
      include: {
        userProfile: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }
  static async createUser(userData: {
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phone?: string;
    employeeId?: string;
  }, createdBy: string): Promise<UserWithProfile> {
    const email = userData.email.toLowerCase();
    const { password, role, firstName, lastName, phone, employeeId } = userData;

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
    const passwordHash = await hashPassword(password);

    // Create user and profile in transaction
    const user = await prisma.user.create({
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
      },
    });

    return user;
  }

  // Update user profile
  static async updateUserProfile(
    userId: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
    }
  ): Promise<UserWithProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        userProfile: {
          upsert: {
            create: {
              firstName: profileData.firstName || '',
              lastName: profileData.lastName || '',
              phone: profileData.phone || null,
              avatarUrl: profileData.avatarUrl || null,
            },
            update: {
              ...(profileData.firstName !== undefined && { firstName: profileData.firstName }),
              ...(profileData.lastName !== undefined && { lastName: profileData.lastName }),
              ...(profileData.phone !== undefined && { phone: profileData.phone }),
              ...(profileData.avatarUrl !== undefined && { avatarUrl: profileData.avatarUrl }),
            },
          },
        },
      },
      include: {
        userProfile: true,
      },
    });

    return user;
  }

  // Change password
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  // Get user by ID with profile
  static async getUserById(userId: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
      },
    });
  }

  // Get all users (admin only)
  static async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<{
    users: UserWithProfile[];
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

    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Update user (admin only)
  static async updateUser(
    userId: string,
    updateData: {
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      firstName?: string;
      lastName?: string;
      phone?: string;
      employeeId?: string;
    }
  ): Promise<UserWithProfile> {
    const { email, role, isActive, firstName, lastName, phone, employeeId } = updateData;

    // Check if email is being changed and already exists
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
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
          userId: { not: userId },
        },
      });

      if (existingEmployee) {
        throw new Error('Employee ID already in use');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
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
      },
    });

    return user;
  }

  // Deactivate user (admin only)
  static async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  // Reactivate user (admin only)
  static async reactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  // Private method to verify refresh token
  private static async verifyRefreshToken(token: string) {
    const { verifyRefreshToken } = await import('../utils/jwt');
    return verifyRefreshToken(token);
  }
}
