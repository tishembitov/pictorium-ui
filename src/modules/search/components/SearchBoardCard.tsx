// src/modules/search/components/SearchBoardCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text, TapArea, Mask, Icon } from 'gestalt';
import { buildPath } from '@/app/router/routes';
import { useImageUrl } from '@/modules/storage';
import { getHighlightedText } from '../utils/searchUtils';
import type { BoardSearchResult } from '../types/search.types';

interface SearchBoardCardProps {
  board: BoardSearchResult;
  showHighlights?: boolean;
}

export const SearchBoardCard: React.FC<SearchBoardCardProps> = ({
  board,
  showHighlights = true,
}) => {
  const { data: imageData } = useImageUrl(board.previewImageId, {
    enabled: !!board.previewImageId,
  });

  const displayTitle = showHighlights && board.highlights
    ? getHighlightedText(board.highlights, 'title', board.title)
    : board.title;

  return (
    <Link to={buildPath.board(board.id)} style={{ textDecoration: 'none' }}>
      <TapArea rounding={4}>
        <Box>
          {/* Preview Image */}
          <Mask rounding={4}>
            <Box
              height={120}
              color="secondary"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {imageData?.url ? (
                <img
                  src={imageData.url}
                  alt={board.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Icon
                  accessibilityLabel=""
                  icon="board"
                  size={32}
                  color="subtle"
                />
              )}
            </Box>
          </Mask>
          
          {/* Info */}
          <Box paddingY={2}>
            <Text weight="bold" size="200" lineClamp={1}>
              <span dangerouslySetInnerHTML={{ __html: displayTitle }} />
            </Text>
            
            <Flex gap={2} alignItems="center">
              <Text size="100" color="subtle">
                @{board.username}
              </Text>
              <Text size="100" color="subtle">
                •
              </Text>
              <Text size="100" color="subtle">
                {board.pinCount} pins
              </Text>
            </Flex>
          </Box>
        </Box>
      </TapArea>
    </Link>
  );
};

export default SearchBoardCard;