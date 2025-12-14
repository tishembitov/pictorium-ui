// src/modules/comment/components/ReplyForm.tsx

import React from 'react';
import { Box } from 'gestalt';
import { CommentForm } from './CommentForm';
import { useCreateReply } from '../hooks/useCreateReply';
import type { CommentFormData } from './commentSchema';

interface ReplyFormProps {
  commentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  commentId,
  onSuccess,
  onCancel,
  autoFocus = true,
}) => {
  const { createReply, isLoading } = useCreateReply(commentId, {
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const handleSubmit = (data: CommentFormData) => {
    createReply({
      content: data.content,
      imageId: data.imageId,
    });
  };

  return (
    <Box marginStart={8} marginTop={2}>
      <CommentForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Write a reply..."
        autoFocus={autoFocus}
        showAvatar={false}
        compact
        onCancel={onCancel}
      />
    </Box>
  );
};

export default ReplyForm;