// src/shared/components/ShareButton.tsx

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

interface ShareButtonProps {
  /** URL to share */
  url: string;
  /** Text/title for sharing */
  title?: string;
  /** Description for some platforms */
  description?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'overlay';
  /** Tooltip text */
  tooltipText?: string;
}

type IconButtonSize = 'xs' | 'md' | 'lg';

const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): IconButtonSize => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title = '',
  description = '',
  size = 'md',
  variant = 'default',
  tooltipText = 'Share',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  
  const { copy } = useCopyToClipboard();
  const { toast } = useToast();

  const shareText = title || description || 'Check this out!';

  const handleCopyLink = useCallback(async () => {
    const success = await copy(url);
    if (success) {
      toast.copy.link();
    }
    setIsOpen(false);
  }, [copy, url, toast]);

  const handleSharePinterest = useCallback(() => {
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(shareText)}`;
    globalThis.open(pinterestUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [url, shareText]);

  const handleShareInstagram = useCallback(() => {
    // Instagram не поддерживает прямой шаринг через URL
    // Копируем ссылку и показываем подсказку
    void copy(url);
    toast.copy.link();
    setIsOpen(false);
  }, [copy, url, toast]);

  const handleShareTikTok = useCallback(() => {
    // TikTok тоже не поддерживает прямой шаринг
    void copy(url);
    toast.copy.link();
    setIsOpen(false);
  }, [copy, url, toast]);

  const handleShareTelegram = useCallback(() => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
    globalThis.open(telegramUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [url, shareText]);

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
  const bgColor = variant === 'overlay' ? 'transparentDarkGray' : 'lightGray';
  const iconColor = variant === 'overlay' ? 'white' : 'darkGray';

  return (
    <Box display="inlineBlock">
      <Tooltip text={tooltipText}>
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel={tooltipText}
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
          id="share-dropdown"
          onDismiss={handleDismiss}
        >
          <Dropdown.Item
            onSelect={handleCopyLink}
            option={{ value: 'copy', label: 'Copy link' }}
          />
          <Dropdown.Item
            onSelect={handleSharePinterest}
            option={{ value: 'pinterest', label: 'Share on Pinterest' }}
          />
          <Dropdown.Item
            onSelect={handleShareInstagram}
            option={{ value: 'instagram', label: 'Share on Instagram' }}
          />
          <Dropdown.Item
            onSelect={handleShareTikTok}
            option={{ value: 'tiktok', label: 'Share on TikTok' }}
          />
          <Dropdown.Item
            onSelect={handleShareTelegram}
            option={{ value: 'telegram', label: 'Share on Telegram' }}
          />
        </Dropdown>
      )}
    </Box>
  );
};

export default ShareButton;