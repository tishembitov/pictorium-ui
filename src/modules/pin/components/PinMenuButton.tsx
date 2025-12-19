// src/modules/pin/components/PinMenuButton.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { IconButton, Dropdown, Tooltip } from 'gestalt';
import { useNavigate } from 'react-router-dom';
import { useAuth, useIsOwner } from '@/modules/auth';
import { useDeletePin } from '../hooks/useDeletePin';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { useToast } from '@/shared/hooks/useToast';
import { useDownloadImage } from '@/modules/storage';
import { buildPath } from '@/app/router/routeConfig';
import type { PinResponse } from '../types/pin.types';

interface PinMenuButtonProps {
  pin: PinResponse;
  onDelete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const PinMenuButton: React.FC<PinMenuButtonProps> = ({
  pin,
  onDelete,
  size = 'md',
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

  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  const handleEdit = useCallback(() => {
    navigate(buildPath.pinEdit(pin.id));
    setIsOpen(false);
  }, [navigate, pin.id]);

  const handleDelete = useCallback(() => {
    setIsOpen(false);
    confirm({
      title: 'Delete Pin?',
      message: 'This action cannot be undone. Are you sure you want to delete this pin?',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deletePin(pin.id),
    });
  }, [confirm, deletePin, pin.id]);

  const handleReport = useCallback(() => {
    console.log('Report pin:', pin.id);
    setIsOpen(false);
  }, [pin.id]);

  const handleDownload = useCallback(async () => {
    setIsOpen(false);
    
    try {
      await download(pin.imageId, {
        fileName: pin.title || undefined,
        onSuccess: () => {
          toast.success('Image downloaded!');
        },
      });
    } catch {
      toast.error('Failed to download image');
    }
  }, [download, pin.imageId, pin.title, toast]);

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
    <>
      <Tooltip text="More options">
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="More options"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="ellipsis"
          onClick={handleToggle}
          size={iconButtonSize}
          bgColor="transparentDarkGray"
          iconColor="white"
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
          
          {isOwner && (
            <>
              <Dropdown.Item
                onSelect={handleEdit}
                option={{ value: 'edit', label: 'Edit Pin' }}
              />
              <Dropdown.Item
                onSelect={handleDelete}
                option={{ value: 'delete', label: 'Delete Pin' }}
                badge={{ text: 'Danger' }}
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
    </>
  );
};

export default PinMenuButton;