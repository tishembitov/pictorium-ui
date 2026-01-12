// src/modules/chat/components/OnlineIndicator.tsx

import React from 'react';
import { Box } from 'gestalt';
import type { PresenceStatus } from '../types/chat.types';

interface OnlineIndicatorProps {
  isOnline?: boolean;
  status?: PresenceStatus;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: 10,
  md: 14,
  lg: 18,
};

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  isOnline = false,
  status,
  size = 'md',
}) => {
  // Only show for ONLINE status
  const shouldShow = status === 'ONLINE' || (!status && isOnline);

  if (!shouldShow) {
    return null;
  }

  const dimension = sizeConfig[size];

  return (
    <Box
      rounding="circle"
      dangerouslySetInlineStyle={{
        __style: {
          width: dimension,
          height: dimension,
          backgroundColor: '#1fa855',
          border: '2px solid white',
          boxShadow: '0 0 4px rgba(31, 168, 85, 0.5)',
        },
      }}
    />
  );
};

export default OnlineIndicator;