// Shared types, constants, and validation schemas used by both API and Web apps.

export const ApiResponse = <T>(success: boolean, data?: T, error?: string) => ({
  success,
  data,
  error,
});

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const CurrencyCode = ['LAK', 'THB', 'USD', 'CNY'] as const;
export type CurrencyCode = (typeof CurrencyCode)[number];

export interface UserPayload {
  userId: string;
  role: string;
  businessId?: string;
  branchId?: string;
}

export interface POSCartItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  category?: string;
}

export * from './constants.js';
export * from './schemas.js';
