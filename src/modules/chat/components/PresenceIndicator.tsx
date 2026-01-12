// src/modules/chat/components/PresenceIndicator.tsx

import React from 'react';
import { Box, Flex, Text } from 'gestalt';
import type { PresenceStatus } from '../types/chat.types';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  showDot?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface StatusConfig {
  color: string;
  text: string;
}

const getStatusConfig = (status: PresenceStatus): StatusConfig => {
  switch (status) {
    case 'ONLINE':
      return { color: '#1fa855', text: 'online' };
    case 'RECENTLY':
      return { color: '#767676', text: 'last seen recently' };
    case 'LAST_HOUR':
      return { color: '#767676', text: 'last seen within an hour' };
    case 'TODAY':
      return { color: '#767676', text: 'last seen today' };
    case 'YESTERDAY':
      return { color: '#767676', text: 'last seen yesterday' };
    case 'WEEK':
      return { color: '#767676', text: 'last seen this week' };
    case 'LONG_AGO':
    default:
      return { color: '#ababab', text: 'last seen a long time ago' };
  }
};

const dotSizes = {
  sm: 8,
  md: 10,
  lg: 12,
};

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  showDot = false,
  showText = true,
  size = 'md',
}) => {
  const config = getStatusConfig(status);
  const dotSize = dotSizes[size];
  const isOnline = status === 'ONLINE';

  // Text only (по умолчанию)
  if (showText && !showDot) {
    return (
      <Text 
        size="100" 
        color={isOnline ? 'success' : 'subtle'}
      >
        {config.text}
      </Text>
    );
  }

  // Text with optional dot
  if (showText && showDot) {
    return (
      <Flex alignItems="center" gap={1}>
        {isOnline && (
          <Box
            rounding="circle"
            dangerouslySetInlineStyle={{
              __style: {
                width: dotSize,
                height: dotSize,
                backgroundColor: config.color,
                flexShrink: 0,
              },
            }}
          />
        )}
        <Text size="100" color={isOnline ? 'success' : 'subtle'}>
          {config.text}
        </Text>
      </Flex>
    );
  }

  // Dot only (only for ONLINE)
  if (!isOnline) {
    return null;
  }

  return (
    <Box
      rounding="circle"
      dangerouslySetInlineStyle={{
        __style: {
          width: dotSize,
          height: dotSize,
          backgroundColor: config.color,
        },
      }}
    />
  );
};

export default PresenceIndicator;