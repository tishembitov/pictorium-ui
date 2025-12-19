// src/modules/user/components/UserProfileHeader.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Heading, Button, TapArea } from 'gestalt';
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

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  pinsCount = 0,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;
  const [bannerError, setBannerError] = useState(false);

  // Get banner image
  const { data: bannerData } = useImageUrl(user.bannerImageId, {
    enabled: !!user.bannerImageId,
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

  const handleEditProfile = () => {
    navigate(ROUTES.SETTINGS);
  };

  const handleFollowersClick = () => {
    navigate(buildPath.followers(user.username));
  };

  const handleFollowingClick = () => {
    navigate(buildPath.following(user.username));
  };

  const openSocialLink = (url: string | null) => {
    if (url) {
      globalThis.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const showBanner = !!bannerData?.url && !bannerError;

  return (
    <Box>
      {/* Banner Section */}
      <Box
        position="relative"
        width="100%"
        dangerouslySetInlineStyle={{
          __style: {
            height: showBanner ? 280 : 180,
            background: showBanner 
              ? 'transparent' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '0 0 24px 24px',
            overflow: 'hidden',
          },
        }}
      >
        {showBanner && bannerData?.url && (
          <img
            src={bannerData.url}
            alt="Profile banner"
            onError={() => setBannerError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        
        {/* Gradient overlay */}
        <Box
          position="absolute"
          bottom
          left
          right
          height={100}
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
            },
          }}
        />
      </Box>

      {/* Profile Info Section */}
      <Box
        display="flex"
        direction="column"
        alignItems="center"
        marginTop={-12}
        paddingX={4}
      >
        {/* Avatar */}
        <Box
          dangerouslySetInlineStyle={{
            __style: {
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '50%',
            },
          }}
        >
          <UserAvatar
            imageId={user.imageId}
            name={user.username}
            size="xxl"
            outline
          />
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
    </Box>
  );
};

export default UserProfileHeader;