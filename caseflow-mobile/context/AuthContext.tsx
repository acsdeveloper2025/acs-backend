import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import AsyncStorage from '../polyfills/AsyncStorage';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (updates: Partial<Pick<User, 'profilePhotoUrl'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // Token exists but no user data, clear auth
            await authService.logout();
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Failed to check auth status", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timeout, setting loading to false');
      setIsLoading(false);
    }, 5000);

    checkAuthStatus().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Basic validation
      if (!username.trim()) {
        setIsLoading(false);
        return { success: false, error: 'Username is required' };
      }

      if (!password.trim()) {
        setIsLoading(false);
        return { success: false, error: 'Password is required' };
      }

      // Additional validation rules
      if (username.length < 3) {
        setIsLoading(false);
        return { success: false, error: 'Username must be at least 3 characters long' };
      }

      if (password.length < 4) {
        setIsLoading(false);
        return { success: false, error: 'Password must be at least 4 characters long' };
      }

      // Call authentication service
      console.log('🔐 AuthContext: Calling authService.login...');
      const response = await authService.login(username, password);
      console.log('🔐 AuthContext: Login response:', response);

      if (response.success && response.data) {
        // Update context state
        console.log('🔐 AuthContext: Setting user and authenticated state...');
        setUser(response.data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log('🔐 AuthContext: Authentication state updated successfully');
        return { success: true };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: response.error?.message || 'Login failed. Please check your credentials.'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<User, 'profilePhotoUrl'>>) => {
    if (user) {
      try {
        const result = await authService.updateProfile(updates);
        if (result.success) {
          const updatedUser = { ...user, ...updates };
          setUser(updatedUser);
        } else {
          console.error('Failed to update profile:', result.error);
          // For profile photo updates, we might still want to update locally
          // even if server update fails (for offline scenarios)
          const updatedUser = { ...user, ...updates };
          setUser(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Profile update error:', error);
        // Fallback to local update
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
