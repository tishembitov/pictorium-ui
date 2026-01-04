// src/modules/board/components/BoardPreviewImage.tsx

import React from 'react';
import { Box, Icon } from 'gestalt';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';

interface BoardPreviewImageProps {
  boardId: string;
  size?: number;
}

export const BoardPreviewImage: React.FC<BoardPreviewImageProps> = ({
  boardId,
  size = 40,
}) => {
  const { pins } = useBoardPins(boardId, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <Box
      width={size}
      height={size}
      rounding={2}
      overflow="hidden"
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
        <Icon
          accessibilityLabel=""
          icon="board"
          size={Math.max(12, size / 3)}
          color="subtle"
        />
      )}
    </Box>
  );
};

export default BoardPreviewImage;