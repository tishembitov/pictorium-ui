// src/modules/user/components/UserProfileHeader.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Text, 
  Heading, 
  Button, 
  TapArea, 
  IconButton, 
  Layer, 
  Spinner 
} from 'gestalt';
import { buildPath, ROUTES } from '@/app/router/routeConfig';
import { UserAvatar } from './UserAvatar';
import { FollowButton } from './FollowButton';
import { ProfileShareButton } from './ProfileShareButton';
import { useAuth } from '@/modules/auth';
import { useImageUrl } from '@/modules/storage';
import { useFollowers } from '../hooks/useFollowers';
import { useFollowing } from '../hooks/useFollowing';
import { formatCompactNumber } from '@/shared/utils/formatters';
import { 
  formatUsername, 
  hasSocialLinks, 
  getSocialUrls,
} from '../utils/userUtils';
import type { UserResponse } from '../types/user.types';

interface UserProfileHeaderProps {
  user: UserResponse;
  pinsCount?: number;
}

// Layout constants
const BANNER_HEIGHT = 300; // Уменьшено с 420
const BANNER_WIDTH_PERCENT = 50; // Уменьшено с 55

// Helper components
interface StatItemProps {
  value: number;
  label: string;
  clickable?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, clickable }) => (
  <Flex direction="column" alignItems="center">
    <Text weight="bold" size="400">
      {formatCompactNumber(value)}
    </Text>
    <Text 
      color="subtle" 
      size="200"
      underline={clickable}
    >
      {label}
    </Text>
  </Flex>
);

interface SocialButtonProps {
  label: string;
  onClick: () => void;
}

const SocialButton: React.FC<SocialButtonProps> = ({ label, onClick }) => (
  <TapArea onTap={onClick} rounding="pill" tapStyle="compress">
    <Box
      paddingX={3}
      paddingY={2}
      rounding="pill"
      color="secondary"
    >
      <Text size="200" weight="bold">
        {label}
      </Text>
    </Box>
  </TapArea>
);

// Fullscreen Image Component
interface FullscreenImageProps {
  src: string;
  alt: string;
  onClose: () => void;
  rounding?: number;
}

const FullscreenImage: React.FC<FullscreenImageProps> = ({ 
  src, 
  alt, 
  onClose,
  rounding = 16,
}) => (
  <Layer>
    <Box
      position="fixed"
      top
      left
      right
      bottom
      display="flex"
      alignItems="center"
      justifyContent="center"
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 999,
          cursor: 'zoom-out',
        },
      }}
    >
      <TapArea onTap={onClose} fullWidth fullHeight>
        <Box
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding={4}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              borderRadius: rounding,
            }}
          />
        </Box>
      </TapArea>

      <Box position="absolute" top right padding={4}>
        <IconButton
          accessibilityLabel="Close fullscreen"
          icon="cancel"
          onClick={onClose}
          bgColor="white"
          size="lg"
        />
      </Box>
    </Box>
  </Layer>
);

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  pinsCount = 0,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;
  
  // Image states
  const [bannerError, setBannerError] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  
  // Fullscreen states
  const [bannerFullscreen, setBannerFullscreen] = useState(false);
  const [avatarFullscreen, setAvatarFullscreen] = useState(false);

  // Get images
  const { data: bannerData, isLoading: bannerLoading } = useImageUrl(user.bannerImageId, {
    enabled: !!user.bannerImageId,
  });
  
  const { data: avatarData } = useImageUrl(user.imageId, {
    enabled: !!user.imageId,
  });

  // Get follower/following counts
  const { totalElements: followersCount } = useFollowers(user.id, {
    pageable: { page: 0, size: 1 },
  });
  const { totalElements: followingCount } = useFollowing(user.id, {
    pageable: { page: 0, size: 1 },
  });

  const formattedUsername = formatUsername(user.username);
  const socialUrls = getSocialUrls(user);
  const showSocialLinks = hasSocialLinks(user);

  // Handlers
  const handleEditProfile = useCallback(() => {
    navigate(ROUTES.SETTINGS);
  }, [navigate]);

  const handleFollowersClick = useCallback(() => {
    navigate(buildPath.followers(user.username));
  }, [navigate, user.username]);

  const handleFollowingClick = useCallback(() => {
    navigate(buildPath.following(user.username));
  }, [navigate, user.username]);

  const openSocialLink = useCallback((url: string | null) => {
    if (url) {
      globalThis.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Fullscreen handlers
  const openBannerFullscreen = useCallback(() => {
    setBannerFullscreen(true);
  }, []);

  const closeBannerFullscreen = useCallback(() => {
    setBannerFullscreen(false);
  }, []);

  const openAvatarFullscreen = useCallback(() => {
    setAvatarFullscreen(true);
  }, []);

  const closeAvatarFullscreen = useCallback(() => {
    setAvatarFullscreen(false);
  }, []);

  const showBanner = !!bannerData?.url && !bannerError;
  const hasAvatar = !!user.imageId && !!avatarData?.url;

  return (
    <Box>
      {/* Main Header Container - Horizontal Layout */}
      <Box
        display="flex"
        direction="row"
        rounding={5}
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: {
            minHeight: BANNER_HEIGHT,
            backgroundColor: 'var(--color-background-secondary)',
          },
        }}
      >
        {/* Left Side - User Info */}
        <Box
          flex="grow"
          display="flex"
          direction="column"
          alignItems="center"
          justifyContent="center"
          paddingX={6}
          paddingY={6}
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: 'var(--color-background-default)',
            },
          }}
        >
          {/* Avatar */}
          <Box
            dangerouslySetInlineStyle={{
              __style: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '50%',
                cursor: hasAvatar ? 'pointer' : 'default',
              },
            }}
          >
            {hasAvatar ? (
              <TapArea onTap={openAvatarFullscreen} rounding="circle">
                <UserAvatar
                  imageId={user.imageId}
                  name={user.username}
                  size="xxl"
                  outline
                />
              </TapArea>
            ) : (
              <UserAvatar
                imageId={user.imageId}
                name={user.username}
                size="xxl"
                outline
              />
            )}
          </Box>

          {/* Name & Username */}
          <Box marginTop={4} width="100%" maxWidth={500}>
            <Heading size="400" align="center">
              {user.username}
            </Heading>
            <Box marginTop={1}>
              <Text align="center" color="subtle" size="300">
                {formattedUsername}
              </Text>
            </Box>
          </Box>

          {/* Description */}
          {user.description && (
            <Box marginTop={3} maxWidth={600} paddingX={4}>
              <Text align="center" size="300">
                {user.description}
              </Text>
            </Box>
          )}

          {/* Social Links */}
          {showSocialLinks && (
            <Box marginTop={4}>
              <Flex gap={3} justifyContent="center" wrap>
                {socialUrls.instagram && (
                  <SocialButton
                    label="Instagram"
                    onClick={() => openSocialLink(socialUrls.instagram)}
                  />
                )}
                {socialUrls.pinterest && (
                  <SocialButton
                    label="Pinterest"
                    onClick={() => openSocialLink(socialUrls.pinterest)}
                  />
                )}
                {socialUrls.tiktok && (
                  <SocialButton
                    label="TikTok"
                    onClick={() => openSocialLink(socialUrls.tiktok)}
                  />
                )}
                {socialUrls.telegram && (
                  <SocialButton
                    label="Telegram"
                    onClick={() => openSocialLink(socialUrls.telegram)}
                  />
                )}
              </Flex>
            </Box>
          )}

          {/* Stats */}
          <Box marginTop={4}>
            <Flex gap={8} justifyContent="center">
              <StatItem 
                value={pinsCount} 
                label="pins" 
              />
              <TapArea onTap={handleFollowersClick}>
                <StatItem 
                  value={followersCount} 
                  label="followers" 
                  clickable
                />
              </TapArea>
              <TapArea onTap={handleFollowingClick}>
                <StatItem 
                  value={followingCount} 
                  label="following" 
                  clickable
                />
              </TapArea>
            </Flex>
          </Box>

          {/* Actions */}
          <Box marginTop={5}>
            <Flex gap={3}>
              {isCurrentUser ? (
                <>
                  <Button
                    text="Edit profile"
                    onClick={handleEditProfile}
                    size="lg"
                    color="gray"
                  />
                  <ProfileShareButton user={user} size="lg" />
                </>
              ) : (
                <>
                  <FollowButton userId={user.id} size="lg" />
                  <Button
                    text="Message"
                    size="lg"
                    color="gray"
                  />
                  <ProfileShareButton user={user} size="lg" />
                </>
              )}
            </Flex>
          </Box>
        </Box>

        {/* Right Side - Banner */}
        <Box
          position="relative"
          onMouseEnter={() => setIsBannerHovered(true)}
          onMouseLeave={() => setIsBannerHovered(false)}
          dangerouslySetInlineStyle={{
            __style: {
              width: `${BANNER_WIDTH_PERCENT}%`,
              minHeight: BANNER_HEIGHT,
              background: showBanner 
                ? 'transparent' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              flexShrink: 0,
            },
          }}
        >
          {/* Banner Loading */}
          {bannerLoading && (
            <Box
              position="absolute"
              top
              left
              right
              bottom
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="secondary"
            >
              <Spinner accessibilityLabel="Loading banner" show />
            </Box>
          )}

          {/* Banner Image */}
          {showBanner && bannerData?.url && (
            <TapArea onTap={openBannerFullscreen} fullWidth fullHeight>
              <Box width="100%" height="100%" position="relative">
                {!bannerLoaded && (
                  <Box
                    position="absolute"
                    top
                    left
                    right
                    bottom
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="secondary"
                  >
                    <Spinner accessibilityLabel="Loading" show size="md" />
                  </Box>
                )}

                <img
                  src={bannerData.url}
                  alt={`${user.username}'s banner`}
                  onLoad={() => setBannerLoaded(true)}
                  onError={() => setBannerError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: bannerLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  }}
                />
              </Box>
            </TapArea>
          )}

          {/* Zoom Button on Hover */}
          {showBanner && isBannerHovered && bannerLoaded && (
            <Box 
              position="absolute" 
              bottom 
              right 
              padding={3}
              dangerouslySetInlineStyle={{
                __style: {
                  zIndex: 10,
                },
              }}
            >
              <IconButton
                accessibilityLabel="View fullscreen"
                icon="maximize"
                onClick={openBannerFullscreen}
                bgColor="white"
                size="md"
              />
            </Box>
          )}

          {/* No banner placeholder */}
          {!showBanner && !bannerLoading && (
            <Box
              width="100%"
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="inverse" size="200">
                No banner image
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Banner Fullscreen */}
      {bannerFullscreen && bannerData?.url && (
        <FullscreenImage
          src={bannerData.url}
          alt={`${user.username}'s banner`}
          onClose={closeBannerFullscreen}
          rounding={16}
        />
      )}

      {/* Avatar Fullscreen */}
      {avatarFullscreen && avatarData?.url && (
        <FullscreenImage
          src={avatarData.url}
          alt={`${user.username}'s profile photo`}
          onClose={closeAvatarFullscreen}
          rounding={999}
        />
      )}
    </Box>
  );
};

export default UserProfileHeader;