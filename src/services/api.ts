// API service for Zantrix POS backend integration

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
console.log('🔌 API Service Initialized');
console.log('📡 Backend URL:', API_BASE_URL);
console.log('🌍 Mode:', import.meta.env.MODE);

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
    console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, config);

    // Handle 401 Unauthorized (Token Expired)
    if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      const refreshTokenValue = localStorage.getItem('zantrix_refreshToken') || localStorage.getItem('zantrix_refresh_token');
      if (refreshTokenValue) {
        try {
          console.log('🔄 Token expired, attempting refresh...');
          const refreshResponse = await authAPI.refreshToken(refreshTokenValue);

          // Store new tokens
          if (refreshResponse.tokens) {
            localStorage.setItem('zantrix_token', refreshResponse.tokens.accessToken);
            if (refreshResponse.tokens.refreshToken) {
              localStorage.setItem('zantrix_refreshToken', refreshResponse.tokens.refreshToken);
            }

            // Retry the original request with the new token
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${refreshResponse.tokens.accessToken}`,
              },
            };
            const retryResponse = await fetch(url, retryConfig);
            const retryJson = await retryResponse.json().catch(() => ({ success: false }));
            return retryJson.data !== undefined ? retryJson.data : retryJson;
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          // If refresh fails, we should logout by removing tokens
          localStorage.removeItem('zantrix_token');
          localStorage.removeItem('zantrix_refreshToken');
          window.location.href = '/auth';
          throw new Error('Session expired. Please log in again.');
        }
      }
    }

    const json = await response.json().catch(() => ({ success: false, error: { message: 'Invalid server response' } }));

    if (!response.ok || (json.success === false)) {
      let errorMessage = json.error?.message || json.message || `HTTP ${response.status}`;

      // Add field-specific validation errors if they exist
      if (json.error?.errors && Array.isArray(json.error.errors)) {
        const details = json.error.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        errorMessage = `${errorMessage} (${details})`;
      }

      console.error(`❌ API Error Response:`, { status: response.status, message: errorMessage, url });
      throw new Error(errorMessage);
    }

    // Backend uses { success: true, data: { ... } }
    return json.data !== undefined ? json.data : json;
  } catch (error: any) {
    // Network errors (no internet, CORS, DNS failure, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`❌ Network Error: Cannot reach ${API_BASE_URL}`);
      console.error('💡 Possible causes: No internet, CORS issue, or backend is down');
      throw new Error('Network error: Cannot connect to server. Please check your internet connection.');
    }

    if (error.name === 'AbortError') {
      console.warn('⚠️ API request aborted');
    } else {
      console.error(`❌ API request failed to ${url}:`, error.message || error);
    }
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

  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    apiRequest<{ user: any; tokens: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
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

  deleteUser: (id: string) =>
    apiRequest(`/auth/users/${id}`, {
      method: 'DELETE',
    }),
};

// Product API functions
export const productAPI = {
  getAllProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const queryString = searchParams.toString();
    return apiRequest<{ products: any[]; pagination: any }>(
      `/products${queryString ? `?${queryString}` : ''}`
    );
  },

  getProductById: (id: string) =>
    apiRequest<{ product: any }>(`/products/${id}`),

  createProduct: (data: any) =>
    apiRequest<{ product: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: any) =>
    apiRequest<{ product: any }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    apiRequest(`/products/${id}`, {
      method: 'DELETE',
    }),

  updateStock: (data: { productId: string; quantityChange: number; type: string; reason: string }) =>
    apiRequest<{ product: any }>('/products/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Customer API functions
export const customerAPI = {
  getAllCustomers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const queryString = searchParams.toString();
    return apiRequest<{ customers: any[]; pagination: any }>(
      `/customers${queryString ? `?${queryString}` : ''}`
    );
  },

  getCustomerById: (id: string) =>
    apiRequest<{ customer: any }>(`/customers/${id}`),

  createCustomer: (data: any) =>
    apiRequest<{ customer: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: any) =>
    apiRequest<{ customer: any }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Sales API functions
export const saleAPI = {
  getAllSales: (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    return apiRequest<{ sales: any[]; pagination: any }>(
      `/sales${queryString ? `?${queryString}` : ''}`
    );
  },

  getSaleById: (id: string) =>
    apiRequest<{ sale: any }>(`/sales/${id}`),

  createSale: (data: any) =>
    apiRequest<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAllSales: () =>
    apiRequest('/sales', {
      method: 'DELETE',
    }),
  confirmSale: (id: string) =>
    apiRequest<any>(`/sales/${id}/confirm`, {
      method: 'POST',
    }),
};

// Inventory API functions
export const inventoryAPI = {
  getLedger: (params?: {
    page?: number;
    limit?: number;
    productId?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.productId) searchParams.append('productId', params.productId);
    if (params?.locationId) searchParams.append('locationId', params.locationId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    return apiRequest<{ entries: any[]; pagination: any }>(
      `/inventory/ledger${queryString ? `?${queryString}` : ''}`
    );
  },

  getLowStock: () =>
    apiRequest<{ products: any[] }>('/inventory/low-stock'),

  adjustStock: (data: {
    productId: string;
    quantity: number;
    type: string;
    reason: string;
  }) =>
    apiRequest<{ adjustment: any }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Report API functions
export const reportAPI = {
  getSalesSummary: (params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    return apiRequest<{ data: any[] }>(
      `/reports/sales-summary${queryString ? `?${queryString}` : ''}`
    );
  },

  getCategoryPerformance: () =>
    apiRequest<{ data: any[] }>('/reports/category-performance'),

  getValuation: () =>
    apiRequest<{ totalCost: number; totalSelling: number; productCount: number }>(
      '/reports/valuation'
    ),
};

// Employee API functions
export const employeeAPI = {
  getAllEmployees: (params?: {
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
    return apiRequest<{ employees: any[]; pagination: any }>(
      `/employees${queryString ? `?${queryString}` : ''}`
    );
  },

  getEmployeeById: (id: string) =>
    apiRequest<{ employee: any }>(`/employees/${id}`),

  createEmployee: (data: any) =>
    apiRequest<{ employee: any }>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEmployee: (id: string, data: any) =>
    apiRequest<{ employee: any }>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEmployee: (id: string) =>
    apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    }),

  // Employee targets
  getEmployeeTargets: (params?: { employeeId?: string; isActive?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

    const queryString = searchParams.toString();
    return apiRequest<{ targets: any[]; pagination: any }>(
      `/employees/targets${queryString ? `?${queryString}` : ''}`
    );
  },
};

// Export all APIs
export const api = {
  auth: authAPI,
  users: userAPI,
  employees: employeeAPI,
  products: productAPI,
  customers: customerAPI,
  sales: saleAPI,
  inventory: inventoryAPI,
  reports: reportAPI,
};
