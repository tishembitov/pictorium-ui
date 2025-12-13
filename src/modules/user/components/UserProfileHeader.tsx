// src/modules/user/components/UserProfileHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Heading, Button, IconButton, Tooltip, TapArea } from 'gestalt';
import { buildPath, ROUTES } from '@/app/router/routeConfig';
import { UserAvatar } from './UserAvatar';
import { FollowButton } from './FollowButton';
import { useAuth } from '@/modules/auth';
import { useImageUrl } from '@/modules/storage';
import { useFollowers } from '../hooks/useFollowers';
import { useFollowing } from '../hooks/useFollowing';
import { formatCompactNumber } from '@/shared/utils/formatters';
import { 
  formatUsername, 
  hasSocialLinks, 
  getSocialUrls,
  getProfileCompletionPercentage,
} from '../utils/userUtils';
import type { UserResponse } from '../types/user.types';

interface UserProfileHeaderProps {
  user: UserResponse;
  pinsCount?: number;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  pinsCount = 0,
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;

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

  // Используем утилиты
  const formattedUsername = formatUsername(user.username);
  const socialUrls = getSocialUrls(user);
  const showSocialLinks = hasSocialLinks(user);
  const profileCompletion = getProfileCompletionPercentage(user);

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
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Box>
      {/* Banner */}
      <Box
        height={200}
        width="100%"
        color="secondary"
        rounding={4}
        overflow="hidden"
        position="relative"
      >
        {bannerData?.url && (
          <Box
            width="100%"
            height="100%"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundImage: `url(${bannerData.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              },
            }}
          />
        )}
      </Box>

      {/* Profile Info */}
      <Box
        display="flex"
        direction="column"
        alignItems="center"
        marginTop={-8}
        paddingX={4}
      >
        {/* Avatar */}
        <Box
          padding={1}
          color="default"
          rounding="circle"
        >
          <UserAvatar
            imageId={user.imageId}
            name={user.username}
            size="xl"
            outline
          />
        </Box>

        {/* Username */}
        <Box marginTop={3}>
          <Heading size="400" align="center">
            {user.username}
          </Heading>
          <Text align="center" color="subtle" size="200">
            {formattedUsername}
          </Text>
        </Box>

        {/* Profile completion hint for current user */}
        {isCurrentUser && profileCompletion < 100 && (
          <Box marginTop={2}>
            <Text size="100" color="subtle">
              Profile {profileCompletion}% complete
            </Text>
          </Box>
        )}

        {/* Description */}
        {user.description && (
          <Box marginTop={2} maxWidth={500}>
            <Text align="center" color="subtle">
              {user.description}
            </Text>
          </Box>
        )}

        {/* Stats */}
        <Box marginTop={4}>
          <Flex gap={6} justifyContent="center">
            <Flex direction="column" alignItems="center">
              <Text weight="bold" size="300">
                {formatCompactNumber(pinsCount)}
              </Text>
              <Text color="subtle" size="200">
                Pins
              </Text>
            </Flex>

            <TapArea onTap={handleFollowersClick}>
              <Flex direction="column" alignItems="center">
                <Text weight="bold" size="300">
                  {formatCompactNumber(followersCount)}
                </Text>
                <Text color="subtle" size="200">
                  Followers
                </Text>
              </Flex>
            </TapArea>

            <TapArea onTap={handleFollowingClick}>
              <Flex direction="column" alignItems="center">
                <Text weight="bold" size="300">
                  {formatCompactNumber(followingCount)}
                </Text>
                <Text color="subtle" size="200">
                  Following
                </Text>
              </Flex>
            </TapArea>
          </Flex>
        </Box>

        {/* Actions */}
        <Box marginTop={4}>
          <Flex gap={2}>
            {isCurrentUser ? (
              <>
                <Button
                  text="Edit profile"
                  onClick={handleEditProfile}
                  size="lg"
                  color="gray"
                />
                <IconButton
                  accessibilityLabel="Share profile"
                  icon="share"
                  size="lg"
                  bgColor="transparent"
                />
              </>
            ) : (
              <>
                <FollowButton userId={user.id} size="lg" />
                <IconButton
                  accessibilityLabel="Message"
                  icon="speech"
                  size="lg"
                  bgColor="transparent"
                />
              </>
            )}
          </Flex>
        </Box>

        {/* Social Links - используем getSocialUrls */}
        {showSocialLinks && (
          <Box marginTop={4}>
            <Flex gap={3} justifyContent="center">
              {socialUrls.instagram && (
                <Tooltip text="Instagram">
                  <IconButton
                    accessibilityLabel={`Instagram: ${user.instagram}`}
                    icon="visit"
                    size="md"
                    bgColor="transparent"
                    onClick={() => openSocialLink(socialUrls.instagram)}
                  />
                </Tooltip>
              )}
              {socialUrls.pinterest && (
                <Tooltip text="Pinterest">
                  <IconButton
                    accessibilityLabel={`Pinterest: ${user.pinterest}`}
                    icon="pinterest"
                    size="md"
                    bgColor="transparent"
                    onClick={() => openSocialLink(socialUrls.pinterest)}
                  />
                </Tooltip>
              )}
              {socialUrls.tiktok && (
                <Tooltip text="TikTok">
                  <IconButton
                    accessibilityLabel={`TikTok: ${user.tiktok}`}
                    icon="visit"
                    size="md"
                    bgColor="transparent"
                    onClick={() => openSocialLink(socialUrls.tiktok)}
                  />
                </Tooltip>
              )}
              {socialUrls.telegram && (
                <Tooltip text="Telegram">
                  <IconButton
                    accessibilityLabel={`Telegram: ${user.telegram}`}
                    icon="send"
                    size="md"
                    bgColor="transparent"
                    onClick={() => openSocialLink(socialUrls.telegram)}
                  />
                </Tooltip>
              )}
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserProfileHeader;