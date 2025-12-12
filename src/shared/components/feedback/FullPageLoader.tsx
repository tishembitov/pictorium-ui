// src/shared/components/feedback/FullPageLoader.tsx
import React from 'react';
import { Box, Spinner } from 'gestalt';

interface FullPageLoaderProps {
  accessibilityLabel?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  accessibilityLabel = 'Loading application...',
}) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100%"
      color="default"
    >
      <Spinner
        accessibilityLabel={accessibilityLabel}
        show={true}
        size="lg"
      />
    </Box>
  );
};

export default FullPageLoader;