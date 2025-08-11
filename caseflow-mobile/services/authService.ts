import AsyncStorage from '../polyfills/AsyncStorage';
import { getEnvironmentConfig, getApiConfig } from '../config/environment';
import { User } from '../types';
import { tokenManager } from '../utils/tokenManager';

export interface LoginRequest {
  username: string;
  password: string;
  deviceId: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model: string;
  };
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

class AuthService {
  private config = getEnvironmentConfig();
  private apiConfig = getApiConfig();
  private refreshTokenPromise: Promise<string | null> | null = null;

  /**
   * Generate a unique device ID
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      // Generate a unique device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    // In a real React Native app, you would use react-native-device-info
    return {
      platform: 'web', // or 'ios', 'android'
      version: this.config.app.version,
      model: 'Unknown',
    };
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.apiConfig.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...this.apiConfig.headers,
    };

    // Add authorization header if token exists
    const token = await this.getAccessToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      timeout: this.apiConfig.timeout,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          const newToken = await this.getAccessToken();
          if (newToken) {
            config.headers = {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`,
            };
            return await fetch(url, config);
          }
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const deviceId = await this.getDeviceId();
      const deviceInfo = this.getDeviceInfo();

      const loginRequest: LoginRequest = {
        username: username.trim(),
        password,
        deviceId,
        deviceInfo,
      };

      const response = await fetch(`${this.apiConfig.baseUrl}/mobile/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.apiConfig.headers,
        },
        body: JSON.stringify(loginRequest),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens and user data
        await this.storeAuthData(data.data);
        return data;
      } else {
        return {
          success: false,
          error: data.error || {
            code: 'LOGIN_FAILED',
            message: 'Login failed. Please check your credentials.',
          },
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection and try again.',
        },
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (refreshToken) {
        // Call logout endpoint to invalidate tokens on server
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }

      // Clear local storage
      await this.clearAuthData();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local data
      await this.clearAuthData();
      return {
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Logout completed locally but server logout failed.',
        },
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = this.performTokenRefresh();
    const result = await this.refreshTokenPromise;
    this.refreshTokenPromise = null;
    
    return result;
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();

      if (!refreshToken) {
        await this.clearAuthData();
        return null;
      }

      const response = await fetch(`${this.apiConfig.baseUrl}/mobile/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.apiConfig.headers,
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: RefreshTokenResponse = await response.json();

      if (response.ok && data.success && data.data) {
        // Store new access token using token manager
        await tokenManager.storeTokens({
          accessToken: data.data.accessToken,
          refreshToken: refreshToken, // Keep existing refresh token
          expiresIn: data.data.expiresIn,
          tokenType: 'Bearer',
        });

        return data.data.accessToken;
      } else {
        // Refresh failed, clear auth data
        await this.clearAuthData();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearAuthData();
      return null;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await tokenManager.getAccessToken();
      if (!token) return null;

      // Check if token is expired
      const isExpired = await tokenManager.isTokenExpired();
      if (isExpired) {
        // Try to refresh token
        return await this.refreshAccessToken();
      }

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(authData: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }): Promise<void> {
    try {
      // Use token manager to store tokens
      await tokenManager.storeTokens({
        accessToken: authData.tokens.accessToken,
        refreshToken: authData.tokens.refreshToken,
        expiresIn: authData.tokens.expiresIn,
        tokenType: 'Bearer',
      });

      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  /**
   * Clear all authentication data
   */
  private async clearAuthData(): Promise<void> {
    try {
      await tokenManager.clearTokens();
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local user data
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to update profile',
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  }
}

export const authService = new AuthService();
export default authService;
