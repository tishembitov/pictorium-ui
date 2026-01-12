// src/modules/chat/components/PresenceIndicator.tsx

import React from 'react';
import { Box, Text, Flex } from 'gestalt';
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
  sm: 10,
  md: 14,
  lg: 18,
};

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  showDot = true,
  showText = false,
  size = 'md',
}) => {
  const config = getStatusConfig(status);
  const dotSize = dotSizes[size];
  const isOnline = status === 'ONLINE';

  // Text with optional dot
  if (showText && showDot) {
    return (
      <Flex alignItems="center" gap={1}>
        {isOnline && (
          <Box
            rounding="circle"
            width={dotSize}
            height={dotSize}
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: config.color,
                flexShrink: 0,
              },
            }}
          />
        )}
        <Text size="100" color="subtle">
          {config.text}
        </Text>
      </Flex>
    );
  }

  // Text only
  if (showText) {
    return (
      <Text size="100" color="subtle">
        {config.text}
      </Text>
    );
  }

  // Dot only (only for ONLINE)
  if (!isOnline) {
    return null;
  }

  return (
    <Box
      rounding="circle"
      width={dotSize}
      height={dotSize}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: config.color,
          border: '2px solid white',
          boxShadow: '0 0 3px rgba(0,0,0,0.25)',
        },
      }}
    />
  );
};

export default PresenceIndicator;