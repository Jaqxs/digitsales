// Utility functions for Zantrix POS

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('sw-TZ').format(num);
};

export const formatPercent = (num: number): string => {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num / 100);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const generateSKU = (category: string, id: number): string => {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(id).padStart(6, '0')}`;
};

export const calculateVAT = (amount: number, vatRate: number = 18): number => {
  return amount * (vatRate / 100);
};

export const getStockStatus = (quantity: number, lowStockThreshold: number = 10) => {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= lowStockThreshold) return 'low-stock';
  return 'in-stock';
};
