// src/modules/pin/components/detail/PinDetailStats.tsx

import React from 'react';
import { Box, Flex, Text, Icon, TapArea } from 'gestalt';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { PinLocalState } from '../../hooks/usePinLocalState';

interface PinDetailStatsProps {
  /** Локальное состояние пина */
  localState: PinLocalState;
  /** Счётчик комментариев (из pin) */
  commentCount: number;
  /** Счётчик просмотров (из pin) */
  viewCount: number;
  onCommentsClick?: () => void;
}

interface StatItemProps {
  icon: 'heart' | 'speech' | 'eye';
  count: number;
  label: string;
  onClick?: () => void;
}

const StatItem: React.FC<StatItemProps> = ({ icon, count, label, onClick }) => {
  const content = (
    <Flex alignItems="center" gap={2}>
      <Icon accessibilityLabel="" icon={icon} size={16} color="subtle" />
      <Text size="200" color="subtle">
        <Text weight="bold" inline>
          {formatCompactNumber(count)}
        </Text>{' '}
        {label}
      </Text>
    </Flex>
  );

  if (onClick) {
    return (
      <TapArea onTap={onClick} rounding={2}>
        <Box padding={1}>{content}</Box>
      </TapArea>
    );
  }

  return <Box padding={1}>{content}</Box>;
};

export const PinDetailStats: React.FC<PinDetailStatsProps> = ({
  localState,
  commentCount,
  viewCount,
  onCommentsClick,
}) => {
  const likeLabel = localState.likeCount === 1 ? 'like' : 'likes';
  const commentLabel = commentCount === 1 ? 'comment' : 'comments';
  const viewLabel = viewCount === 1 ? 'view' : 'views';

  return (
    <Box paddingY={2}>
      <Flex gap={4} wrap>
        <StatItem 
          icon="heart" 
          count={localState.likeCount} 
          label={likeLabel} 
        />
        <StatItem
          icon="speech"
          count={commentCount}
          label={commentLabel}
          onClick={onCommentsClick}
        />
        <StatItem 
          icon="eye" 
          count={viewCount} 
          label={viewLabel} 
        />
      </Flex>
    </Box>
  );
};

export default PinDetailStats;