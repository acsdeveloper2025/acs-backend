import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

// Mock data for demonstration (replace with actual database operations)
const mockReportData = {
  cases: [
    { id: 'case_1', status: 'COMPLETED', priority: 1, clientId: 'client_1', assignedToId: 'user_1', createdAt: '2024-01-01', completedAt: '2024-01-05', amount: 500 },
    { id: 'case_2', status: 'IN_PROGRESS', priority: 2, clientId: 'client_2', assignedToId: 'user_2', createdAt: '2024-01-02', completedAt: null, amount: 800 },
    { id: 'case_3', status: 'COMPLETED', priority: 1, clientId: 'client_1', assignedToId: 'user_1', createdAt: '2024-01-03', completedAt: '2024-01-07', amount: 500 },
    { id: 'case_4', status: 'APPROVED', priority: 3, clientId: 'client_2', assignedToId: 'user_2', createdAt: '2024-01-04', completedAt: '2024-01-08', amount: 1000 },
  ],
  users: [
    { id: 'user_1', name: 'John Doe', role: 'FIELD', department: 'Operations', isActive: true },
    { id: 'user_2', name: 'Jane Smith', role: 'FIELD', department: 'Operations', isActive: true },
    { id: 'user_3', name: 'Admin User', role: 'ADMIN', department: 'IT', isActive: true },
  ],
  clients: [
    { id: 'client_1', name: 'Acme Corporation', code: 'ACME', isActive: true },
    { id: 'client_2', name: 'Tech Solutions Inc', code: 'TECH', isActive: true },
  ],
  invoices: [
    { id: 'inv_1', clientId: 'client_1', amount: 15000, status: 'PAID', issueDate: '2024-01-01', paidDate: '2024-01-25' },
    { id: 'inv_2', clientId: 'client_2', amount: 8000, status: 'PENDING', issueDate: '2024-01-15', paidDate: null },
  ],
  commissions: [
    { id: 'comm_1', userId: 'user_1', amount: 75, status: 'PAID', caseId: 'case_1' },
    { id: 'comm_2', userId: 'user_2', amount: 96, status: 'PENDING', caseId: 'case_2' },
  ],
};

// GET /api/reports/cases - Cases report
export const getCasesReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      clientId, 
      assignedToId, 
      status, 
      priority, 
      format = 'JSON' 
    } = req.query;

    let filteredCases = [...mockReportData.cases];

    // Apply filters
    if (dateFrom) {
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) >= new Date(dateFrom as string));
    }
    if (dateTo) {
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) <= new Date(dateTo as string));
    }
    if (clientId) {
      filteredCases = filteredCases.filter(c => c.clientId === clientId);
    }
    if (assignedToId) {
      filteredCases = filteredCases.filter(c => c.assignedToId === assignedToId);
    }
    if (status) {
      filteredCases = filteredCases.filter(c => c.status === status);
    }
    if (priority) {
      filteredCases = filteredCases.filter(c => c.priority === Number(priority));
    }

    // Calculate summary statistics
    const totalCases = filteredCases.length;
    const completedCases = filteredCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const pendingCases = filteredCases.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
    const totalAmount = filteredCases.reduce((sum, c) => sum + c.amount, 0);
    const avgTurnaroundTime = filteredCases
      .filter(c => c.completedAt)
      .reduce((acc, c) => {
        const days = (new Date(c.completedAt!).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return acc + days;
      }, 0) / completedCases || 0;

    const report = {
      summary: {
        totalCases,
        completedCases,
        pendingCases,
        completionRate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0,
        totalAmount,
        avgTurnaroundTime: Math.round(avgTurnaroundTime * 100) / 100,
      },
      data: filteredCases,
      filters: { dateFrom, dateTo, clientId, assignedToId, status, priority },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Cases report generated', {
      userId: req.user?.id,
      totalCases,
      filters: { dateFrom, dateTo, clientId, status }
    });

    if (format === 'CSV') {
      // In a real implementation, this would generate and return a CSV file
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/reports/cases/download/${Date.now()}.csv`,
          filename: `cases_report_${new Date().toISOString().split('T')[0]}.csv`,
        },
        message: 'CSV report generated successfully',
      });
    } else {
      res.json({
        success: true,
        data: report,
      });
    }
  } catch (error) {
    logger.error('Error generating cases report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cases report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/users - Users performance report
export const getUsersReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      department, 
      role, 
      isActive, 
      format = 'JSON' 
    } = req.query;

    let filteredUsers = [...mockReportData.users];

    // Apply filters
    if (department) {
      filteredUsers = filteredUsers.filter(u => u.department === department);
    }
    if (role) {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }
    if (isActive !== undefined) {
      filteredUsers = filteredUsers.filter(u => u.isActive === (isActive === 'true'));
    }

    // Calculate performance metrics for each user
    const userPerformance = filteredUsers.map(user => {
      let userCases = mockReportData.cases.filter(c => c.assignedToId === user.id);
      
      // Apply date filters to cases
      if (dateFrom) {
        userCases = userCases.filter(c => new Date(c.createdAt) >= new Date(dateFrom as string));
      }
      if (dateTo) {
        userCases = userCases.filter(c => new Date(c.createdAt) <= new Date(dateTo as string));
      }

      const completedCases = userCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
      const totalAmount = userCases.reduce((sum, c) => sum + c.amount, 0);
      const userCommissions = mockReportData.commissions.filter(c => c.userId === user.id);
      const totalCommissions = userCommissions.reduce((sum, c) => sum + c.amount, 0);

      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        department: user.department,
        totalCases: userCases.length,
        completedCases: completedCases.length,
        completionRate: userCases.length > 0 ? (completedCases.length / userCases.length) * 100 : 0,
        totalAmount,
        totalCommissions,
        avgCaseValue: userCases.length > 0 ? totalAmount / userCases.length : 0,
      };
    });

    const report = {
      summary: {
        totalUsers: filteredUsers.length,
        activeUsers: filteredUsers.filter(u => u.isActive).length,
        totalCasesAssigned: userPerformance.reduce((sum, u) => sum + u.totalCases, 0),
        totalCasesCompleted: userPerformance.reduce((sum, u) => sum + u.completedCases, 0),
        totalRevenue: userPerformance.reduce((sum, u) => sum + u.totalAmount, 0),
        totalCommissions: userPerformance.reduce((sum, u) => sum + u.totalCommissions, 0),
      },
      data: userPerformance,
      filters: { dateFrom, dateTo, department, role, isActive },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Users report generated', {
      userId: req.user?.id,
      totalUsers: filteredUsers.length,
      filters: { department, role }
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating users report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate users report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/clients - Clients report
export const getClientsReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      isActive, 
      format = 'JSON' 
    } = req.query;

    let filteredClients = [...mockReportData.clients];

    if (isActive !== undefined) {
      filteredClients = filteredClients.filter(c => c.isActive === (isActive === 'true'));
    }

    // Calculate metrics for each client
    const clientMetrics = filteredClients.map(client => {
      let clientCases = mockReportData.cases.filter(c => c.clientId === client.id);
      let clientInvoices = mockReportData.invoices.filter(i => i.clientId === client.id);

      // Apply date filters
      if (dateFrom) {
        clientCases = clientCases.filter(c => new Date(c.createdAt) >= new Date(dateFrom as string));
        clientInvoices = clientInvoices.filter(i => new Date(i.issueDate) >= new Date(dateFrom as string));
      }
      if (dateTo) {
        clientCases = clientCases.filter(c => new Date(c.createdAt) <= new Date(dateTo as string));
        clientInvoices = clientInvoices.filter(i => new Date(i.issueDate) <= new Date(dateTo as string));
      }

      const completedCases = clientCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');
      const totalInvoiceAmount = clientInvoices.reduce((sum, i) => sum + i.amount, 0);
      const paidInvoices = clientInvoices.filter(i => i.status === 'PAID');
      const paidAmount = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

      return {
        clientId: client.id,
        clientName: client.name,
        clientCode: client.code,
        totalCases: clientCases.length,
        completedCases: completedCases.length,
        completionRate: clientCases.length > 0 ? (completedCases.length / clientCases.length) * 100 : 0,
        totalInvoices: clientInvoices.length,
        totalInvoiceAmount,
        paidAmount,
        pendingAmount: totalInvoiceAmount - paidAmount,
        collectionRate: totalInvoiceAmount > 0 ? (paidAmount / totalInvoiceAmount) * 100 : 0,
      };
    });

    const report = {
      summary: {
        totalClients: filteredClients.length,
        activeClients: filteredClients.filter(c => c.isActive).length,
        totalCases: clientMetrics.reduce((sum, c) => sum + c.totalCases, 0),
        totalRevenue: clientMetrics.reduce((sum, c) => sum + c.totalInvoiceAmount, 0),
        totalCollected: clientMetrics.reduce((sum, c) => sum + c.paidAmount, 0),
        totalPending: clientMetrics.reduce((sum, c) => sum + c.pendingAmount, 0),
      },
      data: clientMetrics,
      filters: { dateFrom, dateTo, isActive },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Clients report generated', {
      userId: req.user?.id,
      totalClients: filteredClients.length
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating clients report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate clients report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/financial - Financial report
export const getFinancialReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      dateFrom,
      dateTo,
      clientId,
      format = 'JSON'
    } = req.query;

    let filteredInvoices = [...mockReportData.invoices];
    let filteredCommissions = [...mockReportData.commissions];

    // Apply filters
    if (dateFrom) {
      filteredInvoices = filteredInvoices.filter(i => new Date(i.issueDate) >= new Date(dateFrom as string));
    }
    if (dateTo) {
      filteredInvoices = filteredInvoices.filter(i => new Date(i.issueDate) <= new Date(dateTo as string));
    }
    if (clientId) {
      filteredInvoices = filteredInvoices.filter(i => i.clientId === clientId);
    }

    // Calculate financial metrics
    const totalInvoiceAmount = filteredInvoices.reduce((sum, i) => sum + i.amount, 0);
    const paidInvoices = filteredInvoices.filter(i => i.status === 'PAID');
    const paidAmount = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = totalInvoiceAmount - paidAmount;
    const totalCommissions = filteredCommissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = filteredCommissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);

    // Monthly breakdown
    const monthlyData = filteredInvoices.reduce((acc, invoice) => {
      const month = new Date(invoice.issueDate).toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { invoiced: 0, collected: 0, pending: 0 };
      }
      acc[month].invoiced += invoice.amount;
      if (invoice.status === 'PAID') {
        acc[month].collected += invoice.amount;
      } else {
        acc[month].pending += invoice.amount;
      }
      return acc;
    }, {} as Record<string, any>);

    const report = {
      summary: {
        totalInvoices: filteredInvoices.length,
        totalInvoiceAmount,
        paidAmount,
        pendingAmount,
        collectionRate: totalInvoiceAmount > 0 ? (paidAmount / totalInvoiceAmount) * 100 : 0,
        totalCommissions,
        paidCommissions,
        pendingCommissions: totalCommissions - paidCommissions,
        netRevenue: paidAmount - paidCommissions,
      },
      monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
      })),
      invoices: filteredInvoices,
      filters: { dateFrom, dateTo, clientId },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Financial report generated', {
      userId: req.user?.id,
      totalAmount: totalInvoiceAmount,
      filters: { dateFrom, dateTo, clientId }
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating financial report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/productivity - Productivity report
export const getProductivityReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      dateFrom,
      dateTo,
      userId,
      department,
      format = 'JSON'
    } = req.query;

    let filteredCases = [...mockReportData.cases];
    let filteredUsers = [...mockReportData.users];

    // Apply filters
    if (dateFrom) {
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) >= new Date(dateFrom as string));
    }
    if (dateTo) {
      filteredCases = filteredCases.filter(c => new Date(c.createdAt) <= new Date(dateTo as string));
    }
    if (userId) {
      filteredCases = filteredCases.filter(c => c.assignedToId === userId);
      filteredUsers = filteredUsers.filter(u => u.id === userId);
    }
    if (department) {
      const departmentUsers = filteredUsers.filter(u => u.department === department);
      const departmentUserIds = departmentUsers.map(u => u.id);
      filteredCases = filteredCases.filter(c => departmentUserIds.includes(c.assignedToId));
      filteredUsers = departmentUsers;
    }

    // Calculate productivity metrics
    const userProductivity = filteredUsers.map(user => {
      const userCases = filteredCases.filter(c => c.assignedToId === user.id);
      const completedCases = userCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED');

      // Calculate average turnaround time
      const casesWithTurnaround = completedCases.filter(c => c.completedAt);
      const avgTurnaround = casesWithTurnaround.length > 0
        ? casesWithTurnaround.reduce((acc, c) => {
            const days = (new Date(c.completedAt!).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return acc + days;
          }, 0) / casesWithTurnaround.length
        : 0;

      return {
        userId: user.id,
        userName: user.name,
        department: user.department,
        role: user.role,
        totalCases: userCases.length,
        completedCases: completedCases.length,
        pendingCases: userCases.length - completedCases.length,
        completionRate: userCases.length > 0 ? (completedCases.length / userCases.length) * 100 : 0,
        avgTurnaroundTime: Math.round(avgTurnaround * 100) / 100,
        productivity: userCases.length > 0 ? (completedCases.length / userCases.length) * 100 : 0,
      };
    });

    // Department-wise summary
    const departmentSummary = filteredUsers.reduce((acc, user) => {
      if (!acc[user.department]) {
        acc[user.department] = {
          department: user.department,
          totalUsers: 0,
          totalCases: 0,
          completedCases: 0,
          avgProductivity: 0,
        };
      }

      const userMetrics = userProductivity.find(up => up.userId === user.id);
      if (userMetrics) {
        acc[user.department].totalUsers++;
        acc[user.department].totalCases += userMetrics.totalCases;
        acc[user.department].completedCases += userMetrics.completedCases;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate average productivity for each department
    Object.values(departmentSummary).forEach((dept: any) => {
      dept.avgProductivity = dept.totalCases > 0 ? (dept.completedCases / dept.totalCases) * 100 : 0;
    });

    const report = {
      summary: {
        totalUsers: filteredUsers.length,
        totalCases: filteredCases.length,
        completedCases: filteredCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length,
        overallProductivity: filteredCases.length > 0
          ? (filteredCases.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length / filteredCases.length) * 100
          : 0,
      },
      userProductivity,
      departmentSummary: Object.values(departmentSummary),
      filters: { dateFrom, dateTo, userId, department },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Productivity report generated', {
      userId: req.user?.id,
      totalUsers: filteredUsers.length,
      totalCases: filteredCases.length
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating productivity report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate productivity report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/custom - Custom report builder
export const getCustomReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      reportType,
      dateFrom,
      dateTo,
      groupBy,
      metrics,
      filters,
      format = 'JSON'
    } = req.body;

    if (!reportType || !metrics) {
      return res.status(400).json({
        success: false,
        message: 'Report type and metrics are required',
        error: { code: 'MISSING_PARAMETERS' },
      });
    }

    let data: any[] = [];

    // Select data source based on report type
    switch (reportType) {
      case 'cases':
        data = mockReportData.cases;
        break;
      case 'users':
        data = mockReportData.users;
        break;
      case 'clients':
        data = mockReportData.clients;
        break;
      case 'invoices':
        data = mockReportData.invoices;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
          error: { code: 'INVALID_REPORT_TYPE' },
        });
    }

    // Apply date filters
    if (dateFrom && data.length > 0 && data[0].createdAt) {
      data = data.filter(item => new Date(item.createdAt || item.issueDate) >= new Date(dateFrom));
    }
    if (dateTo && data.length > 0 && data[0].createdAt) {
      data = data.filter(item => new Date(item.createdAt || item.issueDate) <= new Date(dateTo));
    }

    // Apply custom filters
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data = data.filter(item => item[key] === value);
        }
      });
    }

    // Group data if groupBy is specified
    let groupedData: any = {};
    if (groupBy) {
      groupedData = data.reduce((acc, item) => {
        const groupKey = item[groupBy] || 'Unknown';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      }, {});
    }

    // Calculate metrics
    const calculatedMetrics: any = {};
    metrics.forEach((metric: string) => {
      switch (metric) {
        case 'count':
          calculatedMetrics.count = data.length;
          break;
        case 'sum':
          calculatedMetrics.sum = data.reduce((sum, item) => sum + (item.amount || 0), 0);
          break;
        case 'average':
          calculatedMetrics.average = data.length > 0
            ? data.reduce((sum, item) => sum + (item.amount || 0), 0) / data.length
            : 0;
          break;
        case 'min':
          calculatedMetrics.min = data.length > 0
            ? Math.min(...data.map(item => item.amount || 0))
            : 0;
          break;
        case 'max':
          calculatedMetrics.max = data.length > 0
            ? Math.max(...data.map(item => item.amount || 0))
            : 0;
          break;
      }
    });

    const report = {
      reportType,
      metrics: calculatedMetrics,
      data: groupBy ? groupedData : data,
      summary: {
        totalRecords: data.length,
        groupedBy: groupBy || null,
        appliedFilters: filters || {},
      },
      parameters: { reportType, dateFrom, dateTo, groupBy, metrics, filters },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id,
    };

    logger.info('Custom report generated', {
      userId: req.user?.id,
      reportType,
      totalRecords: data.length,
      metrics
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/reports/templates - Get report templates
export const getReportTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = [
      {
        id: 'template_1',
        name: 'Monthly Cases Summary',
        description: 'Monthly summary of all cases with completion rates',
        reportType: 'cases',
        parameters: {
          groupBy: 'month',
          metrics: ['count', 'average'],
          defaultDateRange: 'last_month',
        },
        isActive: true,
      },
      {
        id: 'template_2',
        name: 'User Performance Report',
        description: 'Individual user performance metrics and rankings',
        reportType: 'users',
        parameters: {
          groupBy: 'department',
          metrics: ['count', 'average'],
          defaultDateRange: 'last_quarter',
        },
        isActive: true,
      },
      {
        id: 'template_3',
        name: 'Client Revenue Analysis',
        description: 'Revenue analysis by client with payment status',
        reportType: 'clients',
        parameters: {
          groupBy: 'client',
          metrics: ['sum', 'count'],
          defaultDateRange: 'last_year',
        },
        isActive: true,
      },
      {
        id: 'template_4',
        name: 'Financial Dashboard',
        description: 'Comprehensive financial overview with trends',
        reportType: 'invoices',
        parameters: {
          groupBy: 'month',
          metrics: ['sum', 'count', 'average'],
          defaultDateRange: 'last_6_months',
        },
        isActive: true,
      },
    ];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Error getting report templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report templates',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// POST /api/reports/schedule - Schedule report
export const scheduleReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      reportType,
      parameters,
      schedule,
      recipients,
      format = 'PDF'
    } = req.body;

    const scheduledReport = {
      id: `scheduled_${Date.now()}`,
      reportType,
      parameters,
      schedule, // e.g., { frequency: 'weekly', dayOfWeek: 'monday', time: '09:00' }
      recipients,
      format,
      isActive: true,
      createdBy: req.user?.id,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: calculateNextRun(schedule),
    };

    logger.info('Report scheduled', {
      userId: req.user?.id,
      reportType,
      schedule,
      recipients: recipients?.length || 0
    });

    res.status(201).json({
      success: true,
      data: scheduledReport,
      message: 'Report scheduled successfully',
    });
  } catch (error) {
    logger.error('Error scheduling report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule report',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// Helper function to calculate next run time
function calculateNextRun(schedule: any): string {
  // Simple implementation - in real app, use a proper scheduling library
  const now = new Date();
  const nextRun = new Date(now);

  switch (schedule.frequency) {
    case 'daily':
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      nextRun.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      nextRun.setMonth(now.getMonth() + 1);
      break;
    default:
      nextRun.setDate(now.getDate() + 1);
  }

  return nextRun.toISOString();
}
