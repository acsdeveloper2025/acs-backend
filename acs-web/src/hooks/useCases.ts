import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesService } from '@/services/cases';
import type { CaseListQuery, CaseUpdateData, CreateCaseData } from '@/services/cases';
import toast from 'react-hot-toast';

// Query keys
export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: CaseListQuery) => [...caseKeys.lists(), filters] as const,
  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
  attachments: (id: string) => [...caseKeys.all, 'attachments', id] as const,
  history: (id: string) => [...caseKeys.all, 'history', id] as const,
  pendingReview: () => [...caseKeys.all, 'pending-review'] as const,
};

// Queries
export const useCases = (query: CaseListQuery = {}) => {
  return useQuery({
    queryKey: caseKeys.list(query),
    queryFn: () => casesService.getCases(query),
  });
};

export const useCase = (id: string) => {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => casesService.getCaseById(id),
    enabled: !!id,
  });
};

export const useCaseAttachments = (id: string) => {
  return useQuery({
    queryKey: caseKeys.attachments(id),
    queryFn: () => casesService.getCaseAttachments(id),
    enabled: !!id,
  });
};

export const useCaseHistory = (id: string) => {
  return useQuery({
    queryKey: caseKeys.history(id),
    queryFn: () => casesService.getCaseHistory(id),
    enabled: !!id,
  });
};

export const usePendingReviewCases = () => {
  return useQuery({
    queryKey: caseKeys.pendingReview(),
    queryFn: () => casesService.getPendingReviewCases(),
  });
};

// Mutations
export const useUpdateCaseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      casesService.updateCaseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update case status');
    },
  });
};

export const useUpdateCasePriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: number }) =>
      casesService.updateCasePriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case priority updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update case priority');
    },
  });
};

export const useUpdateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CaseUpdateData }) =>
      casesService.updateCase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update case');
    },
  });
};

export const useAssignCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      casesService.assignCase(id, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign case');
    },
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCaseData) => casesService.createCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case created and assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create case');
    },
  });
};

export const useApproveCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback?: string }) =>
      casesService.approveCase(id, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve case');
    },
  });
};

export const useRejectCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      casesService.rejectCase(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Case rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject case');
    },
  });
};

export const useRequestRework = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
      casesService.requestRework(id, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caseKeys.all });
      toast.success('Rework requested successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request rework');
    },
  });
};
