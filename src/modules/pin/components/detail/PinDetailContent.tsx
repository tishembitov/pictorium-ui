// src/modules/pin/components/detail/PinDetailContent.tsx

import React from 'react';
import { Box } from 'gestalt';
import { PinDetailHeader } from './PinDetailHeader';
import { PinDetailInfo } from './PinDetailInfo';
import { PinDetailAuthor } from './PinDetailAuthor';
import { PinDetailStats } from './PinDetailStats';
import { PinDetailComments } from './PinDetailComments';
import { useScrollToComments } from '../../hooks/useScrollToComments';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailContentProps {
  pin: PinResponse;
  onBack?: () => void;
}

const SoftDivider: React.FC<{ 
  width?: string; 
  opacity?: number;
}> = ({ 
  width = '90%', 
  opacity = 0.6 
}) => (
  <Box 
    display="flex" 
    justifyContent="center" 
    paddingY={1}
  >
    <Box
      dangerouslySetInlineStyle={{
        __style: {
          width,
          height: 1,
          backgroundColor: `rgba(0, 0, 0, ${opacity * 0.1})`,
          borderRadius: 1,
        },
      }}
    />
  </Box>
);

/**
 * Правая часть детальной страницы пина.
 */
export const PinDetailContent: React.FC<PinDetailContentProps> = ({
  pin,
  onBack,
}) => {
  const { commentsRef, scrollToComments } = useScrollToComments();

  return (
    <Box padding={4} height="100%">
      {/* Header with all actions */}
      <PinDetailHeader pin={pin} onBack={onBack} />

      {/* Pin Info: title, description, link, tags */}
      <Box paddingY={3}>
        <PinDetailInfo pin={pin} />
      </Box>

      {/* Stats */}
      <Box paddingY={2}>
        <PinDetailStats pin={pin} onCommentsClick={scrollToComments} />
      </Box>

      <SoftDivider />

      {/* Author */}
      <Box paddingY={3}>
        <PinDetailAuthor userId={pin.userId} />
      </Box>

      <SoftDivider />

      {/* Comments */}
      <PinDetailComments pinId={pin.id} commentsRef={commentsRef} />
    </Box>
  );
};

export default PinDetailContent;