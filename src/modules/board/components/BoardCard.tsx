// src/modules/board/components/BoardCard.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, TapArea, Mask, IconButton, Icon, Flex } from 'gestalt';
import { buildPath } from '@/app/router/routes';
import { useImageUrl } from '@/modules/storage';
import { useBoardPins } from '../hooks/useBoardPins';
import { useIsOwner } from '@/modules/auth';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import type { BoardResponse } from '../types/board.types';

interface BoardCardProps {
  board: BoardResponse;
  onClick?: () => void;
  onEdit?: () => void;
  showMeta?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSelectIndicator?: boolean;
  /** Override pin count (for search results) */
  pinCount?: number;
  /** Preview image ID (for search results) */
  previewImageId?: string | null;
  /** Highlighted title HTML (from search) */
  highlightedTitle?: string;
  /** Owner username (for search results) */
  ownerUsername?: string;
}

// Pinterest-style коллаж из изображений
const BoardCoverCollage: React.FC<{
  images: Array<{ id: string; url?: string }>;
  height: number;
  isSelected?: boolean;
}> = ({ images, height, isSelected }) => {
  const hasMultiple = images.length > 1;
  const gap = 2;

  if (images.length === 0) {
    return (
      <Box
        height={height}
        color="secondary"
        display="flex"
        alignItems="center"
        justifyContent="center"
        rounding={4}
        dangerouslySetInlineStyle={{
          __style: {
            border: isSelected ? '3px solid var(--color-primary)' : undefined,
          },
        }}
      >
        <Flex direction="column" alignItems="center" gap={2}>
          <Icon accessibilityLabel="" icon="board" size={32} color="subtle" />
          <Text color="subtle" size="200">
            No pins yet
          </Text>
        </Flex>
      </Box>
    );
  }

  const [img1, img2, img3] = images;

  // Один пин - одно большое изображение
  if (!hasMultiple && img1?.url) {
    return (
      <Box 
        height={height} 
        rounding={4} 
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: {
            border: isSelected ? '3px solid var(--color-primary)' : undefined,
          },
        }}
      >
        <img
          src={img1.url}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
    );
  }

  // Pinterest-style коллаж
  return (
    <Box 
      height={height} 
      display="flex" 
      rounding={4} 
      overflow="hidden"
      dangerouslySetInlineStyle={{
        __style: { 
          gap: `${gap}px`,
          border: isSelected ? '3px solid var(--color-primary)' : undefined,
        },
      }}
    >
      <Box 
        width="66%" 
        height="100%"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundImage: img1?.url ? `url(${img1.url})` : undefined,
            backgroundColor: img1?.url ? undefined : 'var(--bg-secondary)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px 0 0 16px',
          },
        }}
      />
      <Box 
        width="34%"
        display="flex"
        direction="column"
        dangerouslySetInlineStyle={{
          __style: { gap: `${gap}px` },
        }}
      >
        <Box
          flex="grow"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundImage: img2?.url ? `url(${img2.url})` : undefined,
              backgroundColor: img2?.url ? undefined : 'var(--bg-secondary)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '0 16px 0 0',
            },
          }}
        />
        <Box
          flex="grow"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundImage: img3?.url ? `url(${img3.url})` : undefined,
              backgroundColor: img3?.url ? undefined : 'var(--bg-secondary)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '0 0 16px 0',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onEdit,
  showMeta = true,
  size = 'md',
  showSelectIndicator = true,
  pinCount: externalPinCount,
  previewImageId,
  highlightedTitle,
  ownerUsername,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = useIsOwner(board.userId);
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  
  const isSelected = isOwner && selectedBoard?.id === board.id;

  // Use external pin count if provided, otherwise fetch
  const shouldFetchPins = externalPinCount === undefined && !previewImageId;
  
  const { pins, totalElements: fetchedPinCount } = useBoardPins(board.id, {
    pageable: { page: 0, size: 3 },
    enabled: shouldFetchPins,
  });

  const displayPinCount = externalPinCount ?? fetchedPinCount;

  // Get image URLs
  const imageIds = useMemo(() => {
    if (previewImageId) {
      return [previewImageId];
    }
    return pins.slice(0, 3).map(pin => pin.thumbnailId || pin.imageId);
  }, [pins, previewImageId]);

  const { data: img1Data } = useImageUrl(imageIds[0], { enabled: !!imageIds[0] });
  const { data: img2Data } = useImageUrl(imageIds[1], { enabled: !!imageIds[1] });
  const { data: img3Data } = useImageUrl(imageIds[2], { enabled: !!imageIds[2] });

  const coverImages = useMemo(() => [
    { id: imageIds[0] || '', url: img1Data?.url },
    { id: imageIds[1] || '', url: img2Data?.url },
    { id: imageIds[2] || '', url: img3Data?.url },
  ].filter(img => img.url), [imageIds, img1Data, img2Data, img3Data]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleEditClick = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm': return { height: 120, titleSize: '200' as const };
      case 'lg': return { height: 200, titleSize: '400' as const };
      default: return { height: 160, titleSize: '300' as const };
    }
  }, [size]);

  // Render title with optional highlights
  const renderTitle = () => {
    if (highlightedTitle) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedTitle }} />;
    }
    return board.title;
  };

  const content = (
    <Box
      position="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      dangerouslySetInlineStyle={{
        __style: {
          transition: 'transform 0.2s ease',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        },
      }}
    >
      <Mask rounding={4}>
        <Box
          dangerouslySetInlineStyle={{
            __style: {
              transition: 'filter 0.2s ease',
              filter: isHovered ? 'brightness(0.92)' : 'brightness(1)',
            },
          }}
        >
          <BoardCoverCollage 
            images={coverImages} 
            height={dimensions.height}
            isSelected={showSelectIndicator && isSelected}
          />
        </Box>
      </Mask>

      {/* Selected Badge */}
      {showSelectIndicator && isSelected && (
        <Box position="absolute" top left padding={2}>
          <Box
            color="primary"
            rounding="pill"
            paddingX={2}
            paddingY={1}
            display="flex"
            alignItems="center"
          >
            <Flex alignItems="center" gap={1}>
              <Icon accessibilityLabel="" icon="check" size={12} color="inverse" />
              <Text size="100" color="inverse" weight="bold">
                Active
              </Text>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Hover Overlay */}
      {isHovered && isOwner && onEdit && (
        <Box
          position="absolute"
          top
          right
          bottom
          left
          display="flex"
          justifyContent="end"
          padding={2}
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%)',
              borderRadius: '16px',
            },
          }}
        >
          <IconButton
            accessibilityLabel="Edit board"
            icon="edit"
            size="sm"
            bgColor="white"
            onClick={handleEditClick}
          />
        </Box>
      )}

      {/* Board Info */}
      <Box paddingY={2}>
        <Flex direction="column" gap={1}>
          <Text weight="bold" size={dimensions.titleSize} lineClamp={1}>
            {renderTitle()}
          </Text>
          {showMeta && (
            <Flex alignItems="center" gap={2}>
              <Text color="subtle" size="100">
                {displayPinCount} {displayPinCount === 1 ? 'Pin' : 'Pins'}
              </Text>
              {ownerUsername && (
                <>
                  <Text color="subtle" size="100">•</Text>
                  <Text color="subtle" size="100">
                    @{ownerUsername}
                  </Text>
                </>
              )}
              {isSelected && !showSelectIndicator && (
                <>
                  <Text color="subtle" size="100">•</Text>
                  <Text color="success" size="100" weight="bold">
                    Saving here
                  </Text>
                </>
              )}
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );

  if (onClick) {
    return (
      <TapArea onTap={onClick} rounding={4}>
        {content}
      </TapArea>
    );
  }

  return (
    <Link to={buildPath.board(board.id)} style={{ textDecoration: 'none' }}>
      <TapArea rounding={4}>{content}</TapArea>
    </Link>
  );
};

export default BoardCard;