// src/modules/user/utils/userUtils.ts

import type { UserResponse, SocialLinks } from '../types/user.types';

/**
 * Get user's display name
 */
export const getDisplayName = (user: UserResponse): string => {
  return user.username;
};

/**
 * Get user's initials for avatar fallback
 */
export const getUserInitials = (username: string): string => {
  if (!username) return '?';
  return username.charAt(0).toUpperCase();
};

/**
 * Format username with @ prefix
 */
export const formatUsername = (username: string): string => {
  return `@${username.replace(/^@/, '')}`;
};

/**
 * Get social links from user
 */
export const getSocialLinks = (user: UserResponse): SocialLinks => {
  return {
    instagram: user.instagram,
    tiktok: user.tiktok,
    telegram: user.telegram,
    pinterest: user.pinterest,
  };
};

/**
 * Check if user has any social links
 */
export const hasSocialLinks = (user: UserResponse): boolean => {
  return !!(user.instagram || user.tiktok || user.telegram || user.pinterest);
};

/**
 * Build social link URL
 */
export const buildSocialUrl = (
  platform: keyof SocialLinks,
  handle: string | null
): string | null => {
  if (!handle) return null;

  const baseUrls: Record<keyof SocialLinks, string> = {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/@',
    telegram: 'https://t.me/',
    pinterest: 'https://pinterest.com/',
  };

  return `${baseUrls[platform]}${handle.replace(/^@/, '')}`;
};

/**
 * Get all social link URLs
 */
export const getSocialUrls = (user: UserResponse): Record<keyof SocialLinks, string | null> => {
  return {
    instagram: buildSocialUrl('instagram', user.instagram),
    tiktok: buildSocialUrl('tiktok', user.tiktok),
    telegram: buildSocialUrl('telegram', user.telegram),
    pinterest: buildSocialUrl('pinterest', user.pinterest),
  };
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (user: UserResponse): boolean => {
  return !!(
    user.username &&
    user.imageId &&
    user.description
  );
};

/**
 * Get profile completion percentage
 */
export const getProfileCompletionPercentage = (user: UserResponse): number => {
  const fields = [
    user.username,
    user.imageId,
    user.bannerImageId,
    user.description,
    user.instagram || user.tiktok || user.telegram || user.pinterest,
  ];

  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
};