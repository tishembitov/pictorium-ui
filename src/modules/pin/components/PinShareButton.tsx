// src/modules/pin/components/PinShareButton.tsx

import React, { useState, useCallback } from 'react';
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

export const PinShareButton: React.FC<PinShareButtonProps> = ({
  pin,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  
  const { copy } = useCopyToClipboard();
  const { toast } = useToast();

  const shareUrl = buildPinShareUrl(pin.id);

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

  const handleShareWhatsApp = useCallback(() => {
    const text = pin.title || 'Check out this pin!';
    const url = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [pin.title, shareUrl]);

  const handleShareEmail = useCallback(() => {
    const subject = pin.title || 'Check out this pin!';
    const body = `I found this on Pictorium and thought you might like it!\n\n${shareUrl}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    globalThis.open(url);
    setIsOpen(false);
  }, [pin.title, shareUrl]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setAnchorRef = useCallback((node: HTMLButtonElement | null) => {
    setAnchorElement(node);
  }, []);

  const iconButtonSize = size === 'sm' ? 'xs' : size === 'lg' ? 'lg' : 'md';

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
          <Dropdown.Section label="Share to">
            <Dropdown.Item
              onSelect={handleShareFacebook}
              option={{ value: 'facebook', label: 'Facebook' }}
            />
            <Dropdown.Item
              onSelect={handleShareTwitter}
              option={{ value: 'twitter', label: 'Twitter' }}
            />
            <Dropdown.Item
              onSelect={handleShareWhatsApp}
              option={{ value: 'whatsapp', label: 'WhatsApp' }}
            />
            <Dropdown.Item
              onSelect={handleShareEmail}
              option={{ value: 'email', label: 'Email' }}
            />
          </Dropdown.Section>
          <Dropdown.Section label="Other options">
            <Dropdown.Item
              onSelect={handleCopyLink}
              option={{ value: 'copy', label: 'Copy link' }}
            />
          </Dropdown.Section>
        </Dropdown>
      )}
    </>
  );
};

export default PinShareButton;