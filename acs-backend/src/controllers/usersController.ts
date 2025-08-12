import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import type { Role } from '@/types/auth';

// Mock data for demonstration (replace with actual database operations)
let users: any[] = [
  {
    id: 'user_1',
    name: 'John Doe',
    username: 'john.doe',
    email: 'john.doe@example.com',
    role: 'ADMIN',
    department: 'IT',
    designation: 'System Administrator',
    phone: '+1234567890',
    isActive: true,
    profilePhotoUrl: null,
    firstName: 'John',
    lastName: 'Doe',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_2',
    name: 'Jane Smith',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    role: 'MANAGER',
    department: 'Operations',
    designation: 'Operations Manager',
    phone: '+1234567891',
    isActive: true,
    profilePhotoUrl: null,
    firstName: 'Jane',
    lastName: 'Smith',
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

let userActivities: any[] = [];
let userSessions: any[] = [];

// GET /api/users - List users with pagination and filters
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      department, 
      isActive, 
      search, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    let filteredUsers = [...users];

    // Apply filters
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    if (department) {
      filteredUsers = filteredUsers.filter(user => user.department === department);
    }
    if (isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === (isActive === 'true'));
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      const aValue = a[sortBy as string];
      const bValue = b[sortBy as string];
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Apply pagination
    const startIndex = ((page as number) - 1) * (limit as number);
    const endIndex = startIndex + (limit as number);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    logger.info(`Retrieved ${paginatedUsers.length} users`, { 
      userId: req.user?.id,
      filters: { role, department, isActive, search },
      pagination: { page, limit }
    });

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / (limit as number)),
      },
    });
  } catch (error) {
    logger.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/:id - Get user by ID
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    logger.info(`Retrieved user ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error retrieving user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users - Create new user
export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      name, 
      username, 
      email, 
      role, 
      department, 
      designation, 
      phone, 
      isActive = true 
    } = req.body;

    // Check if username or email already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists',
        error: { code: 'DUPLICATE_USER' },
      });
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      username,
      email,
      role,
      department,
      designation,
      phone,
      isActive,
      profilePhotoUrl: null,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);

    logger.info(`Created new user: ${newUser.id}`, { 
      userId: req.user?.id,
      newUserEmail: email,
      newUserRole: role
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// PUT /api/users/:id - Update user
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Check for duplicate username/email if being updated
    if (updateData.username || updateData.email) {
      const existingUser = users.find(u => 
        u.id !== id && (u.username === updateData.username || u.email === updateData.email)
      );
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists',
          error: { code: 'DUPLICATE_USER' },
        });
      }
    }

    // Update user
    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;

    logger.info(`Updated user: ${id}`, { 
      userId: req.user?.id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// DELETE /api/users/:id - Delete user
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Prevent self-deletion
    if (id === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
        error: { code: 'SELF_DELETE_FORBIDDEN' },
      });
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);

    logger.info(`Deleted user: ${id}`, { 
      userId: req.user?.id,
      deletedUserEmail: deletedUser.email
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users/:id/activate - Activate user
export const activateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    users[userIndex].isActive = true;
    users[userIndex].updatedAt = new Date().toISOString();

    logger.info(`Activated user: ${id}`, { userId: req.user?.id });

    res.json({
      success: true,
      data: users[userIndex],
      message: 'User activated successfully',
    });
  } catch (error) {
    logger.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users/:id/deactivate - Deactivate user
export const deactivateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'NOT_FOUND' },
      });
    }

    // Prevent self-deactivation
    if (id === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
        error: { code: 'SELF_DEACTIVATE_FORBIDDEN' },
      });
    }

    users[userIndex].isActive = false;
    users[userIndex].updatedAt = new Date().toISOString();

    logger.info(`Deactivated user: ${id}`, { 
      userId: req.user?.id,
      reason
    });

    res.json({
      success: true,
      data: users[userIndex],
      message: 'User deactivated successfully',
    });
  } catch (error) {
    logger.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/search - Search users
export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: { code: 'MISSING_QUERY' },
      });
    }

    const searchTerm = (q as string).toLowerCase();
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.department?.toLowerCase().includes(searchTerm) ||
      user.designation?.toLowerCase().includes(searchTerm)
    );

    res.json({
      success: true,
      data: filteredUsers,
    });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/stats - Get user statistics
export const getUserStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentStats = users.reduce((acc, user) => {
      if (user.department) {
        acc[user.department] = (acc[user.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution: roleStats,
      departmentDistribution: departmentStats,
      recentRegistrations: users
        .filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .length,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/departments - Get departments list
export const getDepartments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    logger.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/users/designations - Get designations list
export const getDesignations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const designations = [...new Set(users.map(u => u.designation).filter(Boolean))];

    res.json({
      success: true,
      data: designations,
    });
  } catch (error) {
    logger.error('Error getting designations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get designations',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/users/bulk-operation - Bulk user operations
export const bulkUserOperation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userIds, operation, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
        error: { code: 'MISSING_USER_IDS' },
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      try {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          failedCount++;
          errors.push(`User ${userId} not found`);
          continue;
        }

        switch (operation) {
          case 'activate':
            users[userIndex].isActive = true;
            break;
          case 'deactivate':
            if (userId === req.user?.id) {
              failedCount++;
              errors.push(`Cannot deactivate your own account`);
              continue;
            }
            users[userIndex].isActive = false;
            break;
          case 'delete':
            if (userId === req.user?.id) {
              failedCount++;
              errors.push(`Cannot delete your own account`);
              continue;
            }
            users.splice(userIndex, 1);
            break;
          case 'change_role':
            if (data?.role) {
              users[userIndex].role = data.role;
            }
            break;
          default:
            failedCount++;
            errors.push(`Unknown operation: ${operation}`);
            continue;
        }

        if (operation !== 'delete') {
          users[userIndex].updatedAt = new Date().toISOString();
        }
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Error processing user ${userId}: ${error}`);
      }
    }

    logger.info(`Bulk operation ${operation} completed`, {
      userId: req.user?.id,
      successCount,
      failedCount,
      operation
    });

    res.json({
      success: true,
      data: {
        success: successCount,
        failed: failedCount,
        errors
      },
      message: `Bulk operation completed: ${successCount} successful, ${failedCount} failed`,
    });
  } catch (error) {
    logger.error('Error in bulk user operation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operation',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
