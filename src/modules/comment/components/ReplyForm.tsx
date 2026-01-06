// src/modules/comment/components/ReplyForm.tsx

import React from 'react';
import { Box, Text, Flex } from 'gestalt';
import { CommentForm } from './CommentForm';
import { useCreateReply } from '../hooks/useCreateReply';
import type { CommentFormData } from './commentSchema';

interface ReplyFormProps {
  commentId: string;
  pinId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  commentId,
  pinId,
  onSuccess,
  onCancel,
  autoFocus = true,
}) => {
  const { createReply, isLoading } = useCreateReply(commentId, {
    pinId,
    onSuccess: () => onSuccess?.(),
  });

  const handleSubmit = (data: CommentFormData) => {
    createReply({
      content: data.content,
      imageId: data.imageId,
    });
  };

  return (
    <Box
      marginStart={6}
      dangerouslySetInlineStyle={{
        __style: {
          borderLeft: '2px solid rgba(0, 0, 0, 0.08)',
          paddingLeft: 12,
        },
      }}
    >
      {/* ✅ Исправление: marginBottom перенесён в Box */}
      <Box marginBottom={2}>
        <Flex alignItems="center" gap={2}>
          <Text size="100">↩︎</Text>
          <Text size="100" color="subtle">
            Replying to comment
          </Text>
        </Flex>
      </Box>
      
      <CommentForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Write your reply..."
        autoFocus={autoFocus}
        showAvatar={false}
        compact
        onCancel={onCancel}
      />
    </Box>
  );
};

export default ReplyForm;