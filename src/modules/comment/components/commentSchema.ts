// src/modules/comment/components/commentSchema.ts

import { z } from 'zod';
import { TEXT_LIMITS } from '@/shared/utils/constants';

export const commentSchema = z.object({
  content: z
    .string()
    .max(TEXT_LIMITS.COMMENT_CONTENT, `Comment must be less than ${TEXT_LIMITS.COMMENT_CONTENT} characters`)
    .optional()
    .or(z.literal('')),
  imageId: z
    .string()
    .max(64)
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => data.content?.trim() || data.imageId,
  { message: 'Comment must have text or an image' }
);

export type CommentFormData = z.infer<typeof commentSchema>;

export default commentSchema;