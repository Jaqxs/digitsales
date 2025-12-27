import { apiClient, ApiResponse } from '../api';
import { z } from 'zod';

// Auth API Schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support']),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    employeeId: z.string().nullable(),
  }).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: TokensSchema,
});

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  role: z.enum(['admin', 'manager', 'sales', 'inventory', 'support']),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type Tokens = z.infer<typeof TokensSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;

// Auth API Service
export class AuthApiService {
  // Login
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    if (response.success && response.data) {
      // Store tokens
      apiClient.setToken(response.data.tokens.accessToken);
      return response.data;
    }

    throw new Error(response.error?.message || 'Login failed');
  }

  // Refresh token
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });

    if (response.success && response.data) {
      // Update stored token
      apiClient.setToken(response.data.tokens.accessToken);
      return response.data;
    }

    throw new Error(response.error?.message || 'Token refresh failed');
  }

  // Get current user
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get user data');
  }

  // Update current user profile
  static async updateProfile(profileData: UpdateProfileData): Promise<User> {
    const response = await apiClient.put<User>('/auth/me/profile', profileData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update profile');
  }

  // Change password
  static async changePassword(passwordData: ChangePasswordData): Promise<void> {
    const response = await apiClient.put('/auth/me/password', passwordData);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to change password');
    }
  }

  // Logout (client-side only - server handles token invalidation)
  static logout(): void {
    apiClient.setToken(null);
  }

  // Admin functions
  static async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post<User>('/auth/users', userData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to create user');
  }

  static async getAllUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    users: User[];
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
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>('/auth/users', params);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get users');
  }

  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/auth/users/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get user');
  }

  static async updateUser(id: string, userData: Partial<CreateUserData & { isActive?: boolean }>): Promise<User> {
    const response = await apiClient.put<User>(`/auth/users/${id}`, userData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update user');
  }

  static async deactivateUser(id: string): Promise<void> {
    const response = await apiClient.put(`/auth/users/${id}/deactivate`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to deactivate user');
    }
  }

  static async reactivateUser(id: string): Promise<void> {
    const response = await apiClient.put(`/auth/users/${id}/reactivate`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to reactivate user');
    }
  }
}
