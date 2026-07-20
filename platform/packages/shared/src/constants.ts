export const APP_NAME = 'KP Pakse POS';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = 'http://localhost:4000';

export const USER_ROLES = [
  'owner',
  'admin',
  'manager',
  'cashier',
  'warehouse',
  'technician',
  'customer',
] as const;

export const PAYMENT_METHODS = [
  'cash',
  'transfer',
  'qr',
  'card',
  'points',
  'credit',
  'coupon',
] as const;

export const ORDER_TYPES = ['pos', 'online', 'quote', 'presale', 'delivery'] as const;

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'export',
  'import',
  'print',
  'change_price',
  'change_cost',
  'view_profit',
  'manage_users',
] as const;
