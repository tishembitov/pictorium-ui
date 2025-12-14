// src/modules/board/components/BoardCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, TapArea, Mask } from 'gestalt';
import { buildPath } from '@/app/router/routeConfig';
import { useImageUrl } from '@/modules/storage';
import { formatRelativeTime } from '@/shared/utils/formatters';
import type { BoardResponse } from '../types/board.types';

interface BoardCardProps {
  board: BoardResponse;
  coverImageId?: string | null;
  pinCount?: number;
  onClick?: () => void;
  showMeta?: boolean;
}

export const BoardCard: React.FC<BoardCardProps> = ({
  board,
  coverImageId,
  pinCount = 0,
  onClick,
  showMeta = true,
}) => {
  const { data: coverData } = useImageUrl(coverImageId, {
    enabled: !!coverImageId,
  });

  const content = (
    <Box rounding={4} overflow="hidden">
      {/* Cover Image */}
      <Mask rounding={4}>
        <Box
          height={150}
          color="secondary"
          display="flex"
          alignItems="center"
          justifyContent="center"
          dangerouslySetInlineStyle={{
            __style: coverData?.url
              ? {
                  backgroundImage: `url(${coverData.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {},
          }}
        >
          {!coverData?.url && (
            <Text color="subtle" size="200">
              No pins yet
            </Text>
          )}
        </Box>
      </Mask>

      {/* Board Info */}
      <Box paddingY={2} paddingX={1}>
        <Text weight="bold" lineClamp={1}>
          {board.title}
        </Text>
        {showMeta && (
          <Box marginTop={1}>
            <Text color="subtle" size="100">
              {pinCount} {pinCount === 1 ? 'pin' : 'pins'} · {formatRelativeTime(board.updatedAt)}
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