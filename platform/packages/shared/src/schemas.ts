import { z } from 'zod';

export const LoginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const ProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  basePrice: z.number().default(0),
  costPrice: z.number().default(0),
  stock: z.number().default(0),
  minStock: z.number().default(0),
  unit: z.string().default('piece'),
});

export const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  qty: z.number().positive(),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const OrderPaymentSchema = z.object({
  method: z.enum(['cash', 'transfer', 'qr', 'card', 'points', 'credit', 'coupon']),
  amount: z.number().positive(),
  currency: z.string().default('LAK'),
  reference: z.string().optional(),
});
