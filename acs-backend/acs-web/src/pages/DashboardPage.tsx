import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CaseStatusChart } from '@/components/dashboard/CaseStatusChart';
import { MonthlyTrendsChart } from '@/components/dashboard/MonthlyTrendsChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { useDashboardStats, useRecentActivities, useCaseStatusDistribution, useMonthlyTrends } from '@/hooks/useDashboard';
import { FileText, Building2, CheckSquare, Receipt, Users, Download, Plus, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  // Fetch dashboard data
  const { data: statsData } = useDashboardStats();
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(10);
  const { data: caseDistributionData, isLoading: distributionLoading } = useCaseStatusDistribution();
  const { data: trendsData, isLoading: trendsLoading } = useMonthlyTrends();

  // Mock data fallback for development
  const mockStats = {
    totalCases: 1234,
    inProgressCases: 456,
    completedCases: 789,
    pendingReviewCases: 23,
    activeClients: 89,
    totalInvoices: 156,
    pendingCommissions: 45,
    monthlyRevenue: 125000,
  };

  const stats = statsData?.data || mockStats;

  // Mock data for charts
  const mockCaseDistribution = [
    { status: 'ASSIGNED', count: 234, percentage: 25 },
    { status: 'IN_PROGRESS', count: 456, percentage: 48 },
    { status: 'COMPLETED', count: 234, percentage: 25 },
    { status: 'PENDING_REVIEW', count: 23, percentage: 2 },
  ];

  const mockTrends = [
    { month: 'Jan', cases: 120, revenue: 85000, completionRate: 85 },
    { month: 'Feb', cases: 150, revenue: 95000, completionRate: 88 },
    { month: 'Mar', cases: 180, revenue: 110000, completionRate: 92 },
    { month: 'Apr', cases: 200, revenue: 125000, completionRate: 90 },
    { month: 'May', cases: 220, revenue: 140000, completionRate: 94 },
    { month: 'Jun', cases: 250, revenue: 155000, completionRate: 96 },
  ];

  const mockActivities = [
    {
      id: '1',
      type: 'case_assigned' as const,
      title: 'New case assigned',
      description: 'Case #1234 assigned to John Doe',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      userName: 'Admin',
    },
    {
      id: '2',
      type: 'case_completed' as const,
      title: 'Case completed',
      description: 'Residence verification completed for Case #1235',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      userName: 'Jane Smith',
    },
    {
      id: '3',
      type: 'case_approved' as const,
      title: 'Case approved',
      description: 'Case #1236 approved after review',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      userName: 'Manager',
    },
  ];

  const quickActions = [
    {
      title: 'Create New Case',
      description: 'Assign new case to field user',
      href: '/cases/new',
      icon: Plus,
      count: null,
      color: 'bg-emerald-500',
    },
    {
      title: 'Completed Cases',
      description: 'View finished verifications',
      href: '/cases/completed',
      icon: CheckCircle,
      count: stats.completedCases,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Reviews',
      description: 'Cases waiting for approval',
      href: '/cases/pending',
      icon: CheckSquare,
      count: stats.pendingReviewCases,
      color: 'bg-yellow-500',
    },
    {
      title: 'All Cases',
      description: 'View all case statuses',
      href: '/cases',
      icon: FileText,
      count: stats.totalCases,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Here's what's happening with your cases today.
          </p>
        </div>
        <Button variant="outline" className="flex items-center space-x-2 hover:shadow-md transition-all duration-200">
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Cases"
          value={stats.totalCases}
          description="from last month"
          icon={FileText}
          trend={{ value: 20.1, isPositive: true }}
          color="text-blue-600"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgressCases}
          description="from last month"
          icon={CheckSquare}
          trend={{ value: 15, isPositive: true }}
          color="text-yellow-600"
        />
        <StatsCard
          title="Completed"
          value={stats.completedCases}
          description="from last month"
          icon={CheckSquare}
          trend={{ value: 25, isPositive: true }}
          color="text-green-600"
        />
        <StatsCard
          title="Active Clients"
          value={stats.activeClients}
          description="from last month"
          icon={Building2}
          trend={{ value: 5, isPositive: true }}
          color="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CaseStatusChart
          data={caseDistributionData?.data || mockCaseDistribution}
          isLoading={distributionLoading}
        />
        <MonthlyTrendsChart
          data={trendsData?.data || mockTrends}
          isLoading={trendsLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <div className="group relative overflow-hidden rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                      {action.count !== null && (
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {action.count}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities and Additional Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivities
            activities={activitiesData?.data || mockActivities}
            isLoading={activitiesLoading}
          />
        </div>

        <div className="space-y-6">
          {/* Additional KPIs */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                <span className="font-bold text-green-600">
                  ${stats.monthlyRevenue?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Invoices</span>
                <span className="font-bold">{stats.totalInvoices || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Commissions</span>
                <span className="font-bold text-yellow-600">{stats.pendingCommissions || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Completion Time</span>
                <span className="font-bold">2.3 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-bold text-green-600">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Client Satisfaction</span>
                <span className="font-bold text-blue-600">4.8/5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
