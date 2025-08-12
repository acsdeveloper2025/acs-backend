import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for demonstration (replace with actual database operations)
const mockCases = [
  { id: 'case_1', status: 'PENDING', priority: 1, clientId: 'client_1', assignedToId: 'user_1', createdAt: '2024-01-01T00:00:00.000Z', completedAt: null },
  { id: 'case_2', status: 'IN_PROGRESS', priority: 2, clientId: 'client_2', assignedToId: 'user_2', createdAt: '2024-01-02T00:00:00.000Z', completedAt: null },
  { id: 'case_3', status: 'COMPLETED', priority: 1, clientId: 'client_1', assignedToId: 'user_1', createdAt: '2024-01-03T00:00:00.000Z', completedAt: '2024-01-05T00:00:00.000Z' },
  { id: 'case_4', status: 'APPROVED', priority: 3, clientId: 'client_2', assignedToId: 'user_2', createdAt: '2024-01-04T00:00:00.000Z', completedAt: '2024-01-06T00:00:00.000Z' },
  { id: 'case_5', status: 'REJECTED', priority: 2, clientId: 'client_1', assignedToId: 'user_1', createdAt: '2024-01-05T00:00:00.000Z', completedAt: '2024-01-07T00:00:00.000Z' },
];

const mockClients = [
  { id: 'client_1', name: 'Acme Corporation', code: 'ACME_CORP', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'client_2', name: 'Tech Solutions Inc', code: 'TECH_SOL', createdAt: '2024-01-02T00:00:00.000Z' },
];

const mockUsers = [
  { id: 'user_1', name: 'John Doe', role: 'FIELD', isActive: true, department: 'Operations' },
  { id: 'user_2', name: 'Jane Smith', role: 'FIELD', isActive: true, department: 'Operations' },
  { id: 'user_3', name: 'Admin User', role: 'ADMIN', isActive: true, department: 'IT' },
];

const mockActivities = [
  { id: 'activity_1', type: 'CASE_CREATED', description: 'New case created', userId: 'user_1', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 'activity_2', type: 'CASE_COMPLETED', description: 'Case completed successfully', userId: 'user_2', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'activity_3', type: 'USER_LOGIN', description: 'User logged in', userId: 'user_1', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: 'activity_4', type: 'CASE_ASSIGNED', description: 'Case assigned to field agent', userId: 'user_3', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
];

// GET /api/dashboard - Get dashboard overview
export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'month', clientId, userId } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filter cases based on criteria
    let filteredCases = mockCases.filter(c => new Date(c.createdAt) >= startDate);
    if (clientId) {
      filteredCases = filteredCases.filter(c => c.clientId === clientId);
    }
    if (userId) {
      filteredCases = filteredCases.filter(c => c.assignedToId === userId);
    }

    // Calculate key metrics
    const totalCases = filteredCases.length;
    const completedCases = filteredCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const pendingCases = filteredCases.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
    const rejectedCases = filteredCases.filter(c => c.status === 'REJECTED').length;
    
    const completionRate = totalCases > 0 ? (completedCases / totalCases) * 100 : 0;
    
    // Calculate average turnaround time for completed cases
    const completedCasesWithTime = filteredCases.filter(c => c.completedAt);
    const avgTurnaroundTime = completedCasesWithTime.length > 0 
      ? completedCasesWithTime.reduce((acc, c) => {
          const created = new Date(c.createdAt).getTime();
          const completed = new Date(c.completedAt!).getTime();
          return acc + (completed - created);
        }, 0) / completedCasesWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const dashboardData = {
      overview: {
        totalCases,
        completedCases,
        pendingCases,
        rejectedCases,
        completionRate: Math.round(completionRate * 100) / 100,
        avgTurnaroundTime: Math.round(avgTurnaroundTime * 100) / 100,
      },
      trends: {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      quickStats: {
        totalClients: mockClients.length,
        activeUsers: mockUsers.filter(u => u.isActive).length,
        totalUsers: mockUsers.length,
      }
    };

    logger.info('Dashboard data retrieved', { 
      userId: req.user?.id,
      period,
      totalCases
    });

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/stats - Get dashboard statistics
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;

    // Case status distribution
    const statusDistribution = mockCases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority distribution
    const priorityDistribution = mockCases.reduce((acc, c) => {
      const priority = `Priority ${c.priority}`;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // User performance
    const userPerformance = mockUsers.map(user => {
      const userCases = mockCases.filter(c => c.assignedToId === user.id);
      const completedCases = userCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
      
      return {
        userId: user.id,
        userName: user.name,
        totalCases: userCases.length,
        completedCases: completedCases.length,
        completionRate: userCases.length > 0 ? (completedCases.length / userCases.length) * 100 : 0,
      };
    });

    // Client distribution
    const clientDistribution = mockClients.map(client => {
      const clientCases = mockCases.filter(c => c.clientId === client.id);
      return {
        clientId: client.id,
        clientName: client.name,
        totalCases: clientCases.length,
        completedCases: clientCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length,
      };
    });

    const stats = {
      statusDistribution,
      priorityDistribution,
      userPerformance,
      clientDistribution,
      period,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/case-status-distribution - Case status distribution
export const getCaseStatusDistribution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statusDistribution = mockCases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const distributionArray = Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / mockCases.length) * 100 * 100) / 100,
    }));

    res.json({
      success: true,
      data: distributionArray,
    });
  } catch (error) {
    logger.error('Error getting case status distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get case status distribution',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/client-stats - Client statistics
export const getClientStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientStats = mockClients.map(client => {
      const clientCases = mockCases.filter(c => c.clientId === client.id);
      const completedCases = clientCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
      const pendingCases = clientCases.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS');
      
      return {
        clientId: client.id,
        clientName: client.name,
        clientCode: client.code,
        totalCases: clientCases.length,
        completedCases: completedCases.length,
        pendingCases: pendingCases.length,
        completionRate: clientCases.length > 0 ? (completedCases.length / clientCases.length) * 100 : 0,
      };
    });

    res.json({
      success: true,
      data: clientStats,
    });
  } catch (error) {
    logger.error('Error getting client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client statistics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/monthly-trends - Monthly trends
export const getMonthlyTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { months = 6 } = req.query;
    const monthsCount = Math.min(Number(months), 12);
    
    const trends = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthCases = mockCases.filter(c => {
        const caseDate = new Date(c.createdAt);
        return caseDate >= monthStart && caseDate <= monthEnd;
      });
      
      const completedCases = monthCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
      
      trends.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        monthName: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalCases: monthCases.length,
        completedCases: completedCases.length,
        completionRate: monthCases.length > 0 ? (completedCases.length / monthCases.length) * 100 : 0,
      });
    }

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error getting monthly trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly trends',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/recent-activities - Recent activities
export const getRecentActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(Number(limit), 50);
    
    const recentActivities = mockActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitNum)
      .map(activity => ({
        ...activity,
        user: mockUsers.find(u => u.id === activity.userId),
        timeAgo: getTimeAgo(new Date(activity.timestamp)),
      }));

    res.json({
      success: true,
      data: recentActivities,
    });
  } catch (error) {
    logger.error('Error getting recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activities',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/performance-metrics - Performance metrics
export const getPerformanceMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate overall performance metrics
    const totalCases = mockCases.length;
    const completedCases = mockCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const avgCompletionRate = totalCases > 0 ? (completedCases / totalCases) * 100 : 0;

    // Calculate average turnaround time
    const completedCasesWithTime = mockCases.filter(c => c.completedAt);
    const avgTurnaroundTime = completedCasesWithTime.length > 0
      ? completedCasesWithTime.reduce((acc, c) => {
          const created = new Date(c.createdAt).getTime();
          const completed = new Date(c.completedAt!).getTime();
          return acc + (completed - created);
        }, 0) / completedCasesWithTime.length / (1000 * 60 * 60 * 24)
      : 0;

    // User efficiency metrics
    const userMetrics = mockUsers.map(user => {
      const userCases = mockCases.filter(c => c.assignedToId === user.id);
      const userCompleted = userCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');

      return {
        userId: user.id,
        userName: user.name,
        casesAssigned: userCases.length,
        casesCompleted: userCompleted.length,
        efficiency: userCases.length > 0 ? (userCompleted.length / userCases.length) * 100 : 0,
      };
    });

    const metrics = {
      overall: {
        totalCases,
        completedCases,
        completionRate: Math.round(avgCompletionRate * 100) / 100,
        avgTurnaroundTime: Math.round(avgTurnaroundTime * 100) / 100,
      },
      userMetrics,
      period,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/turnaround-times - Turnaround times
export const getTurnaroundTimes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const completedCases = mockCases.filter(c => c.completedAt);

    const turnaroundData = completedCases.map(c => {
      const created = new Date(c.createdAt).getTime();
      const completed = new Date(c.completedAt!).getTime();
      const turnaroundDays = (completed - created) / (1000 * 60 * 60 * 24);

      return {
        caseId: c.id,
        clientId: c.clientId,
        priority: c.priority,
        turnaroundDays: Math.round(turnaroundDays * 100) / 100,
        status: c.status,
      };
    });

    // Calculate statistics
    const turnaroundTimes = turnaroundData.map(d => d.turnaroundDays);
    const avgTurnaround = turnaroundTimes.length > 0
      ? turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length
      : 0;
    const minTurnaround = turnaroundTimes.length > 0 ? Math.min(...turnaroundTimes) : 0;
    const maxTurnaround = turnaroundTimes.length > 0 ? Math.max(...turnaroundTimes) : 0;

    const result = {
      cases: turnaroundData,
      statistics: {
        average: Math.round(avgTurnaround * 100) / 100,
        minimum: Math.round(minTurnaround * 100) / 100,
        maximum: Math.round(maxTurnaround * 100) / 100,
        totalCases: turnaroundData.length,
      },
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting turnaround times:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get turnaround times',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/top-performers - Top performers
export const getTopPerformers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = Math.min(Number(limit), 20);

    const userPerformance = mockUsers.map(user => {
      const userCases = mockCases.filter(c => c.assignedToId === user.id);
      const completedCases = userCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
      const completionRate = userCases.length > 0 ? (completedCases.length / userCases.length) * 100 : 0;

      // Calculate average turnaround time for this user
      const userCompletedWithTime = userCases.filter(c => c.completedAt);
      const avgTurnaround = userCompletedWithTime.length > 0
        ? userCompletedWithTime.reduce((acc, c) => {
            const created = new Date(c.createdAt).getTime();
            const completed = new Date(c.completedAt!).getTime();
            return acc + (completed - created);
          }, 0) / userCompletedWithTime.length / (1000 * 60 * 60 * 24)
        : 0;

      return {
        userId: user.id,
        userName: user.name,
        department: user.department,
        role: user.role,
        totalCases: userCases.length,
        completedCases: completedCases.length,
        completionRate: Math.round(completionRate * 100) / 100,
        avgTurnaroundTime: Math.round(avgTurnaround * 100) / 100,
        score: completionRate + (userCases.length * 2), // Simple scoring algorithm
      };
    })
    .filter(user => user.totalCases > 0) // Only include users with cases
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limitNum);

    res.json({
      success: true,
      data: userPerformance,
    });
  } catch (error) {
    logger.error('Error getting top performers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top performers',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/upcoming-deadlines - Upcoming deadlines
export const getUpcomingDeadlines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Mock upcoming deadlines (in real implementation, this would come from case deadlines)
    const upcomingDeadlines = [
      {
        caseId: 'case_1',
        title: 'Residence Verification - Acme Corp',
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 1,
        assignedTo: 'user_1',
        status: 'PENDING',
        daysRemaining: 2,
      },
      {
        caseId: 'case_2',
        title: 'Office Verification - Tech Solutions',
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 2,
        assignedTo: 'user_2',
        status: 'IN_PROGRESS',
        daysRemaining: 5,
      },
    ];

    // Add user information
    const deadlinesWithUsers = upcomingDeadlines.map(deadline => ({
      ...deadline,
      assignedUser: mockUsers.find(u => u.id === deadline.assignedTo),
    }));

    res.json({
      success: true,
      data: deadlinesWithUsers,
    });
  } catch (error) {
    logger.error('Error getting upcoming deadlines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming deadlines',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/dashboard/alerts - System alerts
export const getAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock system alerts
    const alerts = [
      {
        id: 'alert_1',
        type: 'WARNING',
        title: 'High Priority Cases Pending',
        message: '3 high priority cases are pending for more than 24 hours',
        severity: 'medium',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: false,
      },
      {
        id: 'alert_2',
        type: 'INFO',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance on Sunday 2 AM - 4 AM',
        severity: 'low',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        isRead: false,
      },
      {
        id: 'alert_3',
        type: 'SUCCESS',
        title: 'Monthly Target Achieved',
        message: 'Congratulations! Monthly case completion target achieved',
        severity: 'low',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isRead: true,
      },
    ];

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/dashboard/export - Export dashboard report
export const exportDashboardReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'month', format = 'PDF' } = req.body;

    // In a real implementation, this would generate and return a file
    // For now, we'll return a mock response
    const reportData = {
      reportId: `dashboard_report_${Date.now()}`,
      period,
      format,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
      downloadUrl: `/api/dashboard/reports/dashboard_report_${Date.now()}.${format.toLowerCase()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    logger.info('Dashboard report export requested', {
      userId: req.user?.id,
      period,
      format
    });

    res.json({
      success: true,
      data: reportData,
      message: 'Dashboard report generated successfully',
    });
  } catch (error) {
    logger.error('Error exporting dashboard report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export dashboard report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
