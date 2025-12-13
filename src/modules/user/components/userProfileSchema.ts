// src/modules/user/components/userProfileSchema.ts

import { z } from 'zod';
import { TEXT_LIMITS } from '@/shared/utils/constants';

export const userProfileSchema = z.object({
  username: z
    .string()
    .min(TEXT_LIMITS.USERNAME_MIN, `Username must be at least ${TEXT_LIMITS.USERNAME_MIN} characters`)
    .max(TEXT_LIMITS.USERNAME_MAX, `Username must be less than ${TEXT_LIMITS.USERNAME_MAX} characters`)
    .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores'),
  
  description: z
    .string()
    .max(TEXT_LIMITS.USER_DESCRIPTION, `Description must be less than ${TEXT_LIMITS.USER_DESCRIPTION} characters`)
    .optional()
    .or(z.literal('')),
  
  imageId: z
    .string()
    .max(64)
    .optional()
    .or(z.literal('')),
  
  bannerImageId: z
    .string()
    .max(64)
    .optional()
    .or(z.literal('')),
  
  instagram: z
    .string()
    .max(TEXT_LIMITS.SOCIAL_LINK, `Instagram handle must be less than ${TEXT_LIMITS.SOCIAL_LINK} characters`)
    .optional()
    .or(z.literal('')),
  
  tiktok: z
    .string()
    .max(TEXT_LIMITS.SOCIAL_LINK, `TikTok handle must be less than ${TEXT_LIMITS.SOCIAL_LINK} characters`)
    .optional()
    .or(z.literal('')),
  
  telegram: z
    .string()
    .max(TEXT_LIMITS.SOCIAL_LINK, `Telegram handle must be less than ${TEXT_LIMITS.SOCIAL_LINK} characters`)
    .optional()
    .or(z.literal('')),
  
  pinterest: z
    .string()
    .max(TEXT_LIMITS.SOCIAL_LINK, `Pinterest handle must be less than ${TEXT_LIMITS.SOCIAL_LINK} characters`)
    .optional()
    .or(z.literal('')),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

export default userProfileSchema;