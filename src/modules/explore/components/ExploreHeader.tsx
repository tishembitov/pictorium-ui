// src/modules/explore/components/ExploreHeader.tsx

import React from 'react';
import { Box, Heading, Text } from 'gestalt';

export const ExploreHeader: React.FC = () => {
  return (
    <Box marginBottom={4}>
      <Heading size="400" accessibilityLevel={1}>
        Explore
      </Heading>
      <Box marginTop={2}>
        <Text color="subtle" size="300">
          Discover new ideas and inspiration
        </Text>
      </Box>
    </Box>
  );
};

export default ExploreHeader;