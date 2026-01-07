// src/modules/tag/components/TagChip.tsx

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TapArea, Icon } from 'gestalt';
import type { TagResponse } from '../types/tag.types';

// Цветовая палитра для тегов (Pinterest/Notion style)
const TAG_COLORS = [
  { bg: '#FEE2E2', text: '#DC2626', hover: '#FECACA' }, // Red
  { bg: '#FEF3C7', text: '#D97706', hover: '#FDE68A' }, // Amber
  { bg: '#D1FAE5', text: '#059669', hover: '#A7F3D0' }, // Emerald
  { bg: '#DBEAFE', text: '#2563EB', hover: '#BFDBFE' }, // Blue
  { bg: '#E0E7FF', text: '#4F46E5', hover: '#C7D2FE' }, // Indigo
  { bg: '#EDE9FE', text: '#7C3AED', hover: '#DDD6FE' }, // Violet
  { bg: '#FCE7F3', text: '#DB2777', hover: '#FBCFE8' }, // Pink
  { bg: '#F0FDFA', text: '#0D9488', hover: '#CCFBF1' }, // Teal
  { bg: '#FFF7ED', text: '#EA580C', hover: '#FFEDD5' }, // Orange
  { bg: '#ECFDF5', text: '#10B981', hover: '#D1FAE5' }, // Green
  { bg: '#F0F9FF', text: '#0284C7', hover: '#E0F2FE' }, // Sky
  { bg: '#FDF4FF', text: '#A855F7', hover: '#FAE8FF' }, // Fuchsia
] as const;

// Функция для получения стабильного цвета на основе имени тега
const getTagColor = (tagName: string) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    const char = tagName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index]!;
};

interface TagChipProps {
  tag: TagResponse | string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'selected' | 'colorful';
  onClick?: (tag: string) => void;
  removable?: boolean;
  onRemove?: (tag: string) => void;
  disabled?: boolean;
  selected?: boolean;
  navigateOnClick?: boolean;
  className?: string;
  colorIndex?: number;
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
  colorIndex,
}) => {
  const navigate = useNavigate();
  const tagName = typeof tag === 'string' ? tag : tag.name;

  const tagColor = useMemo(() => {
    if (variant === 'colorful' || variant === 'default') {
      if (colorIndex !== undefined) {
        return TAG_COLORS[colorIndex % TAG_COLORS.length]!;
      }
      return getTagColor(tagName);
    }
    return null;
  }, [tagName, variant, colorIndex]);

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
    if (variant === 'colorful') return 'tag-chip--colorful';
    return '';
  };

  const getInlineStyles = (): React.CSSProperties => {
    if ((variant === 'colorful' || variant === 'default') && tagColor && !selected) {
      return {
        '--tag-bg': tagColor.bg,
        '--tag-text': tagColor.text,
        '--tag-hover': tagColor.hover,
      } as React.CSSProperties;
    }
    return {};
  };

  const chipContent = (
    <span
      className={`
        tag-chip 
        tag-chip--${size} 
        ${getVariantClass()}
        ${disabled ? 'tag-chip--disabled' : ''}
        ${tagColor ? 'tag-chip--has-color' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={getInlineStyles()}
    >
      <span className="tag-chip__text">{tagName}</span>
      
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

  // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Оборачиваем в inline-flex контейнер
  if (onClick || navigateOnClick) {
    return (
      <div className="tag-chip-wrapper">
        <TapArea onTap={handleClick} disabled={disabled} rounding="pill">
          {chipContent}
        </TapArea>
      </div>
    );
  }

  return <div className="tag-chip-wrapper">{chipContent}</div>;
};

export default TagChip;