// src/modules/pin/components/detail/PinDetailContent.tsx

import React from 'react';
import { Box } from 'gestalt';
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

const SoftDivider: React.FC<{ width?: string; opacity?: number }> = ({ 
  width = '90%', 
  opacity = 0.6 
}) => (
  <Box display="flex" justifyContent="center" paddingY={1}>
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

export const PinDetailContent: React.FC<PinDetailContentProps> = ({
  pin,
  onBack,
}) => {
  const { commentsRef, scrollToComments } = useScrollToComments();
  
  // ✅ Единый локальный state для всех дочерних компонентов
  const { 
    state: localState, 
    toggleLike, 
    markAsSaved, 
    markAsRemoved,
  } = usePinLocalState(pin);

  return (
    <Box padding={4} height="100%">
      {/* Header - получает state и callbacks */}
      <PinDetailHeader 
        pin={pin} 
        localState={localState}
        onToggleLike={toggleLike}
        onSave={markAsSaved}
        onRemove={markAsRemoved}
        onBack={onBack} 
      />

      {/* Pin Info */}
      <Box paddingY={3}>
        <PinDetailInfo pin={pin} />
      </Box>

      {/* Stats - получает localState для актуальных значений */}
      <Box paddingY={2}>
        <PinDetailStats 
          localState={localState}
          commentCount={pin.commentCount}
          viewCount={pin.viewCount}
          onCommentsClick={scrollToComments} 
        />
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