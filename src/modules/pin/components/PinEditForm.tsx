// src/modules/pin/components/PinEditForm.tsx

import React, { useState, useCallback } from 'react';
import { Box, Flex, Button, Divider, Text } from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormTextArea } from '@/shared/components';
import { ImagePreview, ImageUploader } from '@/modules/storage';
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
  const [imageId, setImageId] = useState<string>(pin.imageId);
  const [thumbnailId, setThumbnailId] = useState<string | null>(pin.thumbnailId);
  const [showImageUploader, setShowImageUploader] = useState(false);

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
  });

  const handleImageUpload = useCallback(
    (result: UploadResult) => {
      setImageId(result.imageId);
      setValue('imageId', result.imageId, { shouldDirty: true });
      
      if (result.thumbnailId) {
        setThumbnailId(result.thumbnailId);
        setValue('thumbnailId', result.thumbnailId, { shouldDirty: true });
      }
      
      setShowImageUploader(false);
    },
    [setValue]
  );

  const onSubmit = (data: PinEditFormData) => {
    const hasImageChanged = imageId !== pin.imageId;
    
    const submitData = {
      ...data,
      imageId: hasImageChanged ? imageId : undefined,
      thumbnailId: hasImageChanged ? thumbnailId || undefined : undefined,
      href: data.href ? ensurePinLinkProtocol(data.href) : undefined,
      tags: data.tags?.length ? data.tags : undefined,
    };

    updatePin({ pinId: pin.id, data: submitData });
  };

  const hasChanges = isDirty || imageId !== pin.imageId;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap={6}>
        {/* Image */}
        <Box>
          <Flex justifyContent="between" alignItems="center">
            <Text weight="bold" size="300">
              Image
            </Text>
            {!showImageUploader && (
              <Button
                text="Change image"
                onClick={() => setShowImageUploader(true)}
                size="sm"
                color="gray"
              />
            )}
          </Flex>
          <Box marginTop={2}>
            {showImageUploader ? (
              <Box>
                <ImageUploader
                  onUploadComplete={handleImageUpload}
                  category="pins"
                  generateThumbnail
                  thumbnailWidth={236}
                  thumbnailHeight={236}
                />
                <Box marginTop={2}>
                  <Button
                    text="Cancel"
                    onClick={() => setShowImageUploader(false)}
                    size="sm"
                    color="gray"
                  />
                </Box>
              </Box>
            ) : (
              <ImagePreview
                imageId={imageId}
                alt={pin.title || 'Pin image'}
                height={300}
                rounding={4}
              />
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
              id="edit-pin-title"
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
              id="edit-pin-description"
              label="Description"
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

        {/* Link */}
        <Controller
          name="href"
          control={control}
          render={({ field }) => (
            <FormField
              id="edit-pin-href"
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
              id="edit-pin-tags"
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
            text={isLoading ? 'Saving...' : 'Save changes'}
            type="submit"
            size="lg"
            color="red"
            disabled={isLoading || !hasChanges}
          />
        </Flex>
      </Flex>
    </form>
  );
};

export default PinEditForm;