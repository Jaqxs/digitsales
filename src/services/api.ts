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
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.customerId) searchParams.append('customerId', params.customerId);
    if (params?.employeeId) searchParams.append('employeeId', params.employeeId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const queryString = searchParams.toString();
    return apiRequest<{ sales: any[]; pagination: any }>(
      `/sales${queryString ? `?${queryString}` : ''}`
    );
  },

  getSaleById: (id: string) =>
    apiRequest<{ sale: any }>(`/sales/${id}`),

  createSale: (data: any) =>
    apiRequest<{ sale: any }>('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
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
