// src/shared/components/feedback/LoadingSpinner.tsx
import React from 'react';
import { Spinner, Box } from 'gestalt';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
  delay?: boolean;
}

const sizeMap = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  accessibilityLabel = 'Loading...',
  delay = false,
}) => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" padding={4}>
      <Spinner
        accessibilityLabel={accessibilityLabel}
        show={true}
        size={sizeMap[size]}
        delay={delay}
      />
    </Box>
  );
};

export default LoadingSpinner;