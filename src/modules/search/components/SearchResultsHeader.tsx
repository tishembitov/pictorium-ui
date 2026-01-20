// src/modules/search/components/SearchResultsHeader.tsx

import React from 'react';
import { Box, Flex, Text, Icon } from 'gestalt';
import { formatTookTime, formatTotalHits } from '../utils/searchUtils';

interface SearchResultsHeaderProps {
  query: string;
  totalHits: number;
  took: number;
  type?: 'pins' | 'users' | 'boards' | 'all';
  isLoading?: boolean;
}

export const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  query,
  totalHits,
  took,
  type = 'all',
  isLoading = false,
}) => {
  const getTypeLabel = () => {
    switch (type) {
      case 'pins': return 'pins';
      case 'users': return 'users';
      case 'boards': return 'boards';
      default: return 'results';
    }
  };

  if (isLoading) {
    return (
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={2}>
          <Icon accessibilityLabel="" icon="search" size={20} color="subtle" />
          <Text color="subtle">
            Searching for &quot;{query}&quot;...
          </Text>
        </Flex>
      </Box>
    );
  }

  if (totalHits === 0) {
    return (
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={2}>
          <Icon accessibilityLabel="" icon="search" size={20} color="subtle" />
          <Text>
            No {getTypeLabel()} found for &quot;<Text weight="bold" inline>{query}</Text>&quot;
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box marginBottom={4}>
      <Flex alignItems="center" justifyContent="between" wrap>
        <Flex alignItems="center" gap={2}>
          <Icon accessibilityLabel="" icon="search" size={20} color="default" />
          <Text>
            <Text weight="bold" inline>{formatTotalHits(totalHits)}</Text>
            {' '}{getTypeLabel()} for &quot;<Text weight="bold" inline>{query}</Text>&quot;
          </Text>
        </Flex>
        
        <Text size="100" color="subtle">
          {formatTookTime(took)}
        </Text>
      </Flex>
    </Box>
  );
};

export default SearchResultsHeader;