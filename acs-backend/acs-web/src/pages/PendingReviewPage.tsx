import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PendingReviewTable } from '@/components/review/PendingReviewTable';
import { ReviewDialog } from '@/components/review/ReviewDialog';
import { usePendingReviewCases, useApproveCase, useRejectCase, useRequestRework } from '@/hooks/useCases';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { Case } from '@/types/case';

export const PendingReviewPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data: casesData, isLoading, refetch } = usePendingReviewCases();
  const approveMutation = useApproveCase();
  const rejectMutation = useRejectCase();
  const reworkMutation = useRequestRework();

  const cases = casesData?.data || [];

  // Calculate statistics
  const totalPending = cases.length;
  const urgentCases = cases.filter(c => c.priority >= 3).length;
  const oldCases = cases.filter(c => {
    if (!c.completedAt) return false;
    const completed = new Date(c.completedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - completed.getTime()) / (1000 * 60 * 60));
    return diffInHours > 72; // More than 3 days
  }).length;

  const handleReviewCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setSelectedCase(null);
    setIsReviewDialogOpen(false);
  };

  const handleApprove = async (caseId: string, feedback?: string) => {
    await approveMutation.mutateAsync({ id: caseId, feedback });
    refetch();
  };

  const handleReject = async (caseId: string, reason: string) => {
    await rejectMutation.mutateAsync({ id: caseId, reason });
    refetch();
  };

  const handleRequestRework = async (caseId: string, feedback: string) => {
    await reworkMutation.mutateAsync({ id: caseId, feedback });
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Reviews</h1>
          <p className="mt-2 text-gray-600">
            Review completed cases and provide feedback
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Cases awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentCases}</div>
            <p className="text-xs text-muted-foreground">
              High priority cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oldCases}</div>
            <p className="text-xs text-muted-foreground">
              Waiting &gt; 3 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {totalPending > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common review actions for efficient processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve All Low Priority
              </Badge>
              <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Review Urgent First
              </Badge>
              <Badge variant="secondary" className="text-red-700 bg-red-100">
                <XCircle className="h-3 w-3 mr-1" />
                Flag Overdue Cases
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                {totalPending > 0 
                  ? `${totalPending} case${totalPending === 1 ? '' : 's'} waiting for review`
                  : 'No cases pending review'
                }
              </CardDescription>
            </div>
            {urgentCases > 0 && (
              <Badge variant="destructive">
                {urgentCases} Urgent
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PendingReviewTable
            cases={cases}
            isLoading={isLoading}
            onReviewCase={handleReviewCase}
          />
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <ReviewDialog
        isOpen={isReviewDialogOpen}
        onClose={handleCloseReviewDialog}
        case={selectedCase}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestRework={handleRequestRework}
        isLoading={approveMutation.isPending || rejectMutation.isPending || reworkMutation.isPending}
      />
    </div>
  );
};
