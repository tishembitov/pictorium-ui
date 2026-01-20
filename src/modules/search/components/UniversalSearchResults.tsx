// src/modules/search/components/UniversalSearchResults.tsx

import React from 'react';
import { Box, Flex, Text, Heading, TapArea, Icon, Divider, Spinner } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { SearchPinCard } from './SearchPinCard';
import { SearchUserCard } from './SearchUserCard';
import { SearchBoardCard } from './SearchBoardCard';
import { EmptyState } from '@/shared/components';
import { buildSearchUrl, formatTookTime } from '../utils/searchUtils';
import type { UniversalSearchResponse } from '../types/search.types';

interface UniversalSearchResultsProps {
  data: UniversalSearchResponse | undefined;
  isLoading: boolean;
  query: string;
}

export const UniversalSearchResults: React.FC<UniversalSearchResultsProps> = ({
  data,
  isLoading,
  query,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Searching" show size="lg" />
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const { pins, users, boards, totalPins, totalUsers, totalBoards, took } = data;
  const hasResults = pins.length > 0 || users.length > 0 || boards.length > 0;

  if (!hasResults) {
    return (
      <EmptyState
        title="No results found"
        description={`We couldn't find anything for "${query}". Try different keywords.`}
        icon="search"
      />
    );
  }

  const handleSeeAllPins = () => navigate(buildSearchUrl(query, { type: 'pins' }));
  const handleSeeAllUsers = () => navigate(buildSearchUrl(query, { type: 'users' }));
  const handleSeeAllBoards = () => navigate(buildSearchUrl(query, { type: 'boards' }));

  return (
    <Box>
      {/* Search info */}
      <Box marginBottom={4}>
        <Text size="100" color="subtle">
          Found results in {formatTookTime(took)}
        </Text>
      </Box>

      {/* Pins Section */}
      {pins.length > 0 && (
        <Box marginBottom={6}>
          <Flex justifyContent="between" alignItems="center" marginBottom={3}>
            <Heading size="400" accessibilityLevel={2}>
              Pins
              <Text inline color="subtle" size="200"> ({totalPins})</Text>
            </Heading>
            {data.hasMorePins && (
              <TapArea onTap={handleSeeAllPins}>
                <Flex alignItems="center" gap={1}>
                  <Text color="default" weight="bold" size="200">
                    See all
                  </Text>
                  <Icon accessibilityLabel="" icon="arrow-forward" size={12} />
                </Flex>
              </TapArea>
            )}
          </Flex>
          
          <Flex gap={4} wrap>
            {pins.slice(0, 4).map((pin) => (
              <Box key={pin.id} width={236}>
                <SearchPinCard pin={pin} />
              </Box>
            ))}
          </Flex>
        </Box>
      )}

      <Divider />

      {/* Users Section */}
      {users.length > 0 && (
        <Box marginY={6}>
          <Flex justifyContent="between" alignItems="center" marginBottom={3}>
            <Heading size="400" accessibilityLevel={2}>
              People
              <Text inline color="subtle" size="200"> ({totalUsers})</Text>
            </Heading>
            {data.hasMoreUsers && (
              <TapArea onTap={handleSeeAllUsers}>
                <Flex alignItems="center" gap={1}>
                  <Text color="default" weight="bold" size="200">
                    See all
                  </Text>
                  <Icon accessibilityLabel="" icon="arrow-forward" size={12} />
                </Flex>
              </TapArea>
            )}
          </Flex>
          
          <Flex direction="column" gap={2}>
            {users.slice(0, 3).map((user) => (
              <SearchUserCard key={user.id} user={user} />
            ))}
          </Flex>
        </Box>
      )}

      <Divider />

      {/* Boards Section */}
      {boards.length > 0 && (
        <Box marginY={6}>
          <Flex justifyContent="between" alignItems="center" marginBottom={3}>
            <Heading size="400" accessibilityLevel={2}>
              Boards
              <Text inline color="subtle" size="200"> ({totalBoards})</Text>
            </Heading>
            {data.hasMoreBoards && (
              <TapArea onTap={handleSeeAllBoards}>
                <Flex alignItems="center" gap={1}>
                  <Text color="default" weight="bold" size="200">
                    See all
                  </Text>
                  <Icon accessibilityLabel="" icon="arrow-forward" size={12} />
                </Flex>
              </TapArea>
            )}
          </Flex>
          
          <Flex gap={4} wrap>
            {boards.slice(0, 4).map((board) => (
              <Box key={board.id} width={200}>
                <SearchBoardCard board={board} />
              </Box>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default UniversalSearchResults;