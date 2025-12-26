// src/modules/user/components/UserProfileForm.tsx

import React, { useState, useRef } from 'react';
import { Box, Flex, Button, Text, TapArea, Spinner, Icon, Divider } from 'gestalt';
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

// Banner Image Component
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

// Social Input Component
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

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      const result = await uploadAvatar(file, { category: 'avatars' });
      setAvatarImageId(result.imageId);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setAvatarPreview(null);
    }
    
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
    
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleRemoveBanner = () => {
    setBannerImageId(null);
    setBannerPreview(null);
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
      {/* Hidden file inputs */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={handleBannerSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        style={{ display: 'none' }}
      />

      {/* Main Layout: Banner Left, Content Right */}
      <Flex gap={6} wrap>
        {/* Left Column - Banner */}
        <Box width={240}>
          <Box marginBottom={2}>
            <Text weight="bold" size="200">
              Profile banner
            </Text>
            <Text color="subtle" size="100">
              Recommended: 1500×500
            </Text>
          </Box>

          {/* Banner Preview Container */}
          <Box
            position="relative"
            width="100%"
            rounding={3}
            overflow="hidden"
            dangerouslySetInlineStyle={{
              __style: {
                aspectRatio: '3 / 4',
                backgroundColor: 'var(--bg-secondary)',
                border: hasBanner 
                  ? 'none' 
                  : '2px dashed var(--border-default)',
              },
            }}
          >
            {hasBanner ? (
              <>
                <BannerImage
                  imageId={bannerImageId}
                  previewUrl={bannerPreview}
                />
                
                {/* Loading overlay */}
                {isUploadingBanner && (
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
              </>
            ) : (
              <TapArea
                onTap={() => bannerInputRef.current?.click()}
                rounding={3}
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
                  padding={4}
                >
                  {isUploadingBanner ? (
                    <Spinner accessibilityLabel="Uploading" show />
                  ) : (
                    <>
                      <Box 
                        marginBottom={2} 
                        color="secondary" 
                        rounding="circle" 
                        padding={3}
                      >
                        <Icon
                          accessibilityLabel="Upload banner"
                          icon="camera"
                          size={24}
                          color="subtle"
                        />
                      </Box>
                      <Text weight="bold" align="center" size="200">
                        Add banner
                      </Text>
                    </>
                  )}
                </Box>
              </TapArea>
            )}
          </Box>

          {/* Banner buttons - under the banner */}
          {hasBanner && (
            <Box marginTop={2}>
              <Flex gap={2}>
                <Button
                  text="Change"
                  onClick={() => bannerInputRef.current?.click()}
                  size="sm"
                  color="gray"
                  disabled={isUploadingBanner}
                />
                <Button
                  text="Remove"
                  onClick={handleRemoveBanner}
                  size="sm"
                  color="transparent"
                  disabled={isUploadingBanner}
                />
              </Flex>
            </Box>
          )}
        </Box>

        {/* Right Column - Avatar & Form Fields */}
        <Box flex="grow" minWidth={280}>
          {/* Avatar Section */}
          <Box marginBottom={5}>
            <Box marginBottom={2}>
              <Text weight="bold" size="200">
                Profile photo
              </Text>
            </Box>
            
            <Flex alignItems="center" gap={3}>
              <Box position="relative">
                <UserAvatar
                  imageId={avatarPreview ? null : avatarImageId}
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
                {avatarImageId && (
                  <Button
                    text="Remove"
                    onClick={() => {
                      setAvatarImageId(null);
                      setAvatarPreview(null);
                    }}
                    size="sm"
                    color="transparent"
                    disabled={isUploadingAvatar}
                  />
                )}
              </Flex>
            </Flex>
          </Box>

          <Divider />

          {/* Basic Info */}
          <Box marginTop={5} marginBottom={5}>
            <Box marginBottom={3}>
              <Text weight="bold" size="200">
                Basic info
              </Text>
            </Box>
            
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
          </Box>

          <Divider />

          {/* Social Links */}
          <Box marginTop={5}>
            <Box marginBottom={3}>
              <Text weight="bold" size="200">
                Social profiles
              </Text>
            </Box>
            
            <Flex direction="column" gap={3}>
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
      </Flex>

      {/* Submit Buttons */}
      <Box marginTop={6} padding={4}>
        <Divider />
        <Box paddingY={4}>
          <Flex justifyContent="end" gap={2}>
            <Button
              text={isLoading ? 'Saving...' : 'Save'}
              type="submit"
              color="red"
              size="md"
              disabled={!hasChanges || isLoading}
            />
          </Flex>
        </Box>
      </Box>
    </form>
  );
};

export default UserProfileForm;