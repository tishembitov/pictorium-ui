// src/modules/comment/components/CommentForm.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, Button, TextArea, IconButton } from 'gestalt';
import { useForm, Controller, useWatch } from 'react-hook-form'; // ✅ Добавлен useWatch
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageUploader, ImagePreview } from '@/modules/storage';
import { UserAvatar, useUser } from '@/modules/user';
import { useAuth } from '@/modules/auth';
import { commentSchema, type CommentFormData } from './commentSchema';
import { TEXT_LIMITS } from '@/shared/utils/constants';

interface CommentFormProps {
  onSubmit: (data: CommentFormData) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  showAvatar?: boolean;
  compact?: boolean;
  onCancel?: () => void;
  initialContent?: string;
  initialImageId?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = 'Add a comment...',
  autoFocus = false,
  showAvatar = true,
  compact = false,
  onCancel,
  initialContent = '',
  initialImageId = '',
}) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const { user: userProfile } = useUser(authUser?.id);
  
  const [showImageUploader, setShowImageUploader] = useState(!!initialImageId);
  const [imageId, setImageId] = useState<string | null>(initialImageId || null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: initialContent,
      imageId: initialImageId,
    },
    mode: 'onChange',
  });

  // ✅ ИСПРАВЛЕНИЕ: Используем useWatch вместо дублирующего state
  const content = useWatch({ control, name: 'content' });

  // Handle autoFocus
  useEffect(() => {
    if (autoFocus && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [autoFocus]);

  const hasContent = !!content?.trim() || !!imageId;

  const handleFormSubmit = useCallback(
    (data: CommentFormData) => {
      onSubmit({
        content: data.content?.trim() || '',
        imageId: imageId || undefined,
      });
      reset();
      setImageId(null);
      setShowImageUploader(false);
    },
    [onSubmit, reset, imageId]
  );

  const handleCancel = useCallback(() => {
    reset();
    setImageId(null);
    setShowImageUploader(false);
    onCancel?.();
  }, [reset, onCancel]);

  const handleImageUpload = useCallback((result: { imageId: string }) => {
    setImageId(result.imageId);
    setValue('imageId', result.imageId);
  }, [setValue]);

  const handleRemoveImage = useCallback(() => {
    setImageId(null);
    setValue('imageId', '');
    setShowImageUploader(false);
  }, [setValue]);

  if (!isAuthenticated) {
    return (
      <Box padding={3} color="secondary" rounding={2}>
        <Box>Sign in to comment</Box>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Flex gap={3} alignItems="start">
        {showAvatar && (
          <UserAvatar
            imageId={userProfile?.imageId}
            name={authUser?.username || 'User'}
            size="sm"
          />
        )}

        <Box flex="grow">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <TextArea
                id="comment-input"
                ref={textAreaRef}
                value={field.value || ''}
                onChange={({ value }) => {
                  field.onChange(value);
                  // ✅ ИСПРАВЛЕНИЕ: Убрали setContent(value) - больше не нужно
                }}
                placeholder={placeholder}
                rows={compact ? 1 : 2}
                maxLength={{
                  characterCount: TEXT_LIMITS.COMMENT_CONTENT,
                  errorAccessibilityLabel: 'Character limit exceeded',
                }}
                disabled={isLoading}
                errorMessage={errors.content?.message}
              />
            )}
          />

          {/* Image Preview */}
          {imageId && (
            <Box marginTop={2}>
              <ImagePreview
                imageId={imageId}
                alt="Comment image"
                height={150}
                rounding={2}
                showRemoveButton
                onRemove={handleRemoveImage}
              />
            </Box>
          )}

          {/* Image Uploader */}
          {showImageUploader && !imageId && (
            <Box marginTop={2}>
              <ImageUploader
                onUploadComplete={handleImageUpload}
                category="comments"
                compact
                autoUpload
              />
            </Box>
          )}

          {/* Actions */}
          <Box marginTop={2}>
            <Flex justifyContent="between" alignItems="center">
              <Box>
                {!showImageUploader && !imageId && (
                  <IconButton
                    accessibilityLabel="Add image"
                    icon="camera"
                    size="sm"
                    onClick={() => setShowImageUploader(true)}
                    disabled={isLoading}
                    bgColor="transparent"
                  />
                )}
              </Box>

              <Flex gap={2}>
                {onCancel && (
                  <Button
                    text="Cancel"
                    onClick={handleCancel}
                    size="sm"
                    color="gray"
                    disabled={isLoading}
                  />
                )}
                <Button
                  text={isLoading ? 'Posting...' : 'Post'}
                  type="submit"
                  size="sm"
                  color="red"
                  disabled={isLoading || !hasContent}
                />
              </Flex>
            </Flex>
          </Box>

          {/* Error message */}
          {errors.root?.message && (
            <Box marginTop={2}>
              <Box color="errorBase" padding={2} rounding={2}>
                {errors.root.message}
              </Box>
            </Box>
          )}
        </Box>
      </Flex>
    </form>
  );
};

export default CommentForm;