// src/modules/pin/components/PinCreateForm.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, Button, Divider, Text, Icon, TapArea, Spinner } from 'gestalt';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { FormField, FormTextArea } from '@/shared/components';
import { useImageUpload } from '@/modules/storage';
import { TagInput } from '@/modules/tag';
import { useCreatePin } from '../hooks/useCreatePin';
import { useSaveToProfile } from '../hooks/useSaveToProfile';
import { useSavePinToBoard, BoardPicker } from '@/modules/board';
import type { BoardResponse } from '@/modules/board';
import { useAuthStore } from '@/modules/auth';
import { pinCreateSchema, type PinCreateFormData } from './pinCreateSchema';
import { ensurePinLinkProtocol } from '../utils/pinUtils';

interface PinCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UploadedImage {
  imageId: string;
  thumbnailId?: string;
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export const PinCreateForm: React.FC<PinCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // Локальное состояние для выбора места сохранения (не меняет глобальный store)
  const [saveTarget, setSaveTarget] = useState<BoardResponse | null>(null);
  
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  // Upload hook
  const { upload, isUploading } = useImageUpload();

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Invalidate caches
  const invalidateCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
    
    if (userId) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key[0] !== 'pins' || key[1] !== 'list') return false;
          const filter = key[2] as Record<string, unknown> | undefined;
          return (
            filter?.authorId === userId ||
            filter?.savedAnywhere === userId ||
            filter?.savedToProfileBy === userId ||
            filter?.savedBy === userId
          );
        },
      });
    }

    if (saveTarget) {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(saveTarget.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
    }
  }, [queryClient, userId, saveTarget]);

  // Save to profile mutation
  const { saveToProfile } = useSaveToProfile({ 
    showToast: false,
    onSuccess: () => {
      invalidateCaches();
      onSuccess?.();
    },
  });

  // Save to board mutation
  const { savePinToBoard } = useSavePinToBoard({ 
    showToast: false,
    onSuccess: () => {
      invalidateCaches();
      onSuccess?.();
    },
  });

  // Create pin mutation
  const { createPin, isLoading: isCreating } = useCreatePin({
    onSuccess: (createdPin) => {
      if (saveTarget) {
        savePinToBoard({ boardId: saveTarget.id, pinId: createdPin.id });
      } else {
        saveToProfile(createdPin.id);
      }
    },
    navigateToPin: false,
    showToast: false,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<PinCreateFormData>({
    resolver: zodResolver(pinCreateSchema),
    defaultValues: {
      imageId: '',
      thumbnailId: undefined,
      title: '',
      description: '',
      href: '',
      tags: [],
    },
    mode: 'onChange',
  });

  const titleValue = useWatch({
    control,
    name: 'title',
  });

  // File handling
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    try {
      const result = await upload(file, { 
        category: 'pins',
        generateThumbnail: true,
        thumbnailWidth: 236,
      });

      setUploadedImage({
        imageId: result.imageId,
        thumbnailId: result.thumbnailId,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        thumbnailWidth: result.thumbnailWidth,
        thumbnailHeight: result.thumbnailHeight,
      });
      setValue('imageId', result.imageId, { shouldValidate: true });
      if (result.thumbnailId) {
        setValue('thumbnailId', result.thumbnailId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      URL.revokeObjectURL(newPreviewUrl);
      setPreviewUrl(null);
      setUploadedImage(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [upload, setValue, previewUrl]);

  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedImage(null);
    setValue('imageId', '', { shouldValidate: true });
    setValue('thumbnailId', undefined);
  }, [previewUrl, setValue]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Save target change - локальное изменение без влияния на глобальный store
  const handleSaveTargetChange = useCallback((board: BoardResponse | null) => {
    setSaveTarget(board);
  }, []);

  // Submit
  const onSubmit = (data: PinCreateFormData) => {
    if (!uploadedImage) return;

    createPin({
      imageId: uploadedImage.imageId,
      thumbnailId: uploadedImage.thumbnailId,
      originalWidth: uploadedImage.originalWidth,
      originalHeight: uploadedImage.originalHeight,
      thumbnailWidth: uploadedImage.thumbnailWidth,
      thumbnailHeight: uploadedImage.thumbnailHeight,
      title: data.title,
      description: data.description || undefined,
      href: data.href ? ensurePinLinkProtocol(data.href) : undefined,
      tags: data.tags?.length ? data.tags : undefined,
    });
  };

  const hasImage = !!uploadedImage;
  const canSubmit = hasImage && isValid && !!titleValue?.trim() && !isUploading;
  const isLoading = isCreating || isUploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Flex gap={8}>
        {/* Left Column - Image */}
        <Box flex="grow" maxWidth={480}>
          <Box marginBottom={2}>
            <Text weight="bold" size="200">
              Pin image
            </Text>
            <Text color="subtle" size="100">
              Recommended: 1000×1500 px
            </Text>
          </Box>

          {/* Image Container */}
          <Box
            position="relative"
            width="100%"
            rounding={4}
            overflow="hidden"
            dangerouslySetInlineStyle={{
              __style: {
                aspectRatio: '2 / 3',
                backgroundColor: '#efefef',
                minHeight: 400,
              },
            }}
          >
            {previewUrl ? (
              <Box
                width="100%"
                height="100%"
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  },
                }}
              >
                {isUploading && (
                  <Box
                    position="absolute"
                    top
                    left
                    right
                    bottom
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    dangerouslySetInlineStyle={{
                      __style: {
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      },
                    }}
                  >
                    <Flex direction="column" alignItems="center" gap={2}>
                      <Spinner accessibilityLabel="Uploading" show />
                      <Text size="200" weight="bold">Uploading...</Text>
                    </Flex>
                  </Box>
                )}
              </Box>
            ) : (
              <TapArea onTap={handleUploadClick} fullWidth fullHeight>
                <Box
                  width="100%"
                  height="100%"
                  display="flex"
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  padding={6}
                >
                  <Box 
                    marginBottom={3} 
                    rounding="circle" 
                    padding={4}
                    color="secondary"
                  >
                    <Icon
                      accessibilityLabel="Upload"
                      icon="arrow-up"
                      size={32}
                      color="default"
                    />
                  </Box>
                  <Text weight="bold" align="center" size="300">
                    Choose a file
                  </Text>
                  <Box marginTop={2}>
                    <Text color="subtle" align="center" size="200">
                      or drag and drop
                    </Text>
                  </Box>
                </Box>
              </TapArea>
            )}
          </Box>

          {/* Image actions */}
          {hasImage && !isUploading && (
            <Box marginTop={3}>
              <Flex gap={2}>
                <Button
                  text="Change"
                  onClick={handleUploadClick}
                  size="sm"
                  color="gray"
                />
                <Button
                  text="Remove"
                  onClick={handleRemoveImage}
                  size="sm"
                  color="transparent"
                />
              </Flex>
            </Box>
          )}

          {errors.imageId && (
            <Box marginTop={2}>
              <Text color="error" size="100">
                {errors.imageId.message}
              </Text>
            </Box>
          )}

          {uploadedImage && !isUploading && (
            <Box marginTop={2}>
              <Text color="subtle" size="100">
                {uploadedImage.originalWidth} × {uploadedImage.originalHeight} px
              </Text>
            </Box>
          )}
        </Box>

        {/* Right Column - Form */}
        <Box flex="grow" minWidth={320}>
          <Flex direction="column" gap={5}>
            {/* Save destination picker - использует локальное состояние */}
            <Box>
              <Box marginBottom={2}>
                <Text weight="bold" size="200">Save to</Text>
              </Box>
              <BoardPicker
                value={saveTarget}
                onChange={handleSaveTargetChange}
                size="lg"
                showLabel
              />
            </Box>

            <Divider />

            {/* Title */}
            <Box>
              <Box marginBottom={1}>
                <Flex alignItems="center" gap={1}>
                  <Text weight="bold" size="200">Title</Text>
                  <Text color="error" size="200">*</Text>
                </Flex>
              </Box>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <FormField
                    id="pin-title"
                    label=""
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Add a title"
                    errorMessage={errors.title?.message}
                    maxLength={200}
                  />
                )}
              />
            </Box>

            {/* Description */}
            <Box>
              <Box marginBottom={1}>
                <Text weight="bold" size="200">Description</Text>
              </Box>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <FormTextArea
                    id="pin-description"
                    label=""
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Tell everyone what your Pin is about"
                    errorMessage={errors.description?.message}
                    maxLength={400}
                    rows={4}
                  />
                )}
              />
            </Box>

            {/* Link */}
            <Box>
              <Box marginBottom={1}>
                <Text weight="bold" size="200">Destination link</Text>
              </Box>
              <Controller
                name="href"
                control={control}
                render={({ field }) => (
                  <FormField
                    id="pin-href"
                    label=""
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Add a link"
                    errorMessage={errors.href?.message}
                    type="url"
                  />
                )}
              />
            </Box>

            <Divider />

            {/* Tags */}
            <Box>
              <Box marginBottom={1}>
                <Text weight="bold" size="200">Tags</Text>
              </Box>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    id="pin-tags"
                    label=""
                    selectedTags={field.value || []}
                    onChange={field.onChange}
                    placeholder="Search or create tags"
                    maxTags={10}
                    errorMessage={errors.tags?.message}
                  />
                )}
              />
            </Box>
          </Flex>
        </Box>
      </Flex>

      {/* Footer */}
      <Box marginTop={8} padding={4}>
        <Divider />
        <Box paddingY={4}>
          <Flex justifyContent="between" alignItems="center">
            <Box>
              {!canSubmit && !isLoading && (
                <Flex gap={2} alignItems="center">
                  <Icon accessibilityLabel="" icon="workflow-status-warning" size={14} color="subtle" />
                  <Text size="200" color="subtle">
                    {!hasImage && 'Upload an image to continue'}
                    {hasImage && !titleValue?.trim() && 'Add a title to continue'}
                  </Text>
                </Flex>
              )}
            </Box>

            <Flex gap={2}>
              {onCancel && (
                <Button
                  text="Cancel"
                  onClick={onCancel}
                  size="lg"
                  color="gray"
                  disabled={isLoading}
                />
              )}
              <Button
                text={isCreating ? 'Creating...' : 'Create Pin'}
                type="submit"
                size="lg"
                color="red"
                disabled={isLoading || !canSubmit}
              />
            </Flex>
          </Flex>
        </Box>
      </Box>
    </form>
  );
};

export default PinCreateForm;