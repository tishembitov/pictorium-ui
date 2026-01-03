// src/modules/board/components/BoardItem.tsx

import React, { useState } from 'react';
import { Box, Flex, Text, TapArea, Icon, Spinner } from 'gestalt';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import type { BoardResponse, BoardWithPinStatusResponse } from '../types/board.types';

interface BoardItemProps {
  board: BoardResponse | BoardWithPinStatusResponse;
  isSelected?: boolean;
  onSelect: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
  size?: 'sm' | 'md';
  showSaveButton?: boolean;
}

export const BoardItem: React.FC<BoardItemProps> = ({ 
  board, 
  isSelected = false, 
  onSelect,
  disabled = false,
  isProcessing = false,
  size = 'md',
  showSaveButton = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get cover image
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  // Check if pin is already in this board
  const hasPin = 'hasPin' in board ? board.hasPin : false;
  const pinCount = 'pinCount' in board ? board.pinCount : 0;
  
  const isDisabled = disabled || isProcessing;
  // ✅ hasPin означает что пин уже сохранен - показываем как недоступный для повторного сохранения
  const isAlreadySaved = hasPin && !isProcessing;

  const coverSize = size === 'sm' ? 40 : 48;

  return (
    <TapArea 
      onTap={() => !isDisabled && !isAlreadySaved && onSelect()} 
      rounding={3} 
      disabled={isDisabled || isAlreadySaved}
    >
      <Box
        padding={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isAlreadySaved
              ? 'rgba(0, 128, 0, 0.08)'  // ✅ Зеленоватый фон для сохраненных
              : isSelected 
                ? 'rgba(230, 0, 35, 0.08)' 
                : isHovered && !isDisabled 
                  ? '#f5f5f5' 
                  : 'transparent',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled || isAlreadySaved ? 'default' : 'pointer',
            border: isSelected && !isAlreadySaved 
              ? '2px solid #e60023' 
              : isAlreadySaved 
                ? '2px solid #00a650'
                : '2px solid transparent',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Board Cover */}
          <Box
            width={coverSize}
            height={coverSize}
            rounding={2}
            overflow="hidden"
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: coverData?.url ? {
                backgroundImage: `url(${coverData.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {
                background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
              },
            }}
          >
            {!coverData?.url && (
              <Icon accessibilityLabel="" icon="board" size={size === 'sm' ? 16 : 20} color="subtle" />
            )}
          </Box>

          {/* Board Info */}
          <Box flex="grow">
            <Text weight={isSelected || isAlreadySaved ? 'bold' : 'normal'} size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
            </Text>
          </Box>

          {/* Status */}
          <Box minWidth={60} display="flex" justifyContent="end">
            {isProcessing && (
              <Spinner accessibilityLabel="Saving" show size="sm" />
            )}
            {isAlreadySaved && !isProcessing && (
              <Flex alignItems="center" gap={1}>
                <Icon accessibilityLabel="Saved" icon="check-circle" size={16} color="success" />
                <Text size="100" color="success" weight="bold">
                  Saved
                </Text>
              </Flex>
            )}
            {showSaveButton && isSelected && !isAlreadySaved && !isProcessing && (
              <Box
                color="primary"
                rounding="pill"
                paddingX={2}
                paddingY={1}
              >
                <Text size="100" color="inverse" weight="bold">
                  Default
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
    </TapArea>
  );
};

export default BoardItem;