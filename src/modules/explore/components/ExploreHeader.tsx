// src/modules/explore/components/ExploreHeader.tsx

import React from 'react';
import { Box, Flex, Heading, SearchField } from 'gestalt';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

interface ExploreHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}) => {
  const isMobile = useIsMobile();

  const handleKeyDown = ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
    if (event.key === 'Enter' && searchValue.trim() && onSearchSubmit) {
      onSearchSubmit(searchValue.trim());
    }
  };

  return (
    <Box marginBottom={4}>
      <Flex
        direction={isMobile ? 'column' : 'row'}
        justifyContent="between"
        alignItems={isMobile ? 'start' : 'center'}
        gap={3}
      >
        <Heading size="400" accessibilityLevel={1}>
          Explore
        </Heading>

        <Box width={isMobile ? '100%' : 320}>
          <SearchField
            id="explore-search"
            accessibilityLabel="Search ideas"
            accessibilityClearButtonLabel="Clear"
            placeholder="Search for ideas..."
            value={searchValue}
            onChange={({ value }) => onSearchChange(value)}
            onKeyDown={handleKeyDown}
          />
        </Box>
      </Flex>
    </Box>
  );
};

export default ExploreHeader;