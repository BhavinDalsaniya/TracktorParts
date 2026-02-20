/**
 * API client with optimizations for slow networks
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.url,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add auth token if exists
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error
          switch (error.response.status) {
            case 401:
              // Unauthorized - clear token and redirect to appropriate login
              this.clearToken();
              if (typeof window !== 'undefined') {
                // Check if current path is admin route
                const isAdminRoute = window.location.pathname.startsWith('/admin');
                const loginPath = isAdminRoute ? '/admin/login' : '/auth/login';
                window.location.href = loginPath;
              }
              break;
            case 404:
              console.error('Resource not found');
              break;
            case 500:
              console.error('Server error');
              break;
          }
        } else if (error.request) {
          // Request made but no response - likely network issue
          console.error('Network error - please check your connection');
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  // HTTP methods
  public get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.client.get<T>(url, { params }) as Promise<T>;
  }

  public post<T>(url: string, data?: unknown, config?: { headers?: Record<string, string> }): Promise<T> {
    return this.client.post<T>(url, data, config) as Promise<T>;
  }

  public put<T>(url: string, data?: unknown): Promise<T> {
    return this.client.put<T>(url, data) as Promise<T>;
  }

  public patch<T>(url: string, data?: unknown): Promise<T> {
    return this.client.patch<T>(url, data) as Promise<T>;
  }

  public delete<T>(url: string): Promise<T> {
    return this.client.delete<T>(url) as Promise<T>;
  }
}

// Singleton instance
export const api = new ApiClient();
