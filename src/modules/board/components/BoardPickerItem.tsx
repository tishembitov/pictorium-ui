// src/modules/board/components/BoardPickerItem.tsx

import React, { useState } from 'react';
import { Box, Flex, Text, TapArea, Icon } from 'gestalt';
import { BoardPreviewImage } from './BoardPreviewImage';
import type { BoardResponse } from '../types/board.types';

interface BoardPickerItemProps {
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
  pinCount?: number;
}

export const BoardPickerItem: React.FC<BoardPickerItemProps> = ({
  board,
  isSelected,
  onSelect,
  pinCount,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TapArea onTap={onSelect} rounding={3}>
      <Box
        padding={3}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isSelected
              ? 'rgba(0, 0, 0, 0.08)'
              : isHovered
              ? 'rgba(0, 0, 0, 0.04)'
              : 'transparent',
            border: isSelected ? '2px solid #111' : '2px solid transparent',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          <BoardPreviewImage boardId={board.id} size={48} />

          <Box flex="grow">
            <Text weight="bold" size="300" lineClamp={1}>
              {board.title}
            </Text>
            {pinCount !== undefined && (
              <Text color="subtle" size="200">
                {pinCount} pins
              </Text>
            )}
          </Box>

          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={20} color="default" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export default BoardPickerItem;