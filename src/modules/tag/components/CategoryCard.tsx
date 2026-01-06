// src/modules/tag/components/CategoryCard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageUrl } from '@/modules/storage';
import type { CategoryResponse } from '../types/category.types';

interface CategoryCardProps {
  category: CategoryResponse;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (category: CategoryResponse) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  size = 'md',
  onClick,
}) => {
  const navigate = useNavigate();

  const imageId = category.pin?.thumbnailId || category.pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, {
    enabled: !!imageId,
  });

  const handleClick = () => {
    if (onClick) {
      onClick(category);
    } else {
      navigate(`/search?q=${encodeURIComponent(category.tagName)}`);
    }
  };

  return (
    <button
      type="button"
      className={`category-card category-card--${size}`}
      onClick={handleClick}
      aria-label={`Browse ${category.tagName}`}
    >
      {imageData?.url ? (
        <img
          src={imageData.url}
          alt={category.tagName}
          className="category-card__image"
          loading="lazy"
        />
      ) : (
        <div className="category-card__placeholder">
          <span className="category-card__placeholder-letter">
            {category.tagName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className="category-card__overlay">
        <span className="category-card__title">
          {category.tagName}
        </span>
      </div>
    </button>
  );
};

export default CategoryCard;