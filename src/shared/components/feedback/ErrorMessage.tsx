// src/shared/components/feedback/ErrorMessage.tsx
import React from 'react';
import { Box, Text, Icon, Button } from 'gestalt';
import { ERROR_MESSAGES } from '../../utils/constants';

interface ErrorMessageProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getIconSize = (size: 'sm' | 'md' | 'lg'): number => {
  switch (size) {
    case 'sm': return 24;
    case 'lg': return 48;
    default: return 32;
  }
};

const getPaddingY = (size: 'sm' | 'md' | 'lg'): 4 | 6 | 8 => {
  switch (size) {
    case 'sm': return 4;
    case 'lg': return 8;
    default: return 6;
  }
};

const getTextSize = (size: 'sm' | 'md' | 'lg'): '100' | '200' | '300' | '400' => {
  switch (size) {
    case 'sm': return '200';
    case 'lg': return '400';
    default: return '300';
  }
};

const getDescriptionSize = (size: 'sm' | 'md' | 'lg'): '100' | '200' | '300' => {
  switch (size) {
    case 'sm': return '100';
    case 'lg': return '300';
    default: return '200';
  }
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = ERROR_MESSAGES.UNKNOWN_ERROR,
  title,
  onRetry,
  retryText = 'Try again',
  size = 'md',
}) => {
  const iconSize = getIconSize(size);
  const paddingY = getPaddingY(size);
  
  return (
    <Box
      display="flex"
      direction="column"
      alignItems="center"
      justifyContent="center"
      paddingY={paddingY}
    >
      <Box marginBottom={3} color="errorBase" rounding="circle" padding={3}>
        <Icon
          accessibilityLabel="Error"
          icon="workflow-status-problem"
          color="inverse"
          size={iconSize}
        />
      </Box>
      
      {title && (
        <Box marginBottom={2}>
          <Text weight="bold" size={getTextSize(size)}>
            {title}
          </Text>
        </Box>
      )}
      
      <Box marginBottom={onRetry ? 4 : 0} maxWidth={300}>
        <Text 
          align="center" 
          color="subtle"
          size={getDescriptionSize(size)}
        >
          {message}
        </Text>
      </Box>
      
      {onRetry && (
        <Button
          text={retryText}
          onClick={onRetry}
          size={size === 'sm' ? 'sm' : 'md'}
        />
      )}
    </Box>
  );
};

export default ErrorMessage;