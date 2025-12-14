// src/modules/pin/components/PinStats.tsx

import React from 'react';
import { Flex, Text, Icon, TapArea } from 'gestalt';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { PinResponse } from '../types/pin.types';

// Define valid icon types for stats
type StatIconType = 'heart' | 'speech' | 'add-pin' | 'eye';

interface StatItemProps {
  icon: StatIconType;
  count: number;
  label: string;
  onClick?: () => void;
  iconSize: number;
  textSize: '100' | '200';
}

// Extracted as a separate component outside of PinStats
const StatItem: React.FC<StatItemProps> = ({ 
  icon, 
  count, 
  label, 
  onClick,
  iconSize,
  textSize,
}) => {
  const content = (
    <Flex alignItems="center" gap={1}>
      <Icon accessibilityLabel={label} icon={icon} size={iconSize} color="subtle" />
      <Text size={textSize} color="subtle">
        {formatCompactNumber(count)}
      </Text>
      <Text size={textSize} color="subtle">
        {label}
      </Text>
    </Flex>
  );

  if (onClick) {
    return <TapArea onTap={onClick}>{content}</TapArea>;
  }

  return content;
};

// Helper function to get pluralized label
const getPluralizedLabel = (
  count: number,
  singular: string,
  plural: string,
  showLabel: boolean
): string => {
  if (!showLabel) {
    return '';
  }
  return count === 1 ? singular : plural;
};

interface PinStatsProps {
  pin: PinResponse;
  showLabels?: boolean;
  size?: 'sm' | 'md';
  onLikesClick?: () => void;
  onCommentsClick?: () => void;
  onSavesClick?: () => void;
}

export const PinStats: React.FC<PinStatsProps> = ({
  pin,
  showLabels = true,
  size = 'md',
  onLikesClick,
  onCommentsClick,
  onSavesClick,
}) => {
  const textSize = size === 'sm' ? '100' : '200';
  const iconSize = size === 'sm' ? 12 : 16;

  const likeLabel = getPluralizedLabel(pin.likeCount, 'like', 'likes', showLabels);
  const commentLabel = getPluralizedLabel(pin.commentCount, 'comment', 'comments', showLabels);
  const saveLabel = getPluralizedLabel(pin.saveCount, 'save', 'saves', showLabels);
  const viewLabel = getPluralizedLabel(pin.viewCount, 'view', 'views', showLabels);

  return (
    <Flex gap={4} wrap>
      <StatItem
        icon="heart"
        count={pin.likeCount}
        label={likeLabel}
        onClick={onLikesClick}
        iconSize={iconSize}
        textSize={textSize}
      />
      <StatItem
        icon="speech"
        count={pin.commentCount}
        label={commentLabel}
        onClick={onCommentsClick}
        iconSize={iconSize}
        textSize={textSize}
      />
      <StatItem
        icon="add-pin"
        count={pin.saveCount}
        label={saveLabel}
        onClick={onSavesClick}
        iconSize={iconSize}
        textSize={textSize}
      />
      <StatItem
        icon="eye"
        count={pin.viewCount}
        label={viewLabel}
        iconSize={iconSize}
        textSize={textSize}
      />
    </Flex>
  );
};

export default PinStats;