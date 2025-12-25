// src/modules/pin/components/detail/PinDetailContent.tsx

import React from 'react';
import { Box, Divider } from 'gestalt';
import { PinDetailHeader } from './PinDetailHeader';
import { PinDetailActions } from './PinDetailActions';
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

/**
 * Правая часть детальной страницы пина.
 * Ответственность: компоновка всех информационных блоков.
 */
export const PinDetailContent: React.FC<PinDetailContentProps> = ({
  pin,
  onBack,
}) => {
  const { commentsRef, scrollToComments } = useScrollToComments();

  return (
    <Box padding={4} height="100%">
      {/* Header with navigation and menu */}
      <PinDetailHeader pin={pin} onBack={onBack} />

      <Divider />

      {/* Main Actions */}
      <PinDetailActions pin={pin} />

      <Divider />

      {/* Pin Info: title, description, link, tags */}
      <Box paddingY={3}>
        <PinDetailInfo pin={pin} />
      </Box>

      <Divider />

      {/* Stats */}
      <PinDetailStats pin={pin} onCommentsClick={scrollToComments} />

      <Divider />

      {/* Author */}
      <PinDetailAuthor userId={pin.userId} />

      <Divider />

      {/* Comments */}
      <PinDetailComments pinId={pin.id} commentsRef={commentsRef} />
    </Box>
  );
};

export default PinDetailContent;