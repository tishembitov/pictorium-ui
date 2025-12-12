// src/shared/components/modals/BaseModal.tsx
import React, { type ReactNode } from 'react';
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
}) => {
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