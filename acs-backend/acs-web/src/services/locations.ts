import { apiService } from './api';
import type { 
  City, 
  Pincode,
  CreateCityData,
  UpdateCityData,
  CreatePincodeData,
  UpdatePincodeData
} from '@/types/location';
import type { ApiResponse, PaginationQuery } from '@/types/api';

export interface LocationQuery extends PaginationQuery {
  search?: string;
  state?: string;
  country?: string;
}

export class LocationsService {
  // City operations
  async getCities(query: LocationQuery = {}): Promise<ApiResponse<City[]>> {
    return apiService.get('/cities', query);
  }

  async getCityById(id: string): Promise<ApiResponse<City>> {
    return apiService.get(`/cities/${id}`);
  }

  async createCity(data: CreateCityData): Promise<ApiResponse<City>> {
    return apiService.post('/cities', data);
  }

  async updateCity(id: string, data: UpdateCityData): Promise<ApiResponse<City>> {
    return apiService.put(`/cities/${id}`, data);
  }

  async deleteCity(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/cities/${id}`);
  }

  async getCitiesByState(state: string): Promise<ApiResponse<City[]>> {
    return this.getCities({ state });
  }

  // Pincode operations
  async getPincodes(query: LocationQuery = {}): Promise<ApiResponse<Pincode[]>> {
    return apiService.get('/pincodes', query);
  }

  async getPincodeById(id: string): Promise<ApiResponse<Pincode>> {
    return apiService.get(`/pincodes/${id}`);
  }

  async getPincodesByCity(cityId: string): Promise<ApiResponse<Pincode[]>> {
    return apiService.get(`/cities/${cityId}/pincodes`);
  }

  async createPincode(data: CreatePincodeData): Promise<ApiResponse<Pincode>> {
    return apiService.post('/pincodes', data);
  }

  async updatePincode(id: string, data: UpdatePincodeData): Promise<ApiResponse<Pincode>> {
    return apiService.put(`/pincodes/${id}`, data);
  }

  async deletePincode(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/pincodes/${id}`);
  }

  async searchPincodes(query: string): Promise<ApiResponse<Pincode[]>> {
    return apiService.get('/pincodes/search', { q: query });
  }

  // Bulk operations
  async bulkImportCities(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cities/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    return response.json();
  }

  async bulkImportPincodes(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pincodes/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    return response.json();
  }

  // Utility functions
  async getStates(): Promise<ApiResponse<string[]>> {
    return apiService.get('/locations/states');
  }

  async getCountries(): Promise<ApiResponse<string[]>> {
    return apiService.get('/locations/countries');
  }
}

export const locationsService = new LocationsService();
