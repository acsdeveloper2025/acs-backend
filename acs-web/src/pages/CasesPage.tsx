import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaseFilters } from '@/components/cases/CaseFilters';
import { CaseTable } from '@/components/cases/CaseTable';
import { CasePagination } from '@/components/cases/CasePagination';
import { useCases, useUpdateCaseStatus, useAssignCase } from '@/hooks/useCases';
import { Download, Plus, RefreshCw } from 'lucide-react';
import type { CaseListQuery } from '@/services/cases';

export const CasesPage: React.FC = () => {
  const [filters, setFilters] = useState<CaseListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Add error handling
  const { data: casesData, isLoading, error, refetch } = useCases(filters);
  const updateStatusMutation = useUpdateCaseStatus();
  const assignCaseMutation = useAssignCase();

  // Debug logging
  console.log('CasesPage - casesData:', casesData);
  console.log('CasesPage - isLoading:', isLoading);
  console.log('CasesPage - error:', error);

  const cases = casesData?.data || [];
  const pagination = casesData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  const handleFiltersChange = (newFilters: CaseListQuery) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleUpdateStatus = async (caseId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: caseId, status });
      refetch();
    } catch (error) {
      console.error('Failed to update case status:', error);
    }
  };

  const handleAssignCase = async (caseId: string, userId: string) => {
    try {
      await assignCaseMutation.mutateAsync({ id: caseId, assignedToId: userId });
      refetch();
    } catch (error) {
      console.error('Failed to assign case:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export cases with filters:', filters);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all verification cases
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CaseFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cases</CardTitle>
              <CardDescription>
                {pagination.total > 0 
                  ? `Showing ${pagination.total} case${pagination.total === 1 ? '' : 's'}`
                  : 'No cases found'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CaseTable
            cases={cases}
            isLoading={isLoading}
            onUpdateStatus={handleUpdateStatus}
            onAssignCase={handleAssignCase}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > 0 && (
        <CasePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
