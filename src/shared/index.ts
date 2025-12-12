// src/shared/index.ts
// Types
export * from './types/common.types';
export * from './types/pageable.types';

// API
export { apiClient, get, post, put, patch, del } from './api/apiClient';
export { uploadToPresignedUrl, isApiError, getErrorMessage, getValidationErrors } from './api/apiClient';
export { 
  API_BASE_URL, 
  API_ENDPOINTS, 
  API_PREFIXES,
  USER_ENDPOINTS,  
  PIN_ENDPOINTS,   
  BOARD_ENDPOINTS, 
  COMMENT_ENDPOINTS, 
  TAG_ENDPOINTS,   
  IMAGE_ENDPOINTS,  
} from './api/apiEndpoints';
export * from './api/apiTypes';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils/constants';
export * from './utils/formatters';
export * from './utils/validators';
export * from './utils/helpers';