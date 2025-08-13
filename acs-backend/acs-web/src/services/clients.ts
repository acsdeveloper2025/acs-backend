import { apiService } from './api';
import type { 
  Client, 
  Product, 
  VerificationType,
  CreateClientData,
  UpdateClientData,
  CreateProductData,
  UpdateProductData,
  CreateVerificationTypeData,
  UpdateVerificationTypeData
} from '@/types/client';
import type { ApiResponse, PaginationQuery } from '@/types/api';

export class ClientsService {
  // Client operations
  async getClients(query: PaginationQuery = {}): Promise<ApiResponse<Client[]>> {
    return apiService.get('/clients', query);
  }

  async getClientById(id: string): Promise<ApiResponse<Client>> {
    return apiService.get(`/clients/${id}`);
  }

  async createClient(data: CreateClientData): Promise<ApiResponse<Client>> {
    return apiService.post('/clients', data);
  }

  async updateClient(id: string, data: UpdateClientData): Promise<ApiResponse<Client>> {
    return apiService.put(`/clients/${id}`, data);
  }

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/clients/${id}`);
  }

  // Product operations
  async getProducts(query: PaginationQuery = {}): Promise<ApiResponse<Product[]>> {
    return apiService.get('/products', query);
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return apiService.get(`/products/${id}`);
  }

  async getProductsByClient(clientId: string, isActive?: boolean): Promise<ApiResponse<Product[]>> {
    const params = isActive !== undefined ? { isActive } : {};
    return apiService.get(`/clients/${clientId}/products`, params);
  }

  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    return apiService.post('/products', data);
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<ApiResponse<Product>> {
    return apiService.put(`/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/products/${id}`);
  }

  // Verification Type operations
  async getVerificationTypes(query: PaginationQuery = {}): Promise<ApiResponse<VerificationType[]>> {
    return apiService.get('/verification-types', query);
  }

  async getVerificationTypeById(id: string): Promise<ApiResponse<VerificationType>> {
    return apiService.get(`/verification-types/${id}`);
  }

  async getVerificationTypesByClient(clientId: string, isActive?: boolean): Promise<ApiResponse<VerificationType[]>> {
    const params = isActive !== undefined ? { isActive } : {};
    return apiService.get(`/clients/${clientId}/verification-types`, params);
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

  // Mapping operations
  async mapClientToCities(clientId: string, cityIds: string[]): Promise<ApiResponse<void>> {
    return apiService.post(`/clients/${clientId}/cities`, { cityIds });
  }

  async mapProductToVerificationTypes(productId: string, verificationTypeIds: string[]): Promise<ApiResponse<void>> {
    return apiService.post(`/products/${productId}/verification-types`, { verificationTypeIds });
  }

  // Bulk operations
  async bulkImportClients(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/clients/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    return response.json();
  }

  async bulkImportProducts(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    return response.json();
  }
}

export const clientsService = new ClientsService();
