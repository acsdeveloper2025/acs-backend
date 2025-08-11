import { Role } from './auth';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  phone?: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  profilePhotoUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  profilePhotoUrl?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
  employeeId?: string;
  designation?: string;
  department?: string;
  profilePhotoUrl?: string;
  isActive?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  userId: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    role: Role;
    count: number;
  }[];
  usersByDepartment: {
    department: string;
    count: number;
  }[];
  recentLogins: {
    userId: string;
    userName: string;
    lastLoginAt: string;
  }[];
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivityAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

export interface RolePermission {
  role: Role;
  permissions: UserPermission[];
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  profilePhotoUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  stats: {
    totalCases: number;
    completedCases: number;
    pendingCases: number;
    averageRating: number;
    totalCommissions: number;
  };
  recentActivity: UserActivity[];
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'change_role';
  data?: {
    role?: Role;
    reason?: string;
  };
}

export interface UserImportData {
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  password?: string;
}

export interface UserExportData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  totalCases: number;
  completedCases: number;
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}
