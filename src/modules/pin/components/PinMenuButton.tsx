// src/modules/pin/components/PinMenuButton.tsx

import React, { useState, useCallback } from 'react';
import { IconButton, Dropdown, Tooltip, Box } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsOwner } from '@/modules/auth';
import { useDeletePin } from '../hooks/useDeletePin';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { useToast } from '@/shared/hooks/useToast';
import { useDownloadImage } from '@/modules/storage';
import { buildPath } from '@/app/router/routes';
import type { PinResponse } from '../types/pin.types';

interface PinMenuButtonProps {
  pin: PinResponse;
  onDelete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay';
}

type IconButtonSize = 'xs' | 'md' | 'lg';
type IconButtonBgColor = 'transparent' | 'transparentDarkGray' | 'white';

const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): IconButtonSize => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

const getIconButtonBgColor = (variant: 'default' | 'overlay'): IconButtonBgColor => {
  return variant === 'overlay' ? 'transparentDarkGray' : 'transparent';
};

export const PinMenuButton: React.FC<PinMenuButtonProps> = ({
  pin,
  onDelete,
  size = 'md',
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isOwner = useIsOwner(pin.userId);
  const { confirm } = useConfirmModal();
  const { toast } = useToast();
  const { download, isDownloading } = useDownloadImage();

  const { deletePin } = useDeletePin({
    onSuccess: () => {
      onDelete?.();
    },
    navigateOnSuccess: !onDelete,
  });

  const handleEdit = useCallback(() => {
    navigate(buildPath.pinEdit(pin.id));
    setIsOpen(false);
  }, [navigate, pin.id]);

  const handleDelete = useCallback(() => {
    setIsOpen(false);
    confirm({
      title: 'Delete this Pin?',
      message: 'This can\'t be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deletePin(pin.id),
    });
  }, [confirm, deletePin, pin.id]);

  const handleReport = useCallback(() => {
    toast.info('Report feature coming soon');
    setIsOpen(false);
  }, [toast]);

  const handleDownload = useCallback(async () => {
    setIsOpen(false);
    
    try {
      await download(pin.imageId, {
        fileName: pin.title || 'pin-image',
        onSuccess: () => {
          toast.download.success();
        },
      });
    } catch {
      // ✅ Исправлено: используем существующий метод
      toast.download.error('Failed to download image');
    }
  }, [download, pin.imageId, pin.title, toast]);

  const handleHidePin = useCallback(() => {
    toast.info('Pin hidden from your feed');
    setIsOpen(false);
  }, [toast]);

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
      <Tooltip text="More options">
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="More options"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="ellipsis"
          onClick={handleToggle}
          size={iconButtonSize}
          bgColor={bgColor}
          iconColor={iconColor}
        />
      </Tooltip>

      {isOpen && anchorElement && (
        <Dropdown
          anchor={anchorElement}
          id="pin-menu-dropdown"
          onDismiss={handleDismiss}
        >
          <Dropdown.Item
            onSelect={handleDownload}
            option={{ 
              value: 'download', 
              label: isDownloading ? 'Downloading...' : 'Download image' 
            }}
          />
          
          {!isOwner && isAuthenticated && (
            <Dropdown.Item
              onSelect={handleHidePin}
              option={{ value: 'hide', label: 'Hide Pin' }}
            />
          )}
          
          {isOwner && (
            <>
              <Dropdown.Item
                onSelect={handleEdit}
                option={{ value: 'edit', label: 'Edit Pin' }}
              />
              <Dropdown.Item
                onSelect={handleDelete}
                option={{ value: 'delete', label: 'Delete Pin' }}
              />
            </>
          )}
          
          {isAuthenticated && !isOwner && (
            <Dropdown.Item
              onSelect={handleReport}
              option={{ value: 'report', label: 'Report Pin' }}
            />
          )}
        </Dropdown>
      )}
    </Box>
  );
};

export default PinMenuButton;