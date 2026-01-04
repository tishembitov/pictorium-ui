// src/modules/board/components/BoardListItem.tsx

import React, { useState } from 'react';
import { Box, Flex, Text, TapArea, Spinner, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import { buildPath } from '@/app/router/routeConfig';
import { BoardPreviewImage } from './BoardPreviewImage';
import type { BoardWithPinStatusResponse } from '../types/board.types';

type BoardListItemSize = 'sm' | 'md';

// Gestalt Padding type
type Padding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Rounding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'circle' | 'pill';

interface BoardListItemProps {
  board: BoardWithPinStatusResponse;
  onSave: () => void;
  onRemove: () => void;
  isSaving: boolean;
  isRemoving: boolean;
  size?: BoardListItemSize;
}

interface SizeConfig {
  padding: Padding;
  imageSize: number;
  titleSize: '200' | '300';
  subtitleSize: '100' | '200';
  buttonPaddingX: Padding;
  buttonPaddingY: Padding;
  buttonFontSize: '100' | '200';
  iconSize: 12 | 14 | 16 | 20 | 24;
  minButtonWidth: number;
  rounding: Rounding;
  gap: 1 | 2 | 3 | 4 | 5 | 6;
}

const sizeConfig: Record<BoardListItemSize, SizeConfig> = {
  sm: {
    padding: 2,
    imageSize: 36,
    titleSize: '200',
    subtitleSize: '100',
    buttonPaddingX: 2,
    buttonPaddingY: 1,
    buttonFontSize: '100',
    iconSize: 12,
    minButtonWidth: 70,
    rounding: 2,
    gap: 2,
  },
  md: {
    padding: 3,
    imageSize: 48,
    titleSize: '300',
    subtitleSize: '200',
    buttonPaddingX: 3,
    buttonPaddingY: 2,
    buttonFontSize: '200',
    iconSize: 14,
    minButtonWidth: 90,
    rounding: 3,
    gap: 3,
  },
};

export const BoardListItem: React.FC<BoardListItemProps> = ({
  board,
  onSave,
  onRemove,
  isSaving,
  isRemoving,
  size = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isProcessing = isSaving || isRemoving;
  const config = sizeConfig[size];

  const boardLink = buildPath.board(board.id);

  const renderBoardPreview = () => (
    <BoardPreviewImage boardId={board.id} size={config.imageSize} />
  );

  const renderBoardInfo = () => (
    <>
      <Text weight="bold" size={config.titleSize} lineClamp={1}>
        {board.title}
      </Text>
      <Text color="subtle" size={config.subtitleSize}>
        {board.pinCount} pins
      </Text>
    </>
  );

  const renderActionButton = () => {
    if (isProcessing) {
      return (
        <Box paddingX={config.buttonPaddingX}>
          <Spinner accessibilityLabel="Processing" show size="sm" />
        </Box>
      );
    }

    if (board.hasPin) {
      return (
        <TapArea onTap={onRemove} rounding={2}>
          <Box
            paddingX={config.buttonPaddingX}
            paddingY={config.buttonPaddingY}
            rounding={2}
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: isHovered ? 'rgba(180, 0, 0, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: isHovered ? '#b40000' : '#cdcdcd',
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Flex alignItems="center" gap={1}>
              <Icon
                accessibilityLabel=""
                icon="check"
                size={config.iconSize}
                color={isHovered ? 'error' : 'success'}
              />
              <Text
                size={config.buttonFontSize}
                weight="bold"
                color={isHovered ? 'error' : 'success'}
              >
                {isHovered ? 'Remove' : 'Saved'}
              </Text>
            </Flex>
          </Box>
        </TapArea>
      );
    }

    return (
      <TapArea onTap={onSave} rounding={2}>
        <Box
          paddingX={config.buttonPaddingX}
          paddingY={config.buttonPaddingY}
          rounding={2}
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: isHovered ? '#e60023' : 'transparent',
              border: '1px solid',
              borderColor: isHovered ? '#e60023' : '#cdcdcd',
              transition: 'all 0.15s ease',
            },
          }}
        >
          <Text
            size={config.buttonFontSize}
            weight="bold"
            color={isHovered ? 'inverse' : 'default'}
          >
            Save
          </Text>
        </Box>
      </TapArea>
    );
  };

  return (
    <Box
      padding={config.padding}
      rounding={config.rounding}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: board.hasPin
            ? 'rgba(0, 132, 80, 0.06)'
            : isHovered
            ? 'rgba(0, 0, 0, 0.04)'
            : 'transparent',
          transition: 'background-color 0.15s ease',
        },
      }}
    >
      <Flex alignItems="center" gap={config.gap}>
        {/* Board preview - link if saved */}
        {board.hasPin ? (
          <Link
            to={boardLink}
            style={{ textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderBoardPreview()}
          </Link>
        ) : (
          renderBoardPreview()
        )}

        {/* Board info */}
        <Box flex="grow">
          {board.hasPin ? (
            <Link
              to={boardLink}
              style={{ textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {renderBoardInfo()}
            </Link>
          ) : (
            renderBoardInfo()
          )}
        </Box>

        {/* Action button */}
        <Box minWidth={config.minButtonWidth} display="flex" justifyContent="end">
          {renderActionButton()}
        </Box>
      </Flex>
    </Box>
  );
};

export default BoardListItem;