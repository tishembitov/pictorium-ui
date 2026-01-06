// src/modules/tag/components/TagList.tsx

import React from 'react';
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
  animated?: boolean;
  showMoreLabel?: string;
  onShowMore?: () => void;
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
  animated = false,
  showMoreLabel,
  onShowMore,
}) => {
  if (tags.length === 0) {
    if (emptyMessage) {
      return (
        <div className="tag-empty">
          <svg 
            className="tag-empty__icon" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
          </svg>
          <p className="tag-empty__text">{emptyMessage}</p>
        </div>
      );
    }
    return null;
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
    <div 
      className={`
        tag-list 
        ${wrap ? '' : 'tag-list--no-wrap'} 
        ${animated ? 'tag-list--animated' : ''}
      `.trim()}
      style={{ gap: `${gap * 4}px` }}
    >
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
        <button 
          type="button"
          className="tag-more"
          onClick={onShowMore}
        >
          {showMoreLabel || `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
};

export default TagList;