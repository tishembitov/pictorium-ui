// src/modules/tag/components/TagList.tsx

import React from 'react';
import { Box, Flex, Text } from 'gestalt';
import { TagChip } from './TagChip';
import type { TagResponse } from '../types/tag.types';

interface TagListProps {
  tags: (TagResponse | string)[];
  size?: 'sm' | 'md' | 'lg';
  onClick?: (tag: string) => void;
  selectedTags?: string[];
  onTagSelect?: (tag: string) => void;
  onTagDeselect?: (tag: string) => void;
  removable?: boolean;
  onRemove?: (tag: string) => void;
  emptyMessage?: string;
  wrap?: boolean;
  gap?: 1 | 2 | 3 | 4;
  navigateOnClick?: boolean;
  maxVisible?: number;
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  size = 'md',
  onClick,
  selectedTags = [],
  onTagSelect,
  onTagDeselect,
  removable = false,
  onRemove,
  emptyMessage,
  wrap = true,
  gap = 2,
  navigateOnClick = false,
  maxVisible,
}) => {
  if (tags.length === 0 && emptyMessage) {
    return (
      <Box paddingY={2}>
        <Text color="subtle" size="200">
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible ? Math.max(0, tags.length - maxVisible) : 0;

  const handleTagClick = (tagName: string) => {
    if (onClick) {
      onClick(tagName);
      return;
    }

    const isSelected = selectedTags.includes(tagName);
    if (isSelected && onTagDeselect) {
      onTagDeselect(tagName);
    } else if (!isSelected && onTagSelect) {
      onTagSelect(tagName);
    }
  };

  return (
    <Flex wrap={wrap} gap={gap}>
      {visibleTags.map((tag) => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const isSelected = selectedTags.includes(tagName);

        return (
          <TagChip
            key={tagName}
            tag={tag}
            size={size}
            selected={isSelected}
            onClick={onClick || onTagSelect || onTagDeselect ? handleTagClick : undefined}
            removable={removable}
            onRemove={onRemove}
            navigateOnClick={navigateOnClick && !onClick}
          />
        );
      })}
      
      {hiddenCount > 0 && (
        <Box
          paddingX={3}
          paddingY={2}
          rounding="pill"
          color="secondary"
        >
          <Text size="200" color="subtle">
            +{hiddenCount} more
          </Text>
        </Box>
      )}
    </Flex>
  );
};

export default TagList;