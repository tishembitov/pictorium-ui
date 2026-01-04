// src/modules/pin/api/pinApi.ts

import { get, post, patch, del } from '@/shared/api/apiClient';
import { PIN_ENDPOINTS } from '@/shared/api/apiEndpoints';
import type { Pageable } from '@/shared/types/pageable.types';
import type {
  PinResponse,
  PinCreateRequest,
  PinUpdateRequest,
  PagePinResponse,
  PinFilter,
  PinSort,
} from '../types/pin.types';

/**
 * Убирает пустые значения из объекта
 */
const cleanParams = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => 
      v !== undefined && 
      v !== null && 
      v !== '' && 
      !(Array.isArray(v) && v.length === 0)
    )
  );
};

/**
 * Строит параметры запроса
 */
const buildParams = (
  filter: PinFilter, 
  pageable: Pageable,
  sort?: PinSort
): Record<string, unknown> => {
  const params: Record<string, unknown> = {
    ...cleanParams(filter as Record<string, unknown>),
    page: pageable.page ?? 0,
    size: pageable.size ?? 25,
  };
  
  if (sort) {
    params.sort = `${sort.field},${sort.direction}`;
  } else if (pageable.sort?.length) {
    params.sort = pageable.sort;
  }
  
  return params;
};

export const pinApi = {
  // ==================== Query ====================
  
  getAll: (
    filter: PinFilter = {}, 
    pageable: Pageable = {},
    sort?: PinSort
  ) => {
    return get<PagePinResponse>(PIN_ENDPOINTS.list(), {
      params: buildParams(filter, pageable, sort),
    });
  },

  getById: (pinId: string) => {
    return get<PinResponse>(PIN_ENDPOINTS.byId(pinId));
  },

  // ==================== Mutations ====================
  
  create: (data: PinCreateRequest) => {
    return post<PinResponse, PinCreateRequest>(PIN_ENDPOINTS.create(), data);
  },

  update: (pinId: string, data: PinUpdateRequest) => {
    return patch<PinResponse, PinUpdateRequest>(PIN_ENDPOINTS.update(pinId), data);
  },

  delete: (pinId: string) => {
    return del<void>(PIN_ENDPOINTS.delete(pinId));
  },

};

export default pinApi;