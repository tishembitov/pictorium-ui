// src/modules/pin/components/detail/PinDetailStats.tsx

import React from 'react';
import { Box, Flex, Text, Icon, TapArea } from 'gestalt';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailStatsProps {
  pin: PinResponse;
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

/**
 * Статистика пина: лайки, комментарии, просмотры.
 * Ответственность: отображение метрик пина.
 */
export const PinDetailStats: React.FC<PinDetailStatsProps> = ({
  pin,
  onCommentsClick,
}) => {
  const likeLabel = pin.likeCount === 1 ? 'like' : 'likes';
  const commentLabel = pin.commentCount === 1 ? 'comment' : 'comments';
  const viewLabel = pin.viewCount === 1 ? 'view' : 'views';

  return (
    <Box paddingY={2}>
      <Flex gap={4} wrap>
        <StatItem icon="heart" count={pin.likeCount} label={likeLabel} />
        <StatItem
          icon="speech"
          count={pin.commentCount}
          label={commentLabel}
          onClick={onCommentsClick}
        />
        <StatItem icon="eye" count={pin.viewCount} label={viewLabel} />
      </Flex>
    </Box>
  );
};

export default PinDetailStats;