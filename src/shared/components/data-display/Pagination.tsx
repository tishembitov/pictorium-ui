import React from 'react';
import { Flex, IconButton, Text } from 'gestalt';

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
    if (!isFirstPage && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage && !disabled) {
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
        icon="directional-arrow-left"
        onClick={handlePrevious}
        disabled={disabled || isFirstPage}
        size="md"
        bgColor="transparent"
      />
      
      <Text size="200" color={disabled ? 'subtle' : 'default'}>
        Page {currentPage + 1} of {totalPages}
      </Text>
      
      <IconButton
        accessibilityLabel="Next page"
        icon="directional-arrow-right"
        onClick={handleNext}
        disabled={disabled || isLastPage}
        size="md"
        bgColor="transparent"
      />
    </Flex>
  );
};

export default Pagination;