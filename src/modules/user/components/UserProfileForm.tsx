// src/modules/user/components/UserProfileForm.tsx

import React, { useState } from 'react';
import { Box, Flex, Button, Divider, Text } from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormTextArea } from '@/shared/components';
import { ImageUploader, ImagePreview } from '@/modules/storage';
import { userProfileSchema, type UserProfileFormData } from './userProfileSchema';
import { useUpdateUser } from '../hooks/useUpdateUser';
import type { UserResponse } from '../types/user.types';

interface UserProfileFormProps {
  user: UserResponse;
  onSuccess?: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onSuccess,
}) => {
  const [avatarImageId, setAvatarImageId] = useState<string | null>(user.imageId);
  const [bannerImageId, setBannerImageId] = useState<string | null>(user.bannerImageId);

  const { updateUser, isLoading } = useUpdateUser({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      username: user.username,
      description: user.description || '',
      imageId: user.imageId || '',
      bannerImageId: user.bannerImageId || '',
      instagram: user.instagram || '',
      tiktok: user.tiktok || '',
      telegram: user.telegram || '',
      pinterest: user.pinterest || '',
    },
  });

  const onSubmit = (data: UserProfileFormData) => {
    updateUser({
      ...data,
      imageId: avatarImageId || undefined,
      bannerImageId: bannerImageId || undefined,
    });
  };

  const hasChanges = isDirty || 
    avatarImageId !== user.imageId || 
    bannerImageId !== user.bannerImageId;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap={6}>
        {/* Avatar */}
        <Box>
          <Text weight="bold" size="300">Profile photo</Text>
          <Box marginTop={2}>
            <Flex gap={4} alignItems="center">
              <ImagePreview
                imageId={avatarImageId}
                alt="Profile photo"
                width={100}
                height={100}
                rounding="circle"
              />
              <ImageUploader
                onUploadComplete={(result) => setAvatarImageId(result.imageId)}
                category="avatars"
                compact
                showPreview={false}
              />
            </Flex>
          </Box>
        </Box>

        <Divider />

        {/* Banner */}
        <Box>
          <Text weight="bold" size="300">Banner image</Text>
          <Box marginTop={2}>
            <Flex direction="column" gap={2}>
              {bannerImageId && (
                <ImagePreview
                  imageId={bannerImageId}
                  alt="Banner"
                  height={150}
                  rounding={2}
                  showRemoveButton
                  onRemove={() => setBannerImageId(null)}
                />
              )}
              <ImageUploader
                onUploadComplete={(result) => setBannerImageId(result.imageId)}
                category="banners"
                compact
                showPreview={false}
              />
            </Flex>
          </Box>
        </Box>

        <Divider />

        {/* Username */}
        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <FormField
              id="username"
              label="Username"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              errorMessage={errors.username?.message}
              placeholder="Your username"
            />
          )}
        />

        {/* Description */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <FormTextArea
              id="description"
              label="About"
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              errorMessage={errors.description?.message}
              placeholder="Tell others about yourself"
              maxLength={200}
              rows={3}
            />
          )}
        />

        <Divider />

        {/* Social Links */}
        <Text weight="bold" size="300">Social profiles</Text>

        <Controller
          name="instagram"
          control={control}
          render={({ field }) => (
            <FormField
              id="instagram"
              label="Instagram"
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="username"
              errorMessage={errors.instagram?.message}
            />
          )}
        />

        <Controller
          name="pinterest"
          control={control}
          render={({ field }) => (
            <FormField
              id="pinterest"
              label="Pinterest"
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="username"
              errorMessage={errors.pinterest?.message}
            />
          )}
        />

        <Controller
          name="tiktok"
          control={control}
          render={({ field }) => (
            <FormField
              id="tiktok"
              label="TikTok"
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="username"
              errorMessage={errors.tiktok?.message}
            />
          )}
        />

        <Controller
          name="telegram"
          control={control}
          render={({ field }) => (
            <FormField
              id="telegram"
              label="Telegram"
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="username"
              errorMessage={errors.telegram?.message}
            />
          )}
        />

        <Divider />

        {/* Submit */}
        <Flex justifyContent="end" gap={2}>
          <Button
            text="Save"
            type="submit"
            color="red"
            size="lg"
            disabled={!hasChanges || isLoading}
          />
        </Flex>
      </Flex>
    </form>
  );
};

export default UserProfileForm;