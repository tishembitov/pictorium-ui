// src/modules/chat/components/OnlineIndicator.tsx

import React from 'react';
import { Box } from 'gestalt';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: 8,
  md: 10,
  lg: 12,
};

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  isOnline,
  size = 'md',
}) => {
  const dimension = sizeConfig[size];

  return (
    <Box
      rounding="circle"
      width={dimension}
      height={dimension}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: isOnline ? '#1fa855' : '#cacaca',
          border: '2px solid white',
          boxShadow: '0 0 2px rgba(0,0,0,0.2)',
        },
      }}
    />
  );
};

export default OnlineIndicator;