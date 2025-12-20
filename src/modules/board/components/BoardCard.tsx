// src/modules/board/components/BoardCard.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, TapArea, Mask, IconButton } from 'gestalt';
import { buildPath } from '@/app/router/routeConfig';
import { useImageUrl } from '@/modules/storage';
import { useBoardPins } from '../hooks/useBoardPins';
import { useIsOwner } from '@/modules/auth';
import type { BoardResponse } from '../types/board.types';

interface BoardCardProps {
  board: BoardResponse;
  onClick?: () => void;
  onEdit?: () => void;
  showMeta?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Pinterest-style коллаж из 3 изображений
const BoardCoverCollage: React.FC<{
  images: Array<{ id: string; url?: string }>;
  height: number;
}> = ({ images, height }) => {
  const [img1, img2, img3] = images;
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
      >
        <Text color="subtle" size="200">
          No pins yet
        </Text>
      </Box>
    );
  }

  // Один пин - одно большое изображение
  if (!hasMultiple && img1?.url) {
    return (
      <Box height={height} rounding={4} overflow="hidden">
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

  // Pinterest-style коллаж: большое слева, 2 маленьких справа
  const mainWidth = '66%';
  const sideWidth = '34%';
  const sideHeight = `calc(50% - ${gap / 2}px)`;

  return (
    <Box 
      height={height} 
      display="flex" 
      rounding={4} 
      overflow="hidden"
      dangerouslySetInlineStyle={{
        __style: { gap: `${gap}px` },
      }}
    >
      {/* Main large image */}
      <Box 
        width={mainWidth} 
        height="100%"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundImage: img1?.url ? `url(${img1.url})` : undefined,
            backgroundColor: img1?.url ? undefined : 'var(--color-gray-200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px 0 0 16px',
          },
        }}
      />

      {/* Right column with 2 smaller images */}
      <Box 
        width={sideWidth}
        display="flex"
        direction="column"
        dangerouslySetInlineStyle={{
          __style: { gap: `${gap}px` },
        }}
      >
        <Box
          height={sideHeight}
          flex="grow"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundImage: img2?.url ? `url(${img2.url})` : undefined,
              backgroundColor: img2?.url ? undefined : 'var(--color-gray-200)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '0 16px 0 0',
            },
          }}
        />
        <Box
          height={sideHeight}
          flex="grow"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundImage: img3?.url ? `url(${img3.url})` : undefined,
              backgroundColor: img3?.url ? undefined : 'var(--color-gray-200)',
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
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = useIsOwner(board.userId);

  // Получаем первые 3 пина для коллажа
  const { pins, totalElements: pinCount } = useBoardPins(board.id, {
    pageable: { page: 0, size: 3 },
  });

  // Получаем URL для каждого изображения
  const imageIds = useMemo(() => 
    pins.slice(0, 3).map(pin => pin.thumbnailId || pin.imageId),
    [pins]
  );

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

  // ✅ Исправлен тип для Gestalt IconButton onClick
  const handleEditClick = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  // Размеры в зависимости от size
  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm': return { height: 120, titleSize: '200' as const };
      case 'lg': return { height: 200, titleSize: '400' as const };
      default: return { height: 160, titleSize: '300' as const };
    }
  }, [size]);

  const content = (
    <Box
      position="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cover Collage */}
      <Mask rounding={4}>
        <Box
          dangerouslySetInlineStyle={{
            __style: {
              transition: 'transform 0.2s ease, filter 0.2s ease',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              filter: isHovered ? 'brightness(0.92)' : 'brightness(1)',
            },
          }}
        >
          <BoardCoverCollage 
            images={coverImages} 
            height={dimensions.height} 
          />
        </Box>
      </Mask>

      {/* Hover Overlay with Edit Button */}
      {isHovered && isOwner && onEdit && (
        <Box
          position="absolute"
          top
          right
          padding={2}
          dangerouslySetInlineStyle={{
            __style: { zIndex: 1 },
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
        <Text weight="bold" size={dimensions.titleSize} lineClamp={1}>
          {board.title}
        </Text>
        {showMeta && (
          <Box marginTop={1}>
            <Text color="subtle" size="100">
              {pinCount} {pinCount === 1 ? 'Pin' : 'Pins'}
            </Text>
          </Box>
        )}
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