// src/modules/board/components/BoardPickerItem.tsx

import React, { useState } from 'react';
import { Box, Flex, Text, TapArea, Icon } from 'gestalt';
import { BoardPreviewImage } from './BoardPreviewImage';
import type { BoardResponse } from '../types/board.types';

type BoardPickerItemSize = 'sm' | 'md';

type Padding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Rounding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'circle' | 'pill';

interface BoardPickerItemProps {
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
  pinCount?: number;
  size?: BoardPickerItemSize;
}

interface SizeConfig {
  padding: Padding;
  imageSize: number;
  titleSize: '200' | '300';
  subtitleSize: '100' | '200';
  checkIconSize: 12 | 14 | 16 | 20 | 24;
  rounding: Rounding;
  gap: 2 | 3;
}

const sizeConfig: Record<BoardPickerItemSize, SizeConfig> = {
  sm: {
    padding: 2,
    imageSize: 36,
    titleSize: '200',
    subtitleSize: '100',
    checkIconSize: 16,
    rounding: 2,
    gap: 2,
  },
  md: {
    padding: 3,
    imageSize: 48,
    titleSize: '300',
    subtitleSize: '200',
    checkIconSize: 20,
    rounding: 3,
    gap: 3,
  },
};

export const BoardPickerItem: React.FC<BoardPickerItemProps> = ({
  board,
  isSelected,
  onSelect,
  pinCount,
  size = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];

  return (
    <TapArea onTap={onSelect} rounding={config.rounding}>
      <Box
        padding={config.padding}
        rounding={config.rounding}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isSelected
              ? 'rgba(0, 0, 0, 0.08)'
              : isHovered
              ? 'rgba(0, 0, 0, 0.04)'
              : 'transparent',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={config.gap}>
          {/* Board Preview */}
          <BoardPreviewImage boardId={board.id} size={config.imageSize} />

          {/* Board Info */}
          <Box flex="grow">
            <Text weight="bold" size={config.titleSize} lineClamp={1}>
              {board.title}
            </Text>
            {pinCount !== undefined && (
              <Text color="subtle" size={config.subtitleSize}>
                {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
              </Text>
            )}
          </Box>

          {/* Selected Indicator */}
          {isSelected && (
            <Icon
              accessibilityLabel="Selected"
              icon="check"
              size={config.checkIconSize}
              color="default"
            />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export default BoardPickerItem;