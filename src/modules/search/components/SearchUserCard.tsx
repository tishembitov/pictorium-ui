// src/modules/search/components/SearchUserCard.tsx

import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text, TapArea } from 'gestalt';
import { buildPath } from '@/app/router/routes';
import { UserAvatar, FollowButton } from '@/modules/user';
import { useAuth } from '@/modules/auth';
import { formatCompactNumber } from '@/shared/utils/formatters';
import { getHighlightedText } from '../utils/searchUtils';
import type { UserSearchResult } from '../types/search.types';

interface SearchUserCardProps {
  user: UserSearchResult;
  showHighlights?: boolean;
  showFollowButton?: boolean;
}

export const SearchUserCard: React.FC<SearchUserCardProps> = ({
  user,
  showHighlights = true,
  showFollowButton = true,
}) => {
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;

  const displayUsername = showHighlights && user.highlights
    ? getHighlightedText(user.highlights, 'username', user.username)
    : user.username;

  const displayDescription = showHighlights && user.highlights
    ? getHighlightedText(user.highlights, 'description', user.description)
    : user.description;

  // Fixed: proper event handler for stopping propagation
  const handleFollowAreaTap = useCallback(() => {
    // TapArea handles the click, FollowButton will handle its own click
  }, []);

  return (
    <Link to={buildPath.profile(user.username)} style={{ textDecoration: 'none' }}>
      <TapArea rounding={4}>
        <Box
          padding={3}
          rounding={4}
          dangerouslySetInlineStyle={{
            __style: {
              transition: 'background-color 0.15s ease',
            },
          }}
        >
          <Flex alignItems="center" gap={3}>
            <UserAvatar
              imageId={user.imageId}
              name={user.username}
              size="lg"
            />
            
            <Box flex="grow" minWidth={0}>
              <Text weight="bold" size="300">
                <span dangerouslySetInnerHTML={{ __html: displayUsername }} />
              </Text>
              
              {displayDescription && (
                <Text color="subtle" size="200" lineClamp={2}>
                  <span dangerouslySetInnerHTML={{ __html: displayDescription }} />
                </Text>
              )}
              
              <Box marginTop={1}>
                <Flex gap={3}>
                  <Text size="100" color="subtle">
                    {formatCompactNumber(user.followerCount)} followers
                  </Text>
                  <Text size="100" color="subtle">
                    {formatCompactNumber(user.pinCount)} pins
                  </Text>
                </Flex>
              </Box>
            </Box>
            
            {showFollowButton && !isCurrentUser && (
              <TapArea onTap={handleFollowAreaTap} tapStyle="none">
                <FollowButton 
                  userId={user.id} 
                  username={user.username}
                  size="sm" 
                />
              </TapArea>
            )}
          </Flex>
        </Box>
      </TapArea>
    </Link>
  );
};

export default SearchUserCard;