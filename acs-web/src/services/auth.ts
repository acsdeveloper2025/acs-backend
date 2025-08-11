import { apiService } from './api';
import type { LoginRequest, LoginResponse, User } from '@/types/auth';

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse['data']>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('auth_token', response.data.tokens.accessToken);
      localStorage.setItem('auth_refresh_token', response.data.tokens.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }
    
    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
      }
    }

    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

export const authService = new AuthService();
