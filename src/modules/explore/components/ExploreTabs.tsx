// src/modules/explore/components/ExploreTabs.tsx

import React from 'react';
import { Box, Flex, TapArea, Text } from 'gestalt';
import { EXPLORE_TABS, type ExploreTab } from '../types/explore.types';

interface ExploreTabsProps {
  activeTab: ExploreTab;
  onTabChange: (tab: ExploreTab) => void;
}

export const ExploreTabs: React.FC<ExploreTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <Box marginBottom={4}>
      <Flex gap={2} justifyContent="center">
        {EXPLORE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <TapArea
              key={tab.id}
              onTap={() => onTabChange(tab.id)}
              rounding="pill"
            >
              <Box
                paddingX={4}
                paddingY={3}
                rounding="pill"
                color={isActive ? 'dark' : 'transparent'}
                dangerouslySetInlineStyle={{
                  __style: {
                    transition: 'all 0.2s ease',
                    border: isActive ? 'none' : '1px solid transparent',
                  },
                }}
              >
                <Text
                  weight="bold"
                  size="200"
                  color={isActive ? 'inverse' : 'default'}
                >
                  {tab.label}
                </Text>
              </Box>
            </TapArea>
          );
        })}
      </Flex>
    </Box>
  );
};

export default ExploreTabs;