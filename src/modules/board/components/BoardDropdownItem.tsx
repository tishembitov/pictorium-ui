// src/modules/board/components/BoardDropdownItem.tsx

import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Icon, Spinner, TapArea } from 'gestalt';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import type { BoardWithPinStatusResponse } from '../types/board.types';

interface BoardDropdownItemProps {
  board: BoardWithPinStatusResponse;
  onSelect: (board: BoardWithPinStatusResponse) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

interface ProfileDropdownItemProps {
  isSelected: boolean;
  isSavedToProfile: boolean;
  onSelect: () => void;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ==================== Types ====================

type ProfileDropdownItemSize = 'sm' | 'md' | 'lg';

// ==================== Profile Icon Styles (Pinterest Red Theme) ====================

interface ProfileIconStyle {
  background: string;
  boxShadow: string;
}

const PROFILE_ICON_DEFAULT: ProfileIconStyle = {
  background: 'linear-gradient(135deg, #e60023 0%, #c7001e 100%)',
  boxShadow: '0 2px 8px rgba(230, 0, 35, 0.35)',
};

const PROFILE_ICON_HOVER: ProfileIconStyle = {
  background: 'linear-gradient(135deg, #ff1a3d 0%, #e60023 100%)',
  boxShadow: '0 4px 12px rgba(230, 0, 35, 0.45)',
};

const PROFILE_ICON_SAVED: ProfileIconStyle = {
  background: 'linear-gradient(135deg, #0a7c42 0%, #059669 100%)',
  boxShadow: '0 2px 8px rgba(10, 124, 66, 0.35)',
};

const getProfileIconStyle = (isSaved: boolean, isHovered: boolean): ProfileIconStyle => {
  if (isSaved) return PROFILE_ICON_SAVED;
  if (isHovered) return PROFILE_ICON_HOVER;
  return PROFILE_ICON_DEFAULT;
};

const getIconContainerSize = (size: ProfileDropdownItemSize): number => {
  const sizeMap: Record<ProfileDropdownItemSize, number> = {
    sm: 36,
    md: 48,
    lg: 56,
  };
  return sizeMap[size];
};

const getIconSize = (size: ProfileDropdownItemSize): 16 | 20 | 24 => {
  const sizeMap: Record<ProfileDropdownItemSize, 16 | 20 | 24> = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  return sizeMap[size];
};

// ==================== Shared Helpers ====================

/**
 * Returns background color for dropdown items based on state.
 * Used by both ProfileDropdownItem and BoardDropdownItem.
 */
const getItemBackgroundColor = (
  isSelected: boolean,
  isHovered: boolean,
  isDisabled: boolean
): string => {
  if (isSelected) {
    return 'rgba(230, 0, 35, 0.08)';
  }
  if (isHovered && !isDisabled) {
    return '#f5f5f5';
  }
  return 'transparent';
};

// ==================== ProfileDropdownItem ====================

export const ProfileDropdownItem: React.FC<ProfileDropdownItemProps> = ({
  isSelected,
  isSavedToProfile,
  onSelect,
  isProcessing = false,
  size = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const isDisabled = isProcessing;
  const containerSize = getIconContainerSize(size);
  const iconSize = getIconSize(size);
  const iconStyle = getProfileIconStyle(isSavedToProfile, isHovered);
  const backgroundColor = getItemBackgroundColor(isSelected, isHovered, isDisabled);

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
            backgroundColor,
            opacity: isDisabled ? 0.7 : 1,
            cursor: isDisabled ? 'default' : 'pointer',
            border: isSelected ? '2px solid #e60023' : '2px solid transparent',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Profile Icon with Red Gradient */}
          <Box
            width={containerSize}
            height={containerSize}
            rounding={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                ...iconStyle,
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Icon 
              accessibilityLabel="" 
              icon="person" 
              size={iconSize} 
              color="inverse" 
            />
          </Box>

          {/* Profile Info */}
          <Box flex="grow">
            <Text weight={isSelected ? 'bold' : 'normal'} size="200">
              Profile
            </Text>
            <Text color="subtle" size="100">
              {isSavedToProfile ? 'Already saved' : 'Save without board'}
            </Text>
          </Box>

          {/* Status Indicators */}
          <Box minWidth={60} display="flex" justifyContent="end">
            {isProcessing && (
              <Spinner accessibilityLabel="Saving" show size="sm" />
            )}
            {isSavedToProfile && !isProcessing && (
              <Box
                rounding="circle"
                padding={1}
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: 'rgba(10, 124, 66, 0.1)',
                  },
                }}
              >
                <Icon 
                  accessibilityLabel="Saved to profile" 
                  icon="check-circle" 
                  size={20} 
                  color="success" 
                />
              </Box>
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
          </Box>
        </Flex>
      </Box>
    </TapArea>
  );
};

// ==================== BoardDropdownItem ====================

export const BoardDropdownItem: React.FC<BoardDropdownItemProps> = ({
  board,
  onSelect,
  isProcessing = false,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const isSelected = selectedBoard?.id === board.id;
  
  // ✅ Используем refetch для обновления данных
  const { pins, refetch } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  
  // ✅ Refetch при монтировании для актуальных данных
  useEffect(() => {
    refetch();
  }, [refetch]);

  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  const isDisabled = disabled || isProcessing;
  const alreadySaved = board.hasPin;
  const isClickDisabled = isDisabled || alreadySaved;
  const backgroundColor = getItemBackgroundColor(isSelected, isHovered, isClickDisabled);

  return (
    <TapArea 
      onTap={() => !isClickDisabled && onSelect(board)} 
      rounding={3} 
      disabled={isClickDisabled}
    >
      <Box
        padding={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor,
            opacity: isClickDisabled ? 0.6 : 1,
            cursor: isClickDisabled ? 'default' : 'pointer',
            border: isSelected ? '2px solid #e60023' : '2px solid transparent',
            transition: 'all 0.15s ease',
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
              } : {
                background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
              },
            }}
          >
            {!coverData?.url && (
              <Icon accessibilityLabel="" icon="board" size={20} color="subtle" />
            )}
          </Box>

          {/* Board Info - ✅ используем board.pinCount из props */}
          <Box flex="grow">
            <Text weight={isSelected ? 'bold' : 'normal'} size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {board.pinCount} {board.pinCount === 1 ? 'pin' : 'pins'}
            </Text>
          </Box>

          {/* Status */}
          <Box minWidth={60} display="flex" justifyContent="end">
            {isProcessing && (
              <Spinner accessibilityLabel="Saving" show size="sm" />
            )}
            {alreadySaved && !isProcessing && (
              <Box
                rounding="circle"
                padding={1}
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: 'rgba(10, 124, 66, 0.1)',
                  },
                }}
              >
                <Icon 
                  accessibilityLabel="Already saved" 
                  icon="check-circle" 
                  size={20} 
                  color="success" 
                />
              </Box>
            )}
            {isSelected && !alreadySaved && !isProcessing && (
              <Icon accessibilityLabel="Selected" icon="check" size={16} color="success" />
            )}
          </Box>
        </Flex>
      </Box>
    </TapArea>
  );
};

export default BoardDropdownItem;