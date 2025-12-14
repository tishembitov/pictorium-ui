// src/modules/pin/components/PinShareButton.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  IconButton, 
  Dropdown, 
  Tooltip,
} from 'gestalt';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { buildPinShareUrl } from '../utils/pinUtils';
import type { PinResponse } from '../types/pin.types';

interface PinShareButtonProps {
  pin: PinResponse;
  size?: 'sm' | 'md' | 'lg';
}

// Helper to get icon button size
const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const PinShareButton: React.FC<PinShareButtonProps> = ({
  pin,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Use state instead of ref for anchor element
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  
  const { copy } = useCopyToClipboard();
  const { toast } = useToast();

  const shareUrl = buildPinShareUrl(pin.id);
  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  const handleCopyLink = useCallback(async () => {
    const success = await copy(shareUrl);
    if (success) {
      toast.success(SUCCESS_MESSAGES.COPIED_TO_CLIPBOARD);
    }
    setIsOpen(false);
  }, [copy, shareUrl, toast]);

  const handleShareTwitter = useCallback(() => {
    const text = pin.title || 'Check out this pin!';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [pin.title, shareUrl]);

  const handleShareFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [shareUrl]);

  const handleSharePinterest = useCallback(() => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(pin.title || '')}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [pin.title, shareUrl]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Callback ref to capture the anchor element
  const setAnchorRef = useCallback((node: HTMLButtonElement | null) => {
    setAnchorElement(node);
  }, []);

  return (
    <>
      <Tooltip text="Share">
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="Share pin"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="share"
          onClick={handleToggle}
          size={iconButtonSize}
          bgColor="transparent"
        />
      </Tooltip>

      {isOpen && anchorElement && (
        <Dropdown
          anchor={anchorElement}
          id="pin-share-dropdown"
          onDismiss={handleDismiss}
        >
          <Dropdown.Item
            onSelect={handleCopyLink}
            option={{ value: 'copy', label: 'Copy link' }}
          />
          <Dropdown.Item
            onSelect={handleShareTwitter}
            option={{ value: 'twitter', label: 'Share on Twitter' }}
          />
          <Dropdown.Item
            onSelect={handleShareFacebook}
            option={{ value: 'facebook', label: 'Share on Facebook' }}
          />
          <Dropdown.Item
            onSelect={handleSharePinterest}
            option={{ value: 'pinterest', label: 'Share on Pinterest' }}
          />
        </Dropdown>
      )}
    </>
  );
};

export default PinShareButton;