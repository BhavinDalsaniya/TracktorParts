/**
 * Shared type definitions
 */

// Product types
export interface Product {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  description: string;
  descriptionGu: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  images: string[];
  categoryId: string;
  category: Category;
  compatibility: string[];
  specifications?: Record<string, string | number>;
  weight?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  description?: string;
  descriptionGu?: string;
  image?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: 'gu' | 'en' | 'hi';
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// Cart types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'cod' | 'online' | 'upi';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
  language: 'gu' | 'en' | 'hi';
}

export interface AuthResponse {
  user: User;
  token: string;
}
