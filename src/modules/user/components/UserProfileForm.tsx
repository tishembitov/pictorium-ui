// src/modules/user/components/UserProfileForm.tsx

import React, { useState, useRef } from 'react';
import { Box, Flex, Button, Text, TapArea, Spinner, Icon } from 'gestalt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormTextArea } from '@/shared/components';
import { useImageUpload, useImageUrl } from '@/modules/storage';
import { userProfileSchema, type UserProfileFormData } from './userProfileSchema';
import { useUpdateUser } from '../hooks/useUpdateUser';
import { UserAvatar } from './UserAvatar';
import type { UserResponse } from '../types/user.types';

interface UserProfileFormProps {
  user: UserResponse;
  onSuccess?: () => void;
}

// Вынесен в отдельный компонент для правильного использования хука
interface BannerImageProps {
  imageId: string | null;
  previewUrl: string | null;
}

const BannerImage: React.FC<BannerImageProps> = ({ imageId, previewUrl }) => {
  const { data: imageData } = useImageUrl(imageId, {
    enabled: !!imageId && !previewUrl,
  });
  
  const src = previewUrl ?? imageData?.url;
  
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt="Banner"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  );
};

interface SocialInputProps {
  id: string;
  label: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const SocialInput: React.FC<SocialInputProps> = ({
  id,
  label,
  prefix,
  value,
  onChange,
  error,
}) => (
  <Box>
    <Text size="200" weight="bold">
      {label}
    </Text>
    <Box marginTop={1}>
      <Flex alignItems="center">
        <Box
          paddingX={3}
          paddingY={2}
          color="secondary"
          rounding={2}
          dangerouslySetInlineStyle={{
            __style: {
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
          }}
        >
          <Text color="subtle" size="200">
            {prefix}
          </Text>
        </Box>
        <Box flex="grow">
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="username"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 16,
              border: '1px solid var(--border-default)',
              borderLeft: 'none',
              borderRadius: '0 8px 8px 0',
              outline: 'none',
            }}
          />
        </Box>
      </Flex>
    </Box>
    {error && (
      <Box marginTop={1}>
        <Text color="error" size="100">
          {error}
        </Text>
      </Box>
    )}
  </Box>
);

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  onSuccess,
}) => {
  const [avatarImageId, setAvatarImageId] = useState<string | null>(user.imageId);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerImageId, setBannerImageId] = useState<string | null>(user.bannerImageId);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { upload: uploadAvatar, isUploading: isUploadingAvatar } = useImageUpload();
  const { upload: uploadBanner, isUploading: isUploadingBanner } = useImageUpload();

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

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      const result = await uploadAvatar(file, { category: 'avatars' });
      setAvatarImageId(result.imageId);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setAvatarPreview(null);
    }
    
    // Сбрасываем value инпута, чтобы можно было загрузить тот же файл повторно
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleBannerSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setBannerPreview(previewUrl);

    try {
      const result = await uploadBanner(file, { category: 'banners' });
      setBannerImageId(result.imageId);
    } catch (error) {
      console.error('Banner upload failed:', error);
      setBannerPreview(null);
    }
    
    // Сбрасываем value инпута, чтобы можно было загрузить тот же файл повторно
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    globalThis.location.reload();
  };

  const onSubmit = (data: UserProfileFormData) => {
    updateUser({
      ...data,
      imageId: avatarImageId ?? undefined,
      bannerImageId: bannerImageId ?? undefined,
    });
  };

  const hasChanges = isDirty || 
    avatarImageId !== user.imageId || 
    bannerImageId !== user.bannerImageId;

  const isLoading = isSaving || isUploadingAvatar || isUploadingBanner;
  
  const hasBanner = !!(bannerPreview || bannerImageId);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box maxWidth={600} marginStart="auto" marginEnd="auto">
        {/* Banner Section */}
        <Box marginBottom={8}>
          <Text weight="bold" size="400">
            Profile banner
          </Text>
          <Text color="subtle" size="200">
            Recommended size: 1500 x 500 pixels
          </Text>
          
          <Box marginTop={3}>
            {/* Banner Preview */}
            <Box
              position="relative"
              width="100%"
              height={200}
              rounding={4}
              overflow="hidden"
              dangerouslySetInlineStyle={{
                __style: {
                  backgroundColor: 'var(--bg-secondary)',
                  border: hasBanner 
                    ? 'none' 
                    : '2px dashed var(--border-default)',
                },
              }}
            >
              {hasBanner ? (
                <BannerImage
                  imageId={bannerImageId}
                  previewUrl={bannerPreview}
                />
              ) : (
                <TapArea
                  onTap={() => bannerInputRef.current?.click()}
                  rounding={4}
                  disabled={isUploadingBanner}
                  fullWidth
                  fullHeight
                >
                  <Box
                    width="100%"
                    height="100%"
                    display="flex"
                    direction="column"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isUploadingBanner ? (
                      <Spinner accessibilityLabel="Uploading" show />
                    ) : (
                      <>
                        <Box marginBottom={2}>
                          <Icon
                            accessibilityLabel="No banner"
                            icon="camera"
                            size={40}
                            color="subtle"
                          />
                        </Box>
                        <Text weight="bold" color="subtle" size="300">
                          No banner
                        </Text>
                        <Box marginTop={1}>
                          <Text color="subtle" size="200">
                            Click to upload a banner image
                          </Text>
                        </Box>
                      </>
                    )}
                  </Box>
                </TapArea>
              )}
              
              {/* Loading overlay for existing banner */}
              {isUploadingBanner && hasBanner && (
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
                    },
                  }}
                >
                  <Spinner accessibilityLabel="Uploading" show />
                </Box>
              )}
            </Box>
            
            {/* Banner Change Button */}
            {hasBanner && (
              <Box marginTop={2}>
                <Button
                  text="Change"
                  onClick={() => bannerInputRef.current?.click()}
                  size="sm"
                  color="gray"
                  disabled={isUploadingBanner}
                />
              </Box>
            )}
          </Box>
          
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerSelect}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Avatar Section */}
        <Box marginBottom={8}>
          <Text weight="bold" size="400">
            Profile photo
          </Text>
          <Text color="subtle" size="200">
            Square image works best
          </Text>
          
          <Box marginTop={3}>
            <Flex alignItems="center" gap={4}>
              <Box position="relative">
                <UserAvatar
                  imageId={avatarPreview ? null : avatarImageId}
                  src={avatarPreview}
                  name={user.username}
                  size="xxl"
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
                    <Spinner accessibilityLabel="Uploading" show />
                  </Box>
                )}
              </Box>
              
              <Button
                text="Change"
                onClick={() => avatarInputRef.current?.click()}
                size="sm"
                color="gray"
                disabled={isUploadingAvatar}
              />
            </Flex>
          </Box>
          
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Basic Info */}
        <Box marginBottom={6}>
          <Text weight="bold" size="400">
            Basic info
          </Text>
          
          <Box marginTop={4}>
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
          </Box>
          
          <Box marginTop={4}>
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
                  rows={3}
                />
              )}
            />
          </Box>
        </Box>

        {/* Social Links */}
        <Box marginBottom={6}>
          <Text weight="bold" size="400">
            Social profiles
          </Text>
          <Text color="subtle" size="200">
            Add your social media handles
          </Text>
          
          <Box marginTop={4}>
            <Flex direction="column" gap={4}>
              <Controller
                name="instagram"
                control={control}
                render={({ field }) => (
                  <SocialInput
                    id="instagram"
                    label="Instagram"
                    prefix="instagram.com/"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.instagram?.message}
                  />
                )}
              />
              
              <Controller
                name="pinterest"
                control={control}
                render={({ field }) => (
                  <SocialInput
                    id="pinterest"
                    label="Pinterest"
                    prefix="pinterest.com/"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.pinterest?.message}
                  />
                )}
              />
              
              <Controller
                name="tiktok"
                control={control}
                render={({ field }) => (
                  <SocialInput
                    id="tiktok"
                    label="TikTok"
                    prefix="tiktok.com/@"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.tiktok?.message}
                  />
                )}
              />
              
              <Controller
                name="telegram"
                control={control}
                render={({ field }) => (
                  <SocialInput
                    id="telegram"
                    label="Telegram"
                    prefix="t.me/"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.telegram?.message}
                  />
                )}
              />
            </Flex>
          </Box>
        </Box>

        {/* Submit */}
        <Box paddingY={4}>
          <Flex justifyContent="end" gap={3}>
            <Button
              text="Reset"
              onClick={handleReset}
              size="lg"
              color="gray"
              disabled={!hasChanges || isLoading}
            />
            <Button
              text={isLoading ? 'Saving...' : 'Save'}
              type="submit"
              color="red"
              size="lg"
              disabled={!hasChanges || isLoading}
            />
          </Flex>
        </Box>
      </Box>
    </form>
  );
};

export default UserProfileForm;