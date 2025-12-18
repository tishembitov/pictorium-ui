// src/modules/user/components/UserAvatar.tsx

import React, { useState } from 'react';
import { Box, TapArea, Icon } from 'gestalt';
import { useImageUrl } from '@/modules/storage';

interface UserAvatarProps {
  imageId?: string | null;
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  outline?: boolean;
  onClick?: () => void;
  showEditOverlay?: boolean;
  onEditClick?: () => void;
}

const sizeConfig = {
  xs: { dimension: 24, fontSize: 10, iconSize: 12 as const },
  sm: { dimension: 32, fontSize: 12, iconSize: 14 as const },
  md: { dimension: 48, fontSize: 16, iconSize: 18 as const },
  lg: { dimension: 64, fontSize: 20, iconSize: 24 as const },
  xl: { dimension: 80, fontSize: 24, iconSize: 28 as const },
  xxl: { dimension: 120, fontSize: 32, iconSize: 36 as const },
} as const;

// Предопределённые цвета для аватаров
const AVATAR_COLORS: readonly string[] = [
  '#E60023', '#BD081C', '#0076D3', '#0084FF',
  '#00A651', '#8E44AD', '#E67E22', '#1ABC9C',
  '#3498DB', '#9B59B6', '#E74C3C', '#2ECC71',
];

const DEFAULT_COLOR = '#E60023';

// Генерируем цвет из имени
const getColorFromName = (name: string): string => {
  if (!name || name.length === 0) {
    return DEFAULT_COLOR;
  }
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const charCode = name.codePointAt(i);
    if (charCode !== undefined) {
      hash = charCode + ((hash << 5) - hash);
    }
  }
  
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? DEFAULT_COLOR;
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  imageId,
  src,
  name,
  size = 'md',
  outline = false,
  onClick,
  showEditOverlay = false,
  onEditClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { data: imageData, isLoading } = useImageUrl(imageId, {
    enabled: !!imageId && !src,
  });

  const config = sizeConfig[size];
  const imageUrl = src ?? imageData?.url;
  const showImage = !!imageUrl && !imageError;
  const initial = name.charAt(0).toUpperCase();
  const bgColor = getColorFromName(name);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleImageError = () => setImageError(true);

  const avatarContent = (
    <Box
      position="relative"
      width={config.dimension}
      height={config.dimension}
      rounding="circle"
      overflow="hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: showImage ? 'transparent' : bgColor,
          border: outline ? '3px solid white' : 'none',
          boxShadow: outline ? '0 0 0 1px rgba(0,0,0,0.1)' : 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: isHovered && onClick ? 'scale(1.05)' : 'scale(1)',
        },
      }}
    >
      {/* Loading state */}
      {isLoading && !showImage && (
        <Box
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="secondary"
        />
      )}

      {/* Image */}
      {showImage && imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {/* Fallback initial */}
      {!showImage && !isLoading && (
        <Box
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <span
            style={{
              color: 'white',
              fontSize: config.fontSize,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {initial}
          </span>
        </Box>
      )}

      {/* Edit overlay */}
      {showEditOverlay && isHovered && onEditClick && (
        <Box
          position="absolute"
          top
          left
          right
          bottom
          display="flex"
          alignItems="center"
          justifyContent="center"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <TapArea onTap={onEditClick} rounding="circle">
            <Icon
              accessibilityLabel="Edit"
              icon="edit"
              color="inverse"
              size={config.iconSize}
            />
          </TapArea>
        </Box>
      )}
    </Box>
  );

  if (onClick) {
    return (
      <TapArea onTap={onClick} rounding="circle" tapStyle="compress">
        {avatarContent}
      </TapArea>
    );
  }

  return avatarContent;
};

export default UserAvatar;