// src/modules/pin/components/PinEditForm.tsx

import React, { useState, useCallback } from 'react';
import { Box, Flex, Divider } from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormField,
  FormTextArea,
  FormSection,
  FormFooter,
  ImageUploadArea,
} from '@/shared/components';
import { TagInput } from '@/modules/tag';
import { useUpdatePin } from '../hooks/useUpdatePin';
import { pinEditSchema, type PinEditFormData } from './pinEditSchema';
import { ensurePinLinkProtocol } from '../utils/pinUtils';
import type { PinResponse } from '../types/pin.types';
import type { UploadResult } from '@/modules/storage';

interface PinEditFormProps {
  pin: PinResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PinEditForm: React.FC<PinEditFormProps> = ({
  pin,
  onSuccess,
  onCancel,
}) => {
  // Image state
  const [imageId, setImageId] = useState<string>(pin.imageId);
  const [thumbnailId, setThumbnailId] = useState<string | null>(pin.thumbnailId);
  const [imageDimensions, setImageDimensions] = useState<{
    originalWidth: number;
    originalHeight: number;
    thumbnailWidth: number;
    thumbnailHeight: number;
  } | null>(null);

  const { updatePin, isLoading } = useUpdatePin({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<PinEditFormData>({
    resolver: zodResolver(pinEditSchema),
    defaultValues: {
      title: pin.title || '',
      description: pin.description || '',
      href: pin.href || '',
      tags: pin.tags || [],
    },
    mode: 'onChange',
  });

  const handleImageUpload = useCallback(
    (result: UploadResult) => {
      setImageId(result.imageId);
      setValue('imageId', result.imageId, { shouldDirty: true });

      if (result.thumbnailId) {
        setThumbnailId(result.thumbnailId);
        setValue('thumbnailId', result.thumbnailId, { shouldDirty: true });
      }

      setImageDimensions({
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        thumbnailWidth: result.thumbnailWidth,
        thumbnailHeight: result.thumbnailHeight,
      });
    },
    [setValue]
  );

  const onSubmit = (data: PinEditFormData) => {
    const hasImageChanged = imageId !== pin.imageId;

    const submitData: Record<string, unknown> = {
      title: data.title,
      description: data.description || undefined,
      href: data.href ? ensurePinLinkProtocol(data.href) : undefined,
      tags: data.tags?.length ? data.tags : undefined,
    };

    // Only include image data if changed
    if (hasImageChanged) {
      submitData.imageId = imageId;
      submitData.thumbnailId = thumbnailId || undefined;
      if (imageDimensions) {
        submitData.originalWidth = imageDimensions.originalWidth;
        submitData.originalHeight = imageDimensions.originalHeight;
        submitData.thumbnailWidth = imageDimensions.thumbnailWidth;
        submitData.thumbnailHeight = imageDimensions.thumbnailHeight;
      }
    }

    updatePin({ pinId: pin.id, data: submitData });
  };

  // Validation
  const hasChanges = isDirty || imageId !== pin.imageId;

  const getValidationMessage = (): string | null => {
    if (!hasChanges) return 'No changes to save';
    return null;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex gap={6} wrap>
        {/* Left Column - Image */}
        <Box width={280}>
          <FormSection
            title="Pin image"
            description="Recommended: 1000×1500 px"
          >
            <ImageUploadArea
              imageId={imageId}
              onUploadComplete={handleImageUpload}
              category="pins"
              generateThumbnail
              aspectRatio="2 / 3"
              placeholderText="Click to upload"
              placeholderSubtext="or drag and drop"
              errorMessage={errors.imageId?.message}
            />
          </FormSection>
        </Box>

        {/* Right Column - Form Fields */}
        <Box flex="grow" minWidth={280} maxWidth={400}>
          {/* Title */}
          <FormSection title="Title" required>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <FormField
                  id="edit-pin-title"
                  label=""
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Add a title"
                  errorMessage={errors.title?.message}
                  maxLength={200}
                  size="md"
                />
              )}
            />
          </FormSection>

          {/* Description */}
          <FormSection title="Description">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <FormTextArea
                  id="edit-pin-description"
                  label=""
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
          </FormSection>

          {/* Link */}
          <FormSection title="Destination link">
            <Controller
              name="href"
              control={control}
              render={({ field }) => (
                <FormField
                  id="edit-pin-href"
                  label=""
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Add a link"
                  errorMessage={errors.href?.message}
                  type="url"
                  size="md"
                />
              )}
            />
          </FormSection>

          <Divider />

          {/* Tags */}
          <Box marginTop={4}>
            <FormSection title="Tags">
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    id="edit-pin-tags"
                    label=""
                    selectedTags={field.value || []}
                    onChange={field.onChange}
                    placeholder="Search or create tags"
                    maxTags={10}
                    errorMessage={errors.tags?.message}
                  />
                )}
              />
            </FormSection>
          </Box>
        </Box>
      </Flex>

      {/* Footer */}
      <FormFooter
        onCancel={onCancel}
        submitText="Save changes"
        cancelText="Cancel"
        isLoading={isLoading}
        isDisabled={!hasChanges}
        validationMessage={getValidationMessage()}
      />
    </form>
  );
};

export default PinEditForm;