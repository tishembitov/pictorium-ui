// src/modules/pin/components/detail/PinDetailInfo.tsx

import React, { useState, useCallback } from 'react';
import { Icon } from 'gestalt';
import { TagList } from '@/modules/tag';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailInfoProps {
  pin: PinResponse;
}

// Максимальная длина описания до "Show more"
const MAX_DESCRIPTION_LENGTH = 150;

/**
 * Извлекает домен из URL для отображения
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Получает favicon URL для домена
 */
function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

export const PinDetailInfo: React.FC<PinDetailInfoProps> = ({ pin }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const hasContent = pin.title || pin.description || pin.href || pin.tags.length > 0;
  
  const shouldTruncateDescription = 
    pin.description && pin.description.length > MAX_DESCRIPTION_LENGTH;
  
  const displayedDescription = shouldTruncateDescription && !isDescriptionExpanded
    ? `${pin.description!.slice(0, MAX_DESCRIPTION_LENGTH).trim()}...`
    : pin.description;

  const toggleDescription = useCallback(() => {
    setIsDescriptionExpanded(prev => !prev);
  }, []);

  if (!hasContent) {
    return null;
  }

  return (
    <div className="pin-info">
      {/* External Link - показываем первым как в Pinterest */}
      {pin.href && (
        <a 
          href={pin.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="pin-info__link"
        >
          <span className="pin-info__link-favicon">
            <img 
              src={getFaviconUrl(pin.href)} 
              alt="" 
              width={16} 
              height={16}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </span>
          <span className="pin-info__link-text">
            {extractDomain(pin.href)}
          </span>
          <span className="pin-info__link-arrow">
            <Icon
              accessibilityLabel=""
              icon="arrow-up-right"
              size={12}
              color="subtle"
            />
          </span>
        </a>
      )}

      {/* Title */}
      {pin.title && (
        <h1 className="pin-info__title">
          {pin.title}
        </h1>
      )}

      {/* Description */}
      {pin.description && (
        <div className="pin-info__description-wrapper">
          <p className="pin-info__description">
            {displayedDescription}
          </p>
          {shouldTruncateDescription && (
            <button 
              type="button"
              className="pin-info__read-more"
              onClick={toggleDescription}
            >
              {isDescriptionExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {pin.tags.length > 0 && (
        <div className="pin-info__tags">
          <TagList 
            tags={pin.tags} 
            navigateOnClick 
            size="sm"
            variant="colorful"
            animated
            wrap
            gap={2}
          />
        </div>
      )}
    </div>
  );
};

export default PinDetailInfo;