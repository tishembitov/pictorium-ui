// src/modules/user/components/ProfileShareButton.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  IconButton, 
  Dropdown, 
  Tooltip,
  Box,
} from 'gestalt';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { buildProfileShareUrl } from '../utils/userUtils';
import type { UserResponse } from '../types/user.types';

interface ProfileShareButtonProps {
  user: UserResponse;
  size?: 'sm' | 'md' | 'lg';
}

// Helper to get icon button size
const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const ProfileShareButton: React.FC<ProfileShareButtonProps> = ({
  user,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  
  const { copy } = useCopyToClipboard();
  const { toast } = useToast();

  const shareUrl = buildProfileShareUrl(user.username);
  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  const shareText = `Check out ${user.username}'s profile!`;

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

  const handleSharePinterest = useCallback(() => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  }, [shareText, shareUrl]);

  const handleShareTelegram = useCallback(() => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
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

  return (
    <Box display="inlineBlock">
      <Tooltip text="Share profile">
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="Share profile"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="share"
          onClick={handleToggle}
          size={iconButtonSize}
          bgColor="lightGray"
        />
      </Tooltip>

      {isOpen && anchorElement && (
        <Dropdown
          anchor={anchorElement}
          id="profile-share-dropdown"
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
          <Dropdown.Item
            onSelect={handleShareTelegram}
            option={{ value: 'telegram', label: 'Share on Telegram' }}
          />
        </Dropdown>
      )}
    </Box>
  );
};

export default ProfileShareButton;