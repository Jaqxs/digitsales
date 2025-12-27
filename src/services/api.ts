// API service for Zantrix POS backend integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('zantrix_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API functions
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest<{ user: any; tokens: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refreshToken: (refreshToken: string) =>
    apiRequest<{ user: any; tokens: any }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  getCurrentUser: () =>
    apiRequest<{ user: any }>('/auth/me'),

  updateProfile: (data: any) =>
    apiRequest<{ user: any }>('/auth/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest('/auth/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// User management API functions (Admin only)
export const userAPI = {
  createUser: (data: {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    phone?: string;
    employeeId?: string;
  }) =>
    apiRequest<{ user: any }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const queryString = searchParams.toString();
    return apiRequest<{ users: any[]; pagination: any }>(
      `/auth/users${queryString ? `?${queryString}` : ''}`
    );
  },

  getUserById: (id: string) =>
    apiRequest<{ user: any }>(`/auth/users/${id}`),

  updateUser: (id: string, data: {
    email?: string;
    role?: string;
    isActive?: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string;
    employeeId?: string;
  }) =>
    apiRequest<{ user: any }>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deactivateUser: (id: string) =>
    apiRequest(`/auth/users/${id}/deactivate`, {
      method: 'PUT',
    }),

  reactivateUser: (id: string) =>
    apiRequest(`/auth/users/${id}/reactivate`, {
      method: 'PUT',
    }),
};

// Employee targets API (Admin/Manager only)
export const employeeAPI = {
  setTarget: (userId: string, data: {
    salesTarget: number;
    commission?: number;
  }) =>
    apiRequest<{ user: any }>(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTargets: (userId: string) =>
    apiRequest<{ salesTarget: number; commission: number }>(`/auth/users/${userId}/targets`),
};

// Export all APIs
export const api = {
  auth: authAPI,
  users: userAPI,
  employees: employeeAPI,
};
