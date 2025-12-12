// src/shared/components/modals/BaseModal.tsx
import React, { type ReactNode, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  FixedZIndex,
  Layer,
} from 'gestalt';
import { Z_INDEX } from '../../utils/constants';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnClickOutside?: boolean;
  accessibilityLabel: string;
  preventBodyScroll?: boolean;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  accessibilityLabel,
  preventBodyScroll = true,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventBodyScroll) return undefined;
    
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    
    return undefined;
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleDismiss = closeOnClickOutside ? onClose : () => {};

  return (
    <Layer zIndex={new FixedZIndex(Z_INDEX.MODAL)}>
      <Modal
        accessibilityModalLabel={accessibilityLabel}
        heading={title}
        subHeading={subtitle}
        onDismiss={handleDismiss}
        size={size}
        footer={footer}
      >
        <Box padding={4}>
          {children}
        </Box>
      </Modal>
    </Layer>
  );
};

export default BaseModal;