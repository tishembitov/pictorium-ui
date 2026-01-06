// src/modules/comment/components/CommentForm.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, Button, TextArea, Text } from 'gestalt';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmojiPicker, AttachmentButton, AttachmentPreview } from '@/shared/components';
import { ImagePreview, useImageUpload } from '@/modules/storage';
import { UserAvatar, useUser } from '@/modules/user';
import { useAuth } from '@/modules/auth';
import { commentSchema, type CommentFormData } from './commentSchema';
import { TEXT_LIMITS } from '@/shared/utils/constants';
import { AttachmentFile } from '@/shared/components/input/AttachmentPreview';

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
  const { user: authUser, isAuthenticated, login } = useAuth();
  const { user: userProfile } = useUser(authUser?.id);
  const { upload, isUploading } = useImageUpload();

  const [imageId, setImageId] = useState<string | null>(initialImageId || null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
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

  const content = useWatch({ control, name: 'content' });

  useEffect(() => {
    if (autoFocus && textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [autoFocus]);

  const hasContent = !!content?.trim() || !!imageId || attachments.length > 0;

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    const currentContent = content || '';
    const textarea = textAreaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = currentContent.slice(0, start) + emoji + currentContent.slice(end);
      setValue('content', newContent, { shouldValidate: true });
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setValue('content', currentContent + emoji, { shouldValidate: true });
    }
  }, [content, setValue]);

  // Handle file attachment
  const handleFileSelect = useCallback(async (files: File[]) => {
    const newAttachments: AttachmentFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      isUploading: true,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);

    for (const attachment of newAttachments) {
      try {
        const result = await upload(attachment.file, { category: 'comments' });
        
        setAttachments(prev => prev.map(a => 
          a.id === attachment.id 
            ? { ...a, isUploading: false, isUploaded: true, uploadedId: result.imageId }
            : a
        ));

        if (!imageId) {
          setImageId(result.imageId);
          setValue('imageId', result.imageId);
        }
      } catch {
        setAttachments(prev => prev.map(a => 
          a.id === attachment.id 
            ? { ...a, isUploading: false, error: 'Upload failed' }
            : a
        ));
      }
    }
  }, [upload, imageId, setValue]);

  // Remove attachment
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      const filtered = prev.filter(a => a.id !== id);
      
      if (removed?.uploadedId === imageId) {
        setImageId(null);
        setValue('imageId', '');
      }
      
      return filtered;
    });
  }, [imageId, setValue]);

  // Remove main image
  const handleRemoveImage = useCallback(() => {
    setImageId(null);
    setValue('imageId', '');
    setAttachments([]);
  }, [setValue]);

  const handleFormSubmit = useCallback(
    (data: CommentFormData) => {
      onSubmit({
        content: data.content?.trim() || '',
        imageId: imageId || undefined,
      });
      reset();
      setImageId(null);
      setAttachments([]);
    },
    [onSubmit, reset, imageId]
  );

  const handleCancel = useCallback(() => {
    reset();
    setImageId(null);
    setAttachments([]);
    onCancel?.();
  }, [reset, onCancel]);

  // ✅ Исправление 1: обёртка для login
  const handleLogin = useCallback(() => {
    login();
  }, [login]);

  if (!isAuthenticated) {
    return (
      <Box 
        padding={4} 
        rounding={3}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            border: '1px dashed rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Flex direction="column" alignItems="center" gap={2}>
          <Text color="subtle" align="center">
            Sign in to join the conversation
          </Text>
          {/* ✅ Исправление 1: используем handleLogin */}
          <Button text="Log in" onClick={handleLogin} size="sm" color="red" />
        </Flex>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Box
        rounding={3}
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <Box padding={3}>
          <Flex gap={3} alignItems="start">
            {showAvatar && (
              // ✅ Исправление 2: flexShrink через dangerouslySetInlineStyle
              <Box
                dangerouslySetInlineStyle={{
                  __style: { flexShrink: 0 },
                }}
              >
                <UserAvatar
                  imageId={userProfile?.imageId}
                  name={authUser?.username || 'User'}
                  size="sm"
                />
              </Box>
            )}

            <Box flex="grow" width="100%">
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <TextArea
                    id="comment-input"
                    ref={textAreaRef}
                    value={field.value || ''}
                    onChange={({ value }) => field.onChange(value)}
                    placeholder={placeholder}
                    rows={compact ? 1 : 2}
                    maxLength={{
                      characterCount: TEXT_LIMITS.COMMENT_CONTENT,
                      errorAccessibilityLabel: 'Character limit exceeded',
                    }}
                    disabled={isLoading}
                    errorMessage={errors.content?.message}
                    label=""
                    labelDisplay="hidden"
                  />
                )}
              />

              {/* Image Preview */}
              {imageId && !attachments.length && (
                <Box marginTop={3}>
                  <ImagePreview
                    imageId={imageId}
                    alt="Comment image"
                    height={120}
                    rounding={2}
                    showRemoveButton
                    onRemove={handleRemoveImage}
                  />
                </Box>
              )}

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <AttachmentPreview
                  files={attachments}
                  onRemove={handleRemoveAttachment}
                  compact
                />
              )}

              {/* Actions Row */}
              <Box marginTop={3}>
                <Flex justifyContent="between" alignItems="center">
                  <Flex gap={1} alignItems="center">
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      disabled={isLoading}
                      size="sm"
                    />
                    <AttachmentButton
                      onFileSelect={handleFileSelect}
                      accept="image/*"
                      disabled={isLoading || isUploading || !!imageId}
                      size="sm"
                    />
                  </Flex>

                  <Flex gap={2} alignItems="center">
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
                      disabled={isLoading || !hasContent || isUploading}
                    />
                  </Flex>
                </Flex>
              </Box>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Character count */}
      {content && content.length > TEXT_LIMITS.COMMENT_CONTENT * 0.8 && (
        <Box marginTop={1} display="flex" justifyContent="end">
          <Text 
            size="100" 
            color={content.length >= TEXT_LIMITS.COMMENT_CONTENT ? 'error' : 'subtle'}
          >
            {content.length}/{TEXT_LIMITS.COMMENT_CONTENT}
          </Text>
        </Box>
      )}
    </form>
  );
};

export default CommentForm;