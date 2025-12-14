// src/modules/board/components/boardCreateSchema.ts

import { z } from 'zod';
import { TEXT_LIMITS } from '@/shared/utils/constants';

export const boardCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Board title is required')
    .max(TEXT_LIMITS.BOARD_TITLE, `Title must be less than ${TEXT_LIMITS.BOARD_TITLE} characters`),
});

export type BoardCreateFormData = z.infer<typeof boardCreateSchema>;

export default boardCreateSchema;