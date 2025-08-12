export type Role = 'ADMIN' | 'BACKEND' | 'BANK' | 'FIELD';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  profilePhotoUrl?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
