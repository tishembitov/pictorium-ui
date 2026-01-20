// src/modules/explore/components/ExploreSection.tsx

import React, { type ReactNode } from 'react';
import { Box, Flex, Heading, Text, TapArea, Icon } from 'gestalt';

interface ExploreSectionProps {
  title: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
  children: ReactNode;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({
  title,
  subtitle,
  showSeeAll = false,
  onSeeAllClick,
  children,
}) => {
  return (
    <Box paddingY={4}>
      {/* Section Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Box>
            <Heading size="400" accessibilityLevel={2}>
              {title}
            </Heading>
            {subtitle && (
              <Box marginTop={1}>
                <Text color="subtle" size="200">
                  {subtitle}
                </Text>
              </Box>
            )}
          </Box>

          {showSeeAll && onSeeAllClick && (
            <TapArea onTap={onSeeAllClick} rounding={2}>
              <Flex alignItems="center" gap={1}>
                <Text weight="bold" size="200">
                  See all
                </Text>
                <Icon
                  accessibilityLabel=""
                  icon="arrow-forward"
                  size={12}
                  color="dark"
                />
              </Flex>
            </TapArea>
          )}
        </Flex>
      </Box>

      {/* Section Content */}
      {children}
    </Box>
  );
};

export default ExploreSection;