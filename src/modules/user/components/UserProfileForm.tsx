// src/modules/user/components/UserProfileForm.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Flex, Divider, Spinner, Button } from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormField,
  FormTextArea,
  FormSection,
  FormFooter,
  ImageUploadArea,
  SocialLinkInput,
} from '@/shared/components';
import { useImageUpload } from '@/modules/storage';
import { useToast } from '@/shared/hooks/useToast';
import { userProfileSchema, type UserProfileFormData } from './userProfileSchema';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { UserAvatar } from './UserAvatar';
import type { UserResponse } from '../types/user.types';
import type { UploadResult } from '@/modules/storage';

interface UserProfileFormProps {
  user: UserResponse;
  onSuccess?: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onSuccess,
}) => {
  // Image states
  const [avatarImageId, setAvatarImageId] = useState<string | null>(user.imageId);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [bannerImageId, setBannerImageId] = useState<string | null>(user.bannerImageId);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { upload: uploadAvatar, isUploading: isUploadingAvatar } = useImageUpload();

  const { updateUser, isLoading: isSaving } = useUpdateUser({
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
      description: user.description ?? '',
      imageId: user.imageId ?? '',
      bannerImageId: user.bannerImageId ?? '',
      instagram: user.instagram ?? '',
      tiktok: user.tiktok ?? '',
      telegram: user.telegram ?? '',
      pinterest: user.pinterest ?? '',
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [bannerPreview, avatarPreview]);

  // Avatar handlers
  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarRemoved(false);

    try {
      const result = await uploadAvatar(file, { category: 'avatars' });
      setAvatarImageId(result.imageId);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setAvatarPreview(null);
      URL.revokeObjectURL(previewUrl);
      toast.error('Failed to upload avatar');
    }

    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarImageId(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
  };

  // Banner handlers
  const handleBannerUpload = (result: UploadResult) => {
    setBannerImageId(result.imageId);
    setBannerRemoved(false);
  };

  const handleRemoveBanner = () => {
    setBannerImageId(null);
    setBannerPreview(null);
    setBannerRemoved(true);
  };

  const onSubmit = (data: UserProfileFormData) => {
    const submitData: Record<string, unknown> = {
      username: data.username,
      description: data.description || undefined,
      instagram: data.instagram || undefined,
      tiktok: data.tiktok || undefined,
      telegram: data.telegram || undefined,
      pinterest: data.pinterest || undefined,
    };

    // Handle avatar
    if (avatarRemoved) {
      submitData.imageId = '';
    } else if (avatarImageId && avatarImageId !== user.imageId) {
      submitData.imageId = avatarImageId;
    }

    // Handle banner
    if (bannerRemoved) {
      submitData.bannerImageId = '';
    } else if (bannerImageId && bannerImageId !== user.bannerImageId) {
      submitData.bannerImageId = bannerImageId;
    }

    updateUser(submitData);
  };

  // Computed
  const hasChanges =
    isDirty ||
    avatarImageId !== user.imageId ||
    bannerImageId !== user.bannerImageId ||
    avatarRemoved ||
    bannerRemoved;

  const isLoading = isSaving || isUploadingAvatar;
  const hasAvatar = !avatarRemoved && !!(avatarPreview || avatarImageId);

  const avatarImageIdToShow = useMemo(() => {
    if (!hasAvatar) return null;
    if (avatarPreview) return null;
    return avatarImageId;
  }, [hasAvatar, avatarPreview, avatarImageId]);

  const getValidationMessage = (): string | null => {
    if (!hasChanges) return 'No changes to save';
    return null;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Hidden avatar input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        style={{ display: 'none' }}
      />

      <Flex gap={6} wrap>
        {/* Left Column - Banner */}
        <Box width={240}>
          <FormSection title="Profile banner" description="Recommended: 1500×500">
            <ImageUploadArea
              imageId={bannerImageId}
              onUploadComplete={handleBannerUpload}
              onRemove={handleRemoveBanner}
              category="banners"
              generateThumbnail={false}
              aspectRatio="3 / 4"
              placeholderText="Add banner"
              showDimensions={false}
            />
          </FormSection>
        </Box>

        {/* Right Column - Avatar & Form Fields */}
        <Box flex="grow" minWidth={280}>
          {/* Avatar Section */}
          <FormSection title="Profile photo">
            <Flex alignItems="center" gap={3}>
              <Box position="relative">
                <UserAvatar
                  imageId={avatarImageIdToShow}
                  src={avatarPreview}
                  name={user.username}
                  size="xl"
                />
                {isUploadingAvatar && (
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
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '50%',
                      },
                    }}
                  >
                    <Spinner accessibilityLabel="Uploading" show size="sm" />
                  </Box>
                )}
              </Box>

              <Flex direction="column" gap={1}>
                <Button
                  text="Change"
                  onClick={() => avatarInputRef.current?.click()}
                  size="sm"
                  color="gray"
                  disabled={isUploadingAvatar}
                />
                {hasAvatar && (
                  <Button
                    text="Remove"
                    onClick={handleRemoveAvatar}
                    size="sm"
                    color="transparent"
                    disabled={isUploadingAvatar}
                  />
                )}
              </Flex>
            </Flex>
          </FormSection>

          <Divider />

          {/* Basic Info */}
          <Box marginTop={4}>
            <FormSection title="Basic info">
              <Flex direction="column" gap={3}>
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
                      size="md"
                    />
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormTextArea
                      id="description"
                      label="About"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      errorMessage={errors.description?.message}
                      placeholder="Tell everyone about yourself"
                      maxLength={200}
                      rows={2}
                    />
                  )}
                />
              </Flex>
            </FormSection>
          </Box>

          <Divider />

          {/* Social Links */}
          <Box marginTop={4}>
            <FormSection title="Social profiles">
              <Flex direction="column" gap={3}>
                <Controller
                  name="instagram"
                  control={control}
                  render={({ field }) => (
                    <SocialLinkInput
                      id="instagram"
                      label="Instagram"
                      prefix="instagram.com/"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      errorMessage={errors.instagram?.message}
                    />
                  )}
                />

                <Controller
                  name="pinterest"
                  control={control}
                  render={({ field }) => (
                    <SocialLinkInput
                      id="pinterest"
                      label="Pinterest"
                      prefix="pinterest.com/"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      errorMessage={errors.pinterest?.message}
                    />
                  )}
                />

                <Controller
                  name="tiktok"
                  control={control}
                  render={({ field }) => (
                    <SocialLinkInput
                      id="tiktok"
                      label="TikTok"
                      prefix="tiktok.com/@"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      errorMessage={errors.tiktok?.message}
                    />
                  )}
                />

                <Controller
                  name="telegram"
                  control={control}
                  render={({ field }) => (
                    <SocialLinkInput
                      id="telegram"
                      label="Telegram"
                      prefix="t.me/"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      errorMessage={errors.telegram?.message}
                    />
                  )}
                />
              </Flex>
            </FormSection>
          </Box>
        </Box>
      </Flex>

      {/* Footer */}
      <FormFooter
        submitText="Save"
        isLoading={isLoading}
        isDisabled={!hasChanges}
        validationMessage={getValidationMessage()}
      />
    </form>
  );
};

export default UserProfileForm;