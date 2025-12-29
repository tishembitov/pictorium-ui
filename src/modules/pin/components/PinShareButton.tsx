// src/modules/pin/components/PinShareButton.tsx

import React from 'react';
import { ShareButton } from '@/shared/components';
import { buildPinShareUrl } from '../utils/pinUtils';
import type { PinResponse } from '../types/pin.types';

interface PinShareButtonProps {
  pin: PinResponse;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay';
}

export const PinShareButton: React.FC<PinShareButtonProps> = ({
  pin,
  size = 'md',
  variant = 'default',
}) => {
  const shareUrl = buildPinShareUrl(pin.id);
  const shareTitle = pin.title || 'Check out this pin!';

  return (
    <ShareButton
      url={shareUrl}
      title={shareTitle}
      description={pin.description || undefined}
      size={size}
      variant={variant}
      tooltipText="Share"
    />
  );
};

export default PinShareButton;