// src/modules/tag/components/CategoryGrid.tsx

import React from 'react';
import { CategoryCard } from './CategoryCard';
import { useCategories } from '../hooks/useCategories';
import type { CategoryResponse } from '../types/category.types';

interface CategoryGridProps {
  limit?: number;
  size?: 'sm' | 'md' | 'lg';
  onCategoryClick?: (category: CategoryResponse) => void;
  title?: string;
  showTitle?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  limit = 8,
  size = 'md',
  onCategoryClick,
  title = 'Explore Categories',
  showTitle = true,
}) => {
  const { data: categories, isLoading, isError } = useCategories({ limit });

  if (isLoading) {
    return (
      <div className="category-grid">
        {showTitle && <h2 className="category-grid__title">{title}</h2>}
        <div className="category-grid__container">
          {Array.from({ length: limit }, (_, i) => i).map((i) => (
            <div 
              key={`skeleton-${i}`} 
              className={`category-skeleton category-skeleton--${size}`} 
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !categories) {
    return (
      <div className="tag-empty">
        <svg className="tag-empty__icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p className="tag-empty__text">Failed to load categories</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="tag-empty">
        <svg className="tag-empty__icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z"/>
        </svg>
        <p className="tag-empty__text">No categories available</p>
      </div>
    );
  }

  return (
    <div className="category-grid">
      {showTitle && <h2 className="category-grid__title">{title}</h2>}
      <div className="category-grid__container">
        {categories.map((category) => (
          <CategoryCard
            key={category.tagId}
            category={category}
            size={size}
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;