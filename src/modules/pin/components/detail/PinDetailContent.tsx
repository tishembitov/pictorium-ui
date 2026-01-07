// src/modules/pin/components/detail/PinDetailContent.tsx

import React from 'react';
import { Box} from 'gestalt';
import { PinDetailHeader } from './PinDetailHeader';
import { PinDetailInfo } from './PinDetailInfo';
import { PinDetailAuthor } from './PinDetailAuthor';
import { PinDetailStats } from './PinDetailStats';
import { PinDetailComments } from './PinDetailComments';
import { useScrollToComments } from '../../hooks/useScrollToComments';
import { usePinLocalState } from '../../hooks/usePinLocalState';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailContentProps {
  pin: PinResponse;
  onBack?: () => void;
}

export const PinDetailContent: React.FC<PinDetailContentProps> = ({
  pin,
  onBack,
}) => {
  const { commentsRef, scrollToComments } = useScrollToComments();
  const { state, toggleLike, markAsSaved, markAsRemoved } = usePinLocalState(pin);

  return (
    <Box 
      display="flex" 
      direction="column" 
      height="100%"
    >
      {/* Sticky Header */}
      <Box
        paddingX={4}
        paddingY={3}
        dangerouslySetInlineStyle={{
          __style: {
            borderBottom: '1px solid var(--border-light)',
            flexShrink: 0,
          },
        }}
      >
        <PinDetailHeader 
          pin={pin} 
          localState={state}
          onToggleLike={toggleLike}
          onSave={markAsSaved}
          onRemove={markAsRemoved}
          onBack={onBack} 
        />
      </Box>

      {/* Scrollable Content */}
      <Box 
        flex="grow" 
        overflow="auto"
        paddingX={4}
        paddingY={4}
        dangerouslySetInlineStyle={{
          __style: {
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border-default) transparent',
          },
        }}
      >
        {/* Pin Info */}
        <PinDetailInfo pin={pin} />

        {/* Stats */}
        <Box 
          marginTop={4}
          paddingY={3}
          dangerouslySetInlineStyle={{
            __style: {
              borderTop: '1px solid var(--border-light)',
              borderBottom: '1px solid var(--border-light)',
            },
          }}
        >
          <PinDetailStats 
            localState={state}
            commentCount={pin.commentCount}
            viewCount={pin.viewCount}
            onCommentsClick={scrollToComments} 
          />
        </Box>

        {/* Author */}
        <Box marginTop={4}>
          <PinDetailAuthor userId={pin.userId} />
        </Box>

        {/* Comments */}
        <Box marginTop={4}>
          <PinDetailComments pinId={pin.id} commentsRef={commentsRef} />
        </Box>
      </Box>
    </Box>
  );
};

export default PinDetailContent;