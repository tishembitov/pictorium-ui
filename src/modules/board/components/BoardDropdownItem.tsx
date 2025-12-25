// src/modules/board/components/BoardDropdownItem.tsx

import React, { useState } from 'react';
import { Box, Flex, Text, Icon, Spinner, TapArea } from 'gestalt';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import type { BoardWithPinStatusResponse } from '../types/board.types';

interface BoardDropdownItemProps {
  board: BoardWithPinStatusResponse;
  onSelect: (board: BoardWithPinStatusResponse) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

/**
 * Profile option item for board dropdown
 */
interface ProfileDropdownItemProps {
  isSelected: boolean;
  isSavedToProfile: boolean;
  onSelect: () => void;
  isProcessing?: boolean;
}

export const ProfileDropdownItem: React.FC<ProfileDropdownItemProps> = ({
  isSelected,
  isSavedToProfile,
  onSelect,
  isProcessing = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const isDisabled = isProcessing || isSavedToProfile;

  return (
    <TapArea 
      onTap={() => !isDisabled && onSelect()} 
      rounding={3} 
      disabled={isDisabled}
    >
      <Box
        padding={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isSelected 
              ? 'rgba(230, 0, 35, 0.08)' 
              : isHovered && !isDisabled 
                ? '#e9e9e9' 
                : 'transparent',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'default' : 'pointer',
            border: isSelected ? '2px solid #e60023' : '2px solid transparent',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Profile Icon */}
          <Box
            width={48}
            height={48}
            rounding={2}
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon accessibilityLabel="" icon="person" size={24} color="default" />
          </Box>

          {/* Profile Info */}
          <Box flex="grow">
            <Text weight="bold" size="200">
              Profile
            </Text>
            <Text color="subtle" size="100">
              Save without board
            </Text>
          </Box>

          {/* Status */}
          {isProcessing && (
            <Spinner accessibilityLabel="Saving" show size="sm" />
          )}
          {isSavedToProfile && !isProcessing && (
            <Icon accessibilityLabel="Already saved" icon="check" size={16} color="subtle" />
          )}
          {isSelected && !isSavedToProfile && !isProcessing && (
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
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardDropdownItem: React.FC<BoardDropdownItemProps> = ({
  board,
  onSelect,
  isProcessing = false,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  const isDisabled = disabled || isProcessing || board.hasPin;

  return (
    <TapArea 
      onTap={() => !isDisabled && onSelect(board)} 
      rounding={3} 
      disabled={isDisabled}
    >
      <Box
        padding={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isHovered && !isDisabled ? '#e9e9e9' : 'transparent',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'default' : 'pointer',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Board Cover */}
          <Box
            width={48}
            height={48}
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
              } : {},
            }}
          >
            {!coverData?.url && (
              <Icon accessibilityLabel="" icon="board" size={20} color="subtle" />
            )}
          </Box>

          {/* Board Info */}
          <Box flex="grow">
            <Text weight="bold" size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {board.pinCount} pins
            </Text>
          </Box>

          {/* Status */}
          {isProcessing && (
            <Spinner accessibilityLabel="Saving" show size="sm" />
          )}
          {board.hasPin && !isProcessing && (
            <Icon accessibilityLabel="Already saved" icon="check" size={16} color="subtle" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export default BoardDropdownItem;