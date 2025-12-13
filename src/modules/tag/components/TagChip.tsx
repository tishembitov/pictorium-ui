// src/modules/tag/components/TagChip.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, TapArea, Flex } from 'gestalt';
import type { TagResponse } from '../types/tag.types';

interface TagChipProps {
  tag: TagResponse | string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (tag: string) => void;
  removable?: boolean;
  onRemove?: (tag: string) => void;
  disabled?: boolean;
  selected?: boolean;
  navigateOnClick?: boolean;
}

// Gestalt Box padding accepts: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
type GestaltPadding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface SizeStyle {
  paddingX: GestaltPadding;
  paddingY: GestaltPadding;
  textSize: '100' | '200' | '300';
}

const sizeStyles: Record<'sm' | 'md' | 'lg', SizeStyle> = {
  sm: { paddingX: 2, paddingY: 1, textSize: '100' },
  md: { paddingX: 3, paddingY: 2, textSize: '200' },
  lg: { paddingX: 4, paddingY: 2, textSize: '300' },
};

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  size = 'md',
  onClick,
  removable = false,
  onRemove,
  disabled = false,
  selected = false,
  navigateOnClick = false,
}) => {
  const navigate = useNavigate();
  const tagName = typeof tag === 'string' ? tag : tag.name;
  const styles = sizeStyles[size];

  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick(tagName);
    } else if (navigateOnClick) {
      navigate(`/search?q=${encodeURIComponent(tagName)}`);
    }
  };

  const handleRemove = () => {
    if (!disabled && onRemove) {
      onRemove(tagName);
    }
  };

  const content = (
    <Box
      paddingX={styles.paddingX}
      paddingY={styles.paddingY}
      rounding="pill"
      color={selected ? 'dark' : 'secondary'}
      dangerouslySetInlineStyle={{
        __style: {
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s ease',
        },
      }}
    >
      <Flex alignItems="center" gap={1}>
        <Text 
          size={styles.textSize} 
          color={selected ? 'inverse' : 'default'}
          weight={selected ? 'bold' : 'normal'}
        >
          {tagName}
        </Text>
        
        {removable && onRemove && (
          <TapArea onTap={handleRemove} tapStyle="compress">
            <Box marginStart={1}>
              <Text size="100" color={selected ? 'inverse' : 'subtle'}>
                ✕
              </Text>
            </Box>
          </TapArea>
        )}
      </Flex>
    </Box>
  );

  if (onClick || navigateOnClick) {
    return (
      <TapArea onTap={handleClick} disabled={disabled} rounding="pill">
        {content}
      </TapArea>
    );
  }

  return content;
};

export default TagChip;