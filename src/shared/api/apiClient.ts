import axios, { 
    type AxiosInstance, 
    AxiosError, 
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
    type AxiosResponse 
  } from 'axios';
  import { keycloak, TOKEN_MIN_VALIDITY } from '@/app/config/keycloak';
  import { API_BASE_URL } from './apiEndpoints';
  import type { ApiErrorResponse } from './apiTypes';
  
  // Create axios instance
  const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  
  // Request interceptor - add auth token
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Check if keycloak is initialized and authenticated
      if (keycloak.authenticated) {
        try {
          // Refresh token if needed
          const refreshed = await keycloak.updateToken(TOKEN_MIN_VALIDITY);
          if (refreshed) {
            console.debug('Token refreshed before request');
          }
          
          // Add token to headers
          if (keycloak.token) {
            config.headers.Authorization = `Bearer ${keycloak.token}`;
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Token refresh failed - user needs to re-authenticate
          keycloak.login();
          return Promise.reject(error);
        }
      }
      
      return config;
    },
    (error: AxiosError) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
 
  // Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshed = await keycloak.updateToken(-1);
        
        if (refreshed && keycloak.token) {
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        keycloak.login();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }
    
    // Handle 404 Not Found - use debug, not error (404 is often expected)
    if (error.response?.status === 404) {
      console.debug('Resource not found:', error.config?.url);
    }
    
    // Handle 500+ Server errors
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
  
  // Helper type for API responses
  export type ApiResult<T> = Promise<T>;
  
  // GET request
  export const get = async <T>(
    url: string, 
    config?: AxiosRequestConfig
  ): ApiResult<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  };
  
  // POST request
  export const post = async <T, D = unknown>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig
  ): ApiResult<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  };
  
  // PUT request
  export const put = async <T, D = unknown>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig
  ): ApiResult<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  };
  
  // PATCH request
  export const patch = async <T, D = unknown>(
    url: string, 
    data?: D, 
    config?: AxiosRequestConfig
  ): ApiResult<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  };
  
  // DELETE request
  export const del = async <T = void>(
    url: string, 
    config?: AxiosRequestConfig
  ): ApiResult<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  };
  
  // Upload file to presigned URL (no auth needed)
  export const uploadToPresignedUrl = async (
    url: string,
    file: File,
    headers?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    await axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
        ...headers,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });
  };
  
  // Check if error is API error
  export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
    return axios.isAxiosError(error);
  };
  
  // Extract error message from API error
  export const getErrorMessage = (error: unknown): string => {
    if (isApiError(error)) {
      // Try to get message from response
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      // Try to get error field
      if (error.response?.data?.error) {
        return error.response.data.error;
      }
      // Use status text
      if (error.response?.statusText) {
        return error.response.statusText;
      }
      // Use error message
      if (error.message) {
        return error.message;
      }
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  };
  
  // Extract validation errors from API error
  export const getValidationErrors = (error: unknown): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (isApiError(error) && error.response?.data?.errors) {
      for (const validationError of error.response.data.errors) {
        errors[validationError.field] = validationError.message;
      }
    }
    
    return errors;
  };
  
  // Export the axios instance for direct use if needed
  export { apiClient };
  
  export default apiClient;