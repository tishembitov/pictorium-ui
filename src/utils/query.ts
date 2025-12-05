// src/utils/query.ts
/**
 * Query parameters serialization utilities
 */

import type { Pageable, PinFilter } from '@/types'

/**
 * Serialize Pageable to query string format
 * Spring Boot expects: page=0&size=10&sort=field,asc
 */
export function serializePageable(pageable: Pageable): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {
    page: String(pageable.page),
    size: String(pageable.size),
  }

  if (pageable.sort && pageable.sort.length > 0) {
    params.sort = pageable.sort
  }

  return params
}

/**
 * Serialize PinFilter to query string format
 * For complex objects, we serialize as JSON string (Spring Boot requirement)
 */
export function serializeFilter(filter: PinFilter): string {
  return JSON.stringify(filter)
}

/**
 * Serialize both filter and pageable for pins endpoint
 */
export function serializePinsParams(filter: PinFilter, pageable: Pageable): Record<string, string | string[]> {
  return {
    filter: serializeFilter(filter),
    ...serializePageable(pageable),
  }
}

/**
 * Serialize pageable as JSON string (for endpoints that require it)
 */
export function serializePageableAsJson(pageable: Pageable): string {
  return JSON.stringify(pageable)
}

