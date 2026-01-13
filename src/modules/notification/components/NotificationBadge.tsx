// src/modules/notification/components/NotificationBadge.tsx

import React from 'react';
import { Box, Text } from 'gestalt';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'md',
}) => {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const dimension = size === 'sm' ? 16 : 20;

  return (
    <Box
      rounding="circle"
      display="flex"
      alignItems="center"
      justifyContent="center"
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: '#e60023',
          minWidth: dimension,
          height: dimension,
          padding: '0 4px',
        },
      }}
    >
      <Text size="100" color="inverse" weight="bold">
        {displayCount}
      </Text>
    </Box>
  );
};

export default NotificationBadge;