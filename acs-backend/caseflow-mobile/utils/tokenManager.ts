import AsyncStorage from '../polyfills/AsyncStorage';
import { getEnvironmentConfig } from '../config/environment';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export interface DecodedToken {
  sub: string; // Subject (user ID)
  iat: number; // Issued at
  exp: number; // Expiration time
  aud: string; // Audience
  iss: string; // Issuer
  role: string; // User role
  deviceId?: string; // Device ID
  [key: string]: any; // Additional claims
}

class TokenManager {
  private config = getEnvironmentConfig();
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRES_AT_KEY = 'token_expires_at';
  private readonly TOKEN_TYPE_KEY = 'token_type';

  /**
   * Store token data
   */
  async storeTokens(tokenData: TokenData): Promise<void> {
    try {
      const expiresAt = Date.now() + (tokenData.expiresIn * 1000);
      
      await AsyncStorage.multiSet([
        [this.ACCESS_TOKEN_KEY, tokenData.accessToken],
        [this.REFRESH_TOKEN_KEY, tokenData.refreshToken],
        [this.TOKEN_EXPIRES_AT_KEY, expiresAt.toString()],
        [this.TOKEN_TYPE_KEY, tokenData.tokenType || 'Bearer'],
      ]);

      // Legacy support
      await AsyncStorage.setItem('auth_token', tokenData.accessToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  async getTokenExpiresAt(): Promise<number | null> {
    try {
      const expiresAt = await AsyncStorage.getItem(this.TOKEN_EXPIRES_AT_KEY);
      return expiresAt ? parseInt(expiresAt, 10) : null;
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAt = await this.getTokenExpiresAt();
      if (!expiresAt) return true;
      
      // Add 5 minute buffer to prevent edge cases
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      return Date.now() >= (expiresAt - bufferTime);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Check if refresh token is expired
   */
  async isRefreshTokenExpired(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return true;

      const decoded = this.decodeToken(refreshToken);
      if (!decoded) return true;

      // Add 1 hour buffer for refresh token
      const bufferTime = 60 * 60 * 1000; // 1 hour in milliseconds
      return Date.now() >= ((decoded.exp * 1000) - bufferTime);
    } catch (error) {
      console.error('Error checking refresh token expiration:', error);
      return true;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;

      const isExpired = await this.isTokenExpired();
      if (!isExpired) {
        return accessToken;
      }

      // Token is expired, check if we can refresh
      const refreshTokenExpired = await this.isRefreshTokenExpired();
      if (refreshTokenExpired) {
        await this.clearTokens();
        return null;
      }

      // Refresh token is still valid, but we can't refresh here
      // This should be handled by the auth service
      return null;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Decode JWT token (without verification)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = JSON.parse(this.base64UrlDecode(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get user information from access token
   */
  async getUserFromToken(): Promise<Partial<DecodedToken> | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;

      return this.decodeToken(accessToken);
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    try {
      const tokenData = await this.getUserFromToken();
      if (!tokenData || !tokenData.role) return false;

      return tokenData.role === role;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles: string[]): Promise<boolean> {
    try {
      const tokenData = await this.getUserFromToken();
      if (!tokenData || !tokenData.role) return false;

      return roles.includes(tokenData.role);
    } catch (error) {
      console.error('Error checking user roles:', error);
      return false;
    }
  }

  /**
   * Get token time remaining in seconds
   */
  async getTimeRemaining(): Promise<number> {
    try {
      const expiresAt = await this.getTokenExpiresAt();
      if (!expiresAt) return 0;

      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      return remaining;
    } catch (error) {
      console.error('Error getting time remaining:', error);
      return 0;
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.ACCESS_TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.TOKEN_EXPIRES_AT_KEY,
        this.TOKEN_TYPE_KEY,
        'auth_token', // Legacy support
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Get authorization header value
   */
  async getAuthorizationHeader(): Promise<string | null> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) return null;

      const tokenType = await AsyncStorage.getItem(this.TOKEN_TYPE_KEY) || 'Bearer';
      return `${tokenType} ${accessToken}`;
    } catch (error) {
      console.error('Error getting authorization header:', error);
      return null;
    }
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (str.length % 4) {
      str += '=';
    }
    
    try {
      // For web environment
      if (typeof window !== 'undefined' && window.atob) {
        return window.atob(str);
      }
      
      // For Node.js environment (testing)
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str, 'base64').toString('utf-8');
      }
      
      throw new Error('No base64 decode method available');
    } catch (error) {
      console.error('Base64 decode error:', error);
      throw new Error('Failed to decode token');
    }
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(): Promise<{
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    isAccessTokenExpired: boolean;
    isRefreshTokenExpired: boolean;
    timeRemaining: number;
    userRole?: string;
  }> {
    const hasAccessToken = !!(await this.getAccessToken());
    const hasRefreshToken = !!(await this.getRefreshToken());
    const isAccessTokenExpired = await this.isTokenExpired();
    const isRefreshTokenExpired = await this.isRefreshTokenExpired();
    const timeRemaining = await this.getTimeRemaining();
    
    let userRole: string | undefined;
    try {
      const tokenData = await this.getUserFromToken();
      userRole = tokenData?.role;
    } catch (error) {
      // Ignore error
    }

    return {
      hasAccessToken,
      hasRefreshToken,
      isAccessTokenExpired,
      isRefreshTokenExpired,
      timeRemaining,
      userRole,
    };
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
