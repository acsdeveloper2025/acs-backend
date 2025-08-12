import { apiService } from './api';
import type { Case } from '@/types/case';
import type { ApiResponse, PaginationQuery } from '@/types/api';

export interface CaseListQuery extends PaginationQuery {
  status?: string;
  search?: string;
  assignedTo?: string;
  clientId?: string;
  priority?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CaseUpdateData {
  status?: string;
  priority?: number;
  notes?: string;
  assignedToId?: string;
}

export interface CreateCaseData {
  title: string;
  description: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  latitude?: number;
  longitude?: number;
  verificationType?: string;
  verificationTypeId?: string;
  assignedToId: string;
  clientId: string;
  priority?: number;
  notes?: string;
}

export class CasesService {
  async getCases(query: CaseListQuery = {}): Promise<ApiResponse<Case[]>> {
    return apiService.get('/cases', query);
  }

  async getCaseById(id: string): Promise<ApiResponse<Case>> {
    return apiService.get(`/cases/${id}`);
  }

  async createCase(data: CreateCaseData): Promise<ApiResponse<Case>> {
    return apiService.post('/cases', data);
  }

  async updateCaseStatus(id: string, status: string): Promise<ApiResponse<Case>> {
    return apiService.put(`/cases/${id}/status`, { status });
  }

  async updateCasePriority(id: string, priority: number): Promise<ApiResponse<Case>> {
    return apiService.put(`/cases/${id}/priority`, { priority });
  }

  async updateCase(id: string, data: CaseUpdateData): Promise<ApiResponse<Case>> {
    return apiService.put(`/cases/${id}`, data);
  }

  async assignCase(id: string, assignedToId: string): Promise<ApiResponse<Case>> {
    return apiService.put(`/cases/${id}/assign`, { assignedToId });
  }

  async addCaseNote(id: string, note: string): Promise<ApiResponse<Case>> {
    return apiService.post(`/cases/${id}/notes`, { note });
  }

  async completeCase(id: string, data: any): Promise<ApiResponse<Case>> {
    return apiService.post(`/cases/${id}/complete`, data);
  }

  async getCaseAttachments(id: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`/attachments/case/${id}`);
  }

  async downloadAttachment(id: string): Promise<Blob> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attachments/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    return response.blob();
  }

  async getCaseHistory(id: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`/cases/${id}/history`);
  }

  async getCasesByStatus(status: string): Promise<ApiResponse<Case[]>> {
    return this.getCases({ status });
  }

  async getPendingReviewCases(): Promise<ApiResponse<Case[]>> {
    return this.getCases({ status: 'COMPLETED' });
  }

  async approveCase(id: string, feedback?: string): Promise<ApiResponse<Case>> {
    return apiService.post(`/cases/${id}/approve`, { feedback });
  }

  async rejectCase(id: string, reason: string): Promise<ApiResponse<Case>> {
    return apiService.post(`/cases/${id}/reject`, { reason });
  }

  async requestRework(id: string, feedback: string): Promise<ApiResponse<Case>> {
    return apiService.post(`/cases/${id}/rework`, { feedback });
  }
}

export const casesService = new CasesService();
