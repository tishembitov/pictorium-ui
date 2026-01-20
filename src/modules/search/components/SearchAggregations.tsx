// src/modules/search/components/SearchAggregations.tsx

import React from 'react';
import { Box, Flex, Text, TapArea } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { TagChip } from '@/modules/tag';
import { UserAvatar } from '@/modules/user';
import type { Aggregations } from '../types/search.types';
import { buildPath } from '@/app/router/routes';

interface SearchAggregationsProps {
  aggregations: Aggregations | undefined;
  onTagClick?: (tag: string) => void;
  onAuthorClick?: (authorId: string) => void;
  compact?: boolean;
}

export const SearchAggregations: React.FC<SearchAggregationsProps> = ({
  aggregations,
  onTagClick,
  onAuthorClick,
  compact = false,
}) => {
  const navigate = useNavigate();

  if (!aggregations) return null;

  const { topTags, topAuthors } = aggregations;
  const hasTags = topTags && topTags.length > 0;
  const hasAuthors = topAuthors && topAuthors.length > 0;

  if (!hasTags && !hasAuthors) return null;

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      navigate(`/search?q=${encodeURIComponent(tag)}`);
    }
  };

  const handleAuthorClick = (authorId: string, username: string) => {
    if (onAuthorClick) {
      onAuthorClick(authorId);
    } else {
      navigate(buildPath.profile(username));
    }
  };

  if (compact) {
    return (
      <Flex gap={2} wrap>
        {topTags?.slice(0, 5).map((item) => (
          <TagChip
            key={item.tag}
            tag={item.tag}
            size="sm"
            onClick={() => handleTagClick(item.tag)}
          />
        ))}
      </Flex>
    );
  }

  return (
    <Box>
      {/* Top Tags */}
      {hasTags && (
        <Box marginBottom={4}>
          <Text weight="bold" size="200" color="subtle">
            Related Tags
          </Text>
          <Box marginTop={2}>
            <Flex gap={2} wrap>
              {topTags.slice(0, 10).map((item) => (
                <TapArea
                  key={item.tag}
                  onTap={() => handleTagClick(item.tag)}
                  rounding={2}
                >
                  <Box
                    padding={2}
                    rounding={2}
                    color="secondary"
                    display="flex"
                    alignItems="center"
                  >
                    <Flex gap={1} alignItems="center">
                      <Text size="200" weight="bold">
                        {item.tag}
                      </Text>
                      <Text size="100" color="subtle">
                        ({item.count})
                      </Text>
                    </Flex>
                  </Box>
                </TapArea>
              ))}
            </Flex>
          </Box>
        </Box>
      )}

      {/* Top Authors */}
      {hasAuthors && (
        <Box>
          <Text weight="bold" size="200" color="subtle">
            Top Creators
          </Text>
          <Box marginTop={2}>
            <Flex gap={3} wrap>
              {topAuthors.slice(0, 5).map((item) => (
                <TapArea
                  key={item.authorId}
                  onTap={() => handleAuthorClick(item.authorId, item.authorUsername)}
                  rounding="circle"
                >
                  <Flex alignItems="center" gap={2}>
                    <UserAvatar
                      name={item.authorUsername}
                      size="sm"
                    />
                    <Flex direction="column">
                      <Text size="200" weight="bold">
                        {item.authorUsername}
                      </Text>
                      <Text size="100" color="subtle">
                        {item.count} pins
                      </Text>
                    </Flex>
                  </Flex>
                </TapArea>
              ))}
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SearchAggregations;