// src/modules/tag/components/TagChip.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TapArea, Icon } from 'gestalt';
import type { TagResponse } from '../types/tag.types';

interface TagChipProps {
  tag: TagResponse | string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'selected';
  onClick?: (tag: string) => void;
  removable?: boolean;
  onRemove?: (tag: string) => void;
  disabled?: boolean;
  selected?: boolean;
  navigateOnClick?: boolean;
  className?: string;
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  size = 'md',
  variant = 'default',
  onClick,
  removable = false,
  onRemove,
  disabled = false,
  selected = false,
  navigateOnClick = false,
  className = '',
}) => {
  const navigate = useNavigate();
  const tagName = typeof tag === 'string' ? tag : tag.name;

  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick(tagName);
    } else if (navigateOnClick) {
      navigate(`/search?q=${encodeURIComponent(tagName)}`);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove(tagName);
    }
  };

  const handleRemoveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && onRemove) {
        onRemove(tagName);
      }
    }
  };

  const getVariantClass = () => {
    if (selected) return 'tag-chip--selected';
    if (variant === 'primary') return 'tag-chip--primary';
    return '';
  };

  const chipContent = (
    <span
      className={`
        tag-chip 
        tag-chip--${size} 
        ${getVariantClass()}
        ${disabled ? 'tag-chip--disabled' : ''}
        ${className}
      `.trim()}
    >
      <span>{tagName}</span>
      
      {removable && onRemove && (
        <button
          type="button"
          className="tag-chip__remove"
          onClick={handleRemove}
          onKeyDown={handleRemoveKeyDown}
          aria-label={`Remove ${tagName}`}
          disabled={disabled}
        >
          <Icon
            accessibilityLabel="Remove"
            icon="cancel"
            size={12}
            color={selected ? 'inverse' : 'dark'}
          />
        </button>
      )}
    </span>
  );

  if (onClick || navigateOnClick) {
    return (
      <TapArea onTap={handleClick} disabled={disabled} rounding="pill">
        {chipContent}
      </TapArea>
    );
  }

  return chipContent;
};

export default TagChip;