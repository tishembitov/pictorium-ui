// src/modules/pin/utils/pinUtils.ts

import type { PinResponse, PinPreview } from '../types/pin.types';

/**
 * Get pin image ID (prefer thumbnail for grid display)
 */
export const getPinImageId = (pin: PinResponse | PinPreview): string => {
  return pin.thumbnailId || pin.imageId;
};

/**
 * Check if pin has video preview
 */
export const hasVideoPreview = (pin: PinResponse | PinPreview): boolean => {
  return !!pin.videoPreviewId;
};

/**
 * Get pin display title
 */
export const getPinTitle = (pin: PinResponse): string => {
  return pin.title || 'Untitled';
};

/**
 * Get pin description preview (truncated)
 */
export const getPinDescriptionPreview = (
  pin: PinResponse,
  maxLength: number = 100
): string => {
  if (!pin.description) return '';
  if (pin.description.length <= maxLength) return pin.description;
  return `${pin.description.slice(0, maxLength).trim()}...`;
};

/**
 * Check if pin has external link
 */
export const hasPinLink = (pin: PinResponse): boolean => {
  return !!pin.href;
};

/**
 * Format pin link for display
 */
export const formatPinLink = (href: string): string => {
  try {
    const url = new URL(href.startsWith('http') ? href : `https://${href}`);
    return url.hostname.replace('www.', '');
  } catch {
    return href;
  }
};

/**
 * Ensure pin link has protocol
 */
export const ensurePinLinkProtocol = (href: string): string => {
  if (!href) return '';
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  return `https://${href}`;
};

/**
 * Build share URL for pin
 */
export const buildPinShareUrl = (pinId: string): string => {
  return `${globalThis.location.origin}/pin/${pinId}`;
};

/**
 * Calculate pin engagement score
 */
export const calculateEngagementScore = (pin: PinResponse): number => {
  const likeWeight = 1;
  const saveWeight = 2;
  const commentWeight = 1.5;
  const viewWeight = 0.1;

  return (
    pin.likeCount * likeWeight +
    pin.saveCount * saveWeight +
    pin.commentCount * commentWeight +
    pin.viewCount * viewWeight
  );
};

/**
 * Sort pins by engagement
 */
export const sortPinsByEngagement = (pins: PinResponse[]): PinResponse[] => {
  return [...pins].sort(
    (a, b) => calculateEngagementScore(b) - calculateEngagementScore(a)
  );
};

/**
 * Group pins by date
 */
export const groupPinsByDate = (
  pins: PinResponse[]
): Map<string, PinResponse[]> => {
  const groups = new Map<string, PinResponse[]>();

  for (const pin of pins) {
    const date = new Date(pin.createdAt).toLocaleDateString();
    const group = groups.get(date) || [];
    group.push(pin);
    groups.set(date, group);
  }

  return groups;
};

/**
 * Filter pins by tags (client-side)
 */
export const filterPinsByTags = (
  pins: PinResponse[],
  tags: string[]
): PinResponse[] => {
  if (!tags.length) return pins;
  
  // Use Set for O(1) lookup
  const lowerTagsSet = new Set(tags.map((t) => t.toLowerCase()));
  return pins.filter((pin) =>
    pin.tags.some((tag) => lowerTagsSet.has(tag.toLowerCase()))
  );
};

/**
 * Check if current user is the owner of the pin
 */
export const isPinOwner = (
  pin: PinResponse | undefined | null, 
  userId: string | undefined | null
): boolean => {
  if (!pin || !userId) return false;
  return pin.userId === userId;
};

/**
 * Check if own pin should be deleted after removing from profile
 * 
 * DELETE if: owner AND not saved to any boards
 */
export const shouldDeleteAfterProfileRemoval = (
  pin: PinResponse | undefined | null,
  userId: string | undefined | null
): boolean => {
  if (!isPinOwner(pin, userId)) return false;
  return pin!.savedToBoardCount === 0;
};

/**
 * Check if own pin should be deleted after removing from one board
 * 
 * DELETE if: owner AND not in profile AND this is the only board
 */
export const shouldDeleteAfterBoardRemoval = (
  pin: PinResponse | undefined | null,
  userId: string | undefined | null
): boolean => {
  if (!isPinOwner(pin, userId)) return false;
  return !pin!.isSavedToProfile && pin!.savedToBoardCount <= 1;
};

/**
 * Check if own pin should be deleted after removing from all boards
 * 
 * DELETE if: owner AND not in profile
 */
export const shouldDeleteAfterAllBoardsRemoval = (
  pin: PinResponse | undefined | null,
  userId: string | undefined | null
): boolean => {
  if (!isPinOwner(pin, userId)) return false;
  return !pin!.isSavedToProfile;
};

/**
 * Search pins by query (client-side)
 */
export const searchPins = (pins: PinResponse[], query: string): PinResponse[] => {
  if (!query.trim()) return pins;
  
  const lowerQuery = query.toLowerCase();
  return pins.filter(
    (pin) =>
      pin.title?.toLowerCase().includes(lowerQuery) ||
      pin.description?.toLowerCase().includes(lowerQuery) ||
      pin.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};