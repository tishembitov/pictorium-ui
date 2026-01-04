// src/modules/board/components/BoardPreviewImage.tsx

import React, { useState } from 'react';
import { Box, Icon } from 'gestalt';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';

interface BoardPreviewImageProps {
  boardId: string;
  size?: number;
  showBorder?: boolean;
}

export const BoardPreviewImage: React.FC<BoardPreviewImageProps> = ({
  boardId,
  size = 40,
  showBorder = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { pins } = useBoardPins(boardId, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  const borderRadius = Math.max(8, size / 5);

  return (
    <Box
      width={size}
      height={size}
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      dangerouslySetInlineStyle={{
        __style: {
          borderRadius,
          backgroundColor: '#f0f0f0',
          border: showBorder ? '2px solid #fff' : 'none',
          boxShadow: showBorder ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          position: 'relative',
          overflow: 'hidden',
        },
      }}
    >
      {coverData?.url ? (
        <>
          {/* Loading shimmer */}
          {!isLoaded && (
            <Box
              position="absolute"
              top
              left
              right
              bottom
              dangerouslySetInlineStyle={{
                __style: {
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                },
              }}
            />
          )}
          <img
            src={coverData.url}
            alt=""
            onLoad={() => setIsLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
          <style>
            {`
              @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
            `}
          </style>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
            },
          }}
        >
          <Icon
            accessibilityLabel=""
            icon="board"
            size={Math.max(16, size / 2.5)}
            color="subtle"
          />
        </Box>
      )}
    </Box>
  );
};

export default BoardPreviewImage;