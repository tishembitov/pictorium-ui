// src/modules/pin/components/PinShareButton.tsx

import React, { useState, useCallback } from 'react';
import { 
  IconButton, 
  Dropdown, 
  Tooltip,
  Box,
} from 'gestalt';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { buildPinShareUrl } from '../utils/pinUtils';
import type { PinResponse } from '../types/pin.types';

interface PinShareButtonProps {
  pin: PinResponse;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay';
}

type IconButtonSize = 'xs' | 'md' | 'lg';
type IconButtonBgColor = 'transparent' | 'transparentDarkGray';

const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): IconButtonSize => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

const getIconButtonBgColor = (variant: 'default' | 'overlay'): IconButtonBgColor => {
  return variant === 'overlay' ? 'transparentDarkGray' : 'transparent';
};

const buildWhatsAppUrl = (text: string, shareUrl: string): string => {
  const message = `${text} ${shareUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const PinShareButton: React.FC<PinShareButtonProps> = ({
  pin,
  size = 'md',
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  
  const { copy } = useCopyToClipboard();
  const { toast } = useToast();

  const shareUrl = buildPinShareUrl(pin.id);
  const shareText = pin.title || 'Check out this pin!';

  const handleCopyLink = useCallback(async () => {
    const success = await copy(shareUrl);
    if (success) {
      toast.success(SUCCESS_MESSAGES.COPIED_TO_CLIPBOARD);
    }
    setIsOpen(false);
  }, [copy, shareUrl, toast]);

  const handleShareTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [shareText, shareUrl]);

  const handleShareFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [shareUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const url = buildWhatsAppUrl(shareText, shareUrl);
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [shareText, shareUrl]);

  const handleShareEmail = useCallback(() => {
    const subject = shareText;
    const body = `I found this on Pictorium and thought you might like it!\n\n${shareUrl}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    globalThis.open(url);
    setIsOpen(false);
  }, [shareText, shareUrl]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setAnchorRef = useCallback((node: HTMLButtonElement | null) => {
    setAnchorElement(node);
  }, []);

  const iconButtonSize = getIconButtonSize(size);
  const bgColor = getIconButtonBgColor(variant);
  const iconColor = variant === 'overlay' ? 'white' : 'darkGray';

  return (
    <Box>
      <Tooltip text="Share">
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="Share pin"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="share"
          onClick={handleToggle}
          size={iconButtonSize}
          bgColor={bgColor}
          iconColor={iconColor}
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
    </Box>
  );
};

export default PinShareButton;