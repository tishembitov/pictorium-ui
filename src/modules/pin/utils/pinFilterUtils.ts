// src/modules/pin/utils/pinFilterUtils.ts

import type { PinFilter, PinSortField, PinSortDirection } from '../types/pinFilter.types';

/**
 * Clean filter object for API (remove undefined values)
 * Use outside of component render to avoid creating new objects
 */
export const cleanFilterForApi = (filter: PinFilter): PinFilter => {
  const cleanFilter: PinFilter = {};
  
  if (filter.q) cleanFilter.q = filter.q;
  if (filter.tags?.length) cleanFilter.tags = filter.tags;
  if (filter.authorId) cleanFilter.authorId = filter.authorId;
  if (filter.savedBy) cleanFilter.savedBy = filter.savedBy;
  if (filter.savedToProfileBy) cleanFilter.savedToProfileBy = filter.savedToProfileBy;
  if (filter.likedBy) cleanFilter.likedBy = filter.likedBy;
  if (filter.relatedTo) cleanFilter.relatedTo = filter.relatedTo;
  if (filter.createdFrom) cleanFilter.createdFrom = filter.createdFrom;
  if (filter.createdTo) cleanFilter.createdTo = filter.createdTo;
  if (filter.scope) cleanFilter.scope = filter.scope;
  
  return cleanFilter;
};

/**
 * Build sort array for API
 */
export const buildSortForApi = (
  field: PinSortField, 
  direction: PinSortDirection
): string[] => {
  return [`${field},${direction}`];
};

/**
 * Check if filter has any active values
 */
export const hasActiveFilters = (filter: PinFilter): boolean => {
  return !!(
    filter.q ||
    filter.tags?.length ||
    filter.authorId ||
    filter.savedBy ||
    filter.savedToProfileBy ||
    filter.likedBy ||
    filter.relatedTo ||
    filter.createdFrom ||
    filter.createdTo ||
    (filter.scope && filter.scope !== 'ALL')
  );
};

/**
 * Count active filters
 */
export const countActiveFilters = (filter: PinFilter): number => {
  let count = 0;
  if (filter.q) count++;
  if (filter.tags?.length) count++;
  if (filter.authorId) count++;
  if (filter.savedBy) count++;
  if (filter.savedToProfileBy) count++;
  if (filter.likedBy) count++;
  if (filter.relatedTo) count++;
  if (filter.createdFrom || filter.createdTo) count++;
  if (filter.scope && filter.scope !== 'ALL') count++;
  return count;
};

/**
 * Get current scope from filter
 */
export const getCurrentScope = (filter: PinFilter) => {
  return filter.scope || 'ALL';
};

/**
 * String comparison function for sorting
 */
const compareStrings = (a: string, b: string): number => {
  return a.localeCompare(b);
};

/**
 * Format filter entry value for key creation
 */
const formatEntryValue = (key: string, value: unknown): string => {
  if (Array.isArray(value)) {
    // Sort array elements for consistent key
    const sortedArray = [...value].sort(compareStrings);
    return `${key}:${sortedArray.join(',')}`;
  }
  return `${key}:${String(value)}`;
};

/**
 * Create stable filter key for React Query
 * Sorts keys and handles arrays consistently
 */
export const createFilterKey = (filter: PinFilter): string => {
  const entries = Object.entries(filter)
    .filter(([, v]) => v !== undefined && v !== null && v !== '');
  
  // Sort entries by key for consistent ordering
  entries.sort((a, b) => compareStrings(a[0], b[0]));
  
  const keyParts = entries.map(([k, v]) => formatEntryValue(k, v));
  
  return keyParts.join('|');
};