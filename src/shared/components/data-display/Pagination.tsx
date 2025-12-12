// src/shared/components/data-display/Pagination.tsx
import React from 'react';
import { IconButton, Text, Flex } from 'gestalt';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Flex alignItems="center" justifyContent="center" gap={4}>
      <IconButton
        accessibilityLabel="Previous page"
        icon="arrow-back"
        onClick={handlePrevious}
        disabled={disabled || isFirstPage}
        size="md"
      />
      
      <Text size="200" color={disabled ? 'subtle' : 'default'}>
        Page {currentPage + 1} of {totalPages}
      </Text>
      
      <IconButton
        accessibilityLabel="Next page"
        icon="arrow-forward"
        onClick={handleNext}
        disabled={disabled || isLastPage}
        size="md"
      />
    </Flex>
  );
};

export default Pagination;