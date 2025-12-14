// src/modules/pin/components/pinEditSchema.ts

import { z } from 'zod';
import { TEXT_LIMITS } from '@/shared/utils/constants';

export const pinEditSchema = z.object({
  imageId: z
    .string()
    .max(64)
    .optional()
    .or(z.literal('')),
  
  thumbnailId: z
    .string()
    .max(64)
    .optional()
    .or(z.literal('')),
  
  videoPreviewId: z
    .string()
    .max(64)
    .optional()
    .or(z.literal('')),
  
  title: z
    .string()
    .max(TEXT_LIMITS.PIN_TITLE, `Title must be less than ${TEXT_LIMITS.PIN_TITLE} characters`)
    .optional()
    .or(z.literal('')),
  
  description: z
    .string()
    .max(TEXT_LIMITS.PIN_DESCRIPTION, `Description must be less than ${TEXT_LIMITS.PIN_DESCRIPTION} characters`)
    .optional()
    .or(z.literal('')),
  
  href: z
    .string()
    .max(TEXT_LIMITS.PIN_HREF, `Link must be less than ${TEXT_LIMITS.PIN_HREF} characters`)
    .optional()
    .or(z.literal(''))
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

export type PinEditFormData = z.infer<typeof pinEditSchema>;

export default pinEditSchema;