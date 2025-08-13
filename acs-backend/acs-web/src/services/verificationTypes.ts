import { apiService } from './api';
import type { ApiResponse, PaginationQuery, PaginatedResponse } from '@/types/api';

export interface VerificationType {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  isActive: boolean;
  fields?: {
    name: string;
    type: string;
    required: boolean;
    options?: string[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVerificationTypeData {
  name: string;
  code: string;
  description?: string;
  category: string;
  isActive?: boolean;
  fields?: {
    name: string;
    type: string;
    required: boolean;
    options?: string[];
  }[];
}

export interface UpdateVerificationTypeData extends Partial<CreateVerificationTypeData> {}

export interface VerificationTypeListQuery extends PaginationQuery {
  category?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class VerificationTypesService {
  async getVerificationTypes(query: VerificationTypeListQuery = {}): Promise<PaginatedResponse<VerificationType>> {
    return apiService.get('/verification-types', query);
  }

  async getVerificationTypeById(id: string): Promise<ApiResponse<VerificationType>> {
    return apiService.get(`/verification-types/${id}`);
  }

  async createVerificationType(data: CreateVerificationTypeData): Promise<ApiResponse<VerificationType>> {
    return apiService.post('/verification-types', data);
  }

  async updateVerificationType(id: string, data: UpdateVerificationTypeData): Promise<ApiResponse<VerificationType>> {
    return apiService.put(`/verification-types/${id}`, data);
  }

  async deleteVerificationType(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/verification-types/${id}`);
  }

  async bulkImportVerificationTypes(verificationTypes: CreateVerificationTypeData[]): Promise<ApiResponse<{ created: number; errors: string[] }>> {
    return apiService.post('/verification-types/bulk-import', { verificationTypes });
  }

  async getVerificationTypeCategories(): Promise<ApiResponse<string[]>> {
    return apiService.get('/verification-types/categories');
  }

  async getVerificationTypeStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
  }>> {
    return apiService.get('/verification-types/stats');
  }
}

export const verificationTypesService = new VerificationTypesService();
