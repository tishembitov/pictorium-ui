// src/modules/pin/components/pinCreateSchema.ts

import { z } from 'zod';
import { TEXT_LIMITS } from '@/shared/utils/constants';

export const pinCreateSchema = z.object({
  imageId: z
    .string()
    .min(1, 'Image is required'),
  
  thumbnailId: z
    .string()
    .max(64)
    .optional(),
  
  videoPreviewId: z
    .string()
    .max(64)
    .optional(),
  
  title: z
    .string()
    .min(1, 'Title is required')
    .max(TEXT_LIMITS.PIN_TITLE, `Title must be less than ${TEXT_LIMITS.PIN_TITLE} characters`),
  
  description: z
    .string()
    .max(TEXT_LIMITS.PIN_DESCRIPTION, `Description must be less than ${TEXT_LIMITS.PIN_DESCRIPTION} characters`)
    .optional(),
  
  href: z
    .string()
    .max(TEXT_LIMITS.PIN_HREF, `Link must be less than ${TEXT_LIMITS.PIN_HREF} characters`)
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^https?:\/\/.+/.test(val) || /^[a-zA-Z0-9]/.test(val),
      { message: 'Please enter a valid URL' }
    ),
  
  tags: z
    .array(
      z.string().max(TEXT_LIMITS.TAG_NAME, `Tag must be less than ${TEXT_LIMITS.TAG_NAME} characters`)
    )
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

export type PinCreateFormData = z.infer<typeof pinCreateSchema>;

export default pinCreateSchema;