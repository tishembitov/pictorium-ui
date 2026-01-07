// src/modules/pin/components/detail/PinDetailStats.tsx

import React from 'react';
import { Icon, TapArea, Tooltip } from 'gestalt';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { PinLocalState } from '../../hooks/usePinLocalState';

interface PinDetailStatsProps {
  localState: PinLocalState;
  commentCount: number;
  viewCount: number;
  onCommentsClick?: () => void;
}

interface StatItemProps {
  icon: 'heart' | 'speech' | 'eye';
  count: number;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  tooltip?: string;
}

const StatItem: React.FC<StatItemProps> = ({ 
  icon, 
  count, 
  label, 
  onClick, 
  isActive = false,
  tooltip,
}) => {
  const content = (
    <div className={`pin-stat ${onClick ? 'pin-stat--clickable' : ''} ${isActive ? 'pin-stat--active' : ''}`}>
      <span className="pin-stat__icon">
        <Icon 
          accessibilityLabel="" 
          icon={icon} 
          size={18} 
          color={isActive ? 'error' : 'subtle'} 
        />
      </span>
      <span className="pin-stat__content">
        <span className={`pin-stat__count ${isActive ? 'pin-stat__count--active' : ''}`}>
          {formatCompactNumber(count)}
        </span>
        <span className="pin-stat__label">{label}</span>
      </span>
    </div>
  );

  if (onClick) {
    const wrappedContent = tooltip ? (
      <Tooltip text={tooltip}>
        {content}
      </Tooltip>
    ) : content;

    return (
      <TapArea onTap={onClick} rounding={2}>
        {wrappedContent}
      </TapArea>
    );
  }

  return content;
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
    <div className="pin-stats">
      <StatItem 
        icon="heart" 
        count={localState.likeCount} 
        label={likeLabel}
        isActive={localState.isLiked}
      />
      <div className="pin-stats__divider" />
      <StatItem
        icon="speech"
        count={commentCount}
        label={commentLabel}
        onClick={onCommentsClick}
        tooltip="View comments"
      />
      <div className="pin-stats__divider" />
      <StatItem 
        icon="eye" 
        count={viewCount} 
        label={viewLabel} 
      />
    </div>
  );
};

export default PinDetailStats;