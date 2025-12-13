// src/modules/tag/components/CategoryGrid.tsx

import React from 'react';
import { Box, Flex, Spinner, Text } from 'gestalt';
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
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading categories" show />
      </Box>
    );
  }

  if (isError || !categories) {
    return (
      <Box padding={4}>
        <Text color="error">Failed to load categories</Text>
      </Box>
    );
  }

  if (categories.length === 0) {
    return (
      <Box padding={4}>
        <Text color="subtle">No categories available</Text>
      </Box>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Box marginBottom={4}>
          <Text size="400" weight="bold">
            {title}
          </Text>
        </Box>
      )}

      <Flex wrap gap={4} justifyContent="center">
        {categories.map((category) => (
          <CategoryCard
            key={category.tagId}
            category={category}
            size={size}
            onClick={onCategoryClick}
          />
        ))}
      </Flex>
    </Box>
  );
};

export default CategoryGrid;