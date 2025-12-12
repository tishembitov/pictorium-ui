// src/shared/components/modals/ConfirmModal.tsx
import React from 'react';
import { Box, Button, Text, Flex } from 'gestalt';
import { BaseModal } from './BaseModal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const footer = (
    <Flex justifyContent="end" gap={2}>
      <Button
        text={cancelText}
        onClick={onClose}
        size="lg"
        color="gray"
        disabled={isLoading}
      />
      <Button
        text={confirmText}
        onClick={handleConfirm}
        size="lg"
        color="red"
        disabled={isLoading}
      />
    </Flex>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
      accessibilityLabel={title}
      closeOnClickOutside={!isLoading}
    >
      <Box paddingY={2}>
        <Text align="center">{message}</Text>
      </Box>
    </BaseModal>
  );
};

export default ConfirmModal;