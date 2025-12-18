// ================================================
// FILE: src/modules/pin/components/PinCreateForm.tsx
// ================================================

import React, { useState, useCallback } from 'react';
import { Box, Flex, Button, Divider, Text } from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormTextArea } from '@/shared/components';
import { ImageUploader, ImagePreview } from '@/modules/storage';
import { TagInput } from '@/modules/tag';
import { useCreatePin } from '../hooks/useCreatePin';
import { pinCreateSchema, type PinCreateFormData } from './pinCreateSchema';
import { ensurePinLinkProtocol } from '../utils/pinUtils';
import type { UploadResult } from '@/modules/storage';

interface PinCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PinCreateForm: React.FC<PinCreateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  // === Храним полный результат загрузки с размерами ===
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const { createPin, isLoading } = useCreatePin({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
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
  });

  const handleImageUpload = useCallback(
    (result: UploadResult) => {
      console.log('Upload complete with dimensions:', result);
      
      setUploadResult(result);
      setValue('imageId', result.imageId);
      
      if (result.thumbnailId) {
        setValue('thumbnailId', result.thumbnailId);
      }
    },
    [setValue]
  );

  const handleRemoveImage = useCallback(() => {
    setUploadResult(null);
    setValue('imageId', '');
    setValue('thumbnailId', undefined);
  }, [setValue]);

  const onSubmit = (data: PinCreateFormData) => {
    if (!uploadResult) {
      return;
    }

    // === Передаем ВСЕ размеры при создании пина ===
    const submitData = {
      imageId: uploadResult.imageId,
      thumbnailId: uploadResult.thumbnailId,
      originalWidth: uploadResult.originalWidth,
      originalHeight: uploadResult.originalHeight,
      thumbnailWidth: uploadResult.thumbnailWidth,
      thumbnailHeight: uploadResult.thumbnailHeight,
      title: data.title || undefined,
      description: data.description || undefined,
      href: data.href ? ensurePinLinkProtocol(data.href) : undefined,
      tags: data.tags?.length ? data.tags : undefined,
    };

    console.log('Creating pin with dimensions:', submitData);
    createPin(submitData);
  };

  const hasImage = !!uploadResult;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap={4}>
        {/* Image Upload */}
        <Box>
          <Text weight="bold" size="200">
            Image *
          </Text>
          <Box marginTop={2}>
            {hasImage ? (
              <Box>
                <ImagePreview
                  imageId={uploadResult.imageId}
                  alt="Pin image"
                  height={300}
                  rounding={4}
                  showRemoveButton
                  onRemove={handleRemoveImage}
                />
                {/* Показываем размеры для отладки */}
                <Box marginTop={2}>
                  <Text size="100" color="subtle">
                    Original: {uploadResult.originalWidth}×{uploadResult.originalHeight} | 
                    Thumbnail: {uploadResult.thumbnailWidth}×{uploadResult.thumbnailHeight}
                  </Text>
                </Box>
              </Box>
            ) : (
              <ImageUploader
                onUploadComplete={handleImageUpload}
                category="pins"
                compact
              />
            )}
            {errors.imageId && (
              <Box marginTop={2}>
                <Text color="error" size="100">
                  {errors.imageId.message}
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Title */}
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <FormField
              id="pin-title"
              label="Title"
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Add a title"
              errorMessage={errors.title?.message}
              maxLength={200}
            />
          )}
        />

        {/* Description */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <FormTextArea
              id="pin-description"
              label="Description"
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Tell everyone what your Pin is about"
              errorMessage={errors.description?.message}
              maxLength={400}
              rows={3}
            />
          )}
        />

        {/* Link */}
        <Controller
          name="href"
          control={control}
          render={({ field }) => (
            <FormField
              id="pin-href"
              label="Destination link"
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="Add a link"
              errorMessage={errors.href?.message}
              type="url"
            />
          )}
        />

        <Divider />

        {/* Tags */}
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagInput
              id="pin-tags"
              label="Tags"
              selectedTags={field.value || []}
              onChange={field.onChange}
              placeholder="Search or create tags"
              maxTags={10}
              errorMessage={errors.tags?.message}
            />
          )}
        />

        <Divider />

        {/* Actions */}
        <Flex justifyContent="end" gap={2}>
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
            text={isLoading ? 'Creating...' : 'Create Pin'}
            type="submit"
            size="lg"
            color="red"
            disabled={isLoading || !hasImage}
          />
        </Flex>
      </Flex>
    </form>
  );
};

export default PinCreateForm;