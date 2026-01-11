// src/modules/chat/components/ChatBadge.tsx

import React from 'react';
import { Box, Text } from 'gestalt';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface ChatBadgeProps {
  count: number;
  maxCount?: number;
}

export const ChatBadge: React.FC<ChatBadgeProps> = ({
  count,
  maxCount = 99,
}) => {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : formatCompactNumber(count);

  return (
    <Box
      rounding="circle"
      display="flex"
      alignItems="center"
      justifyContent="center"
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: '#e60023',
          minWidth: 20,
          height: 20,
          padding: '0 6px',
        },
      }}
    >
      <Text size="100" color="inverse" weight="bold">
        {displayCount}
      </Text>
    </Box>
  );
};

export default ChatBadge;