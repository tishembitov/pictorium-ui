// src/shared/components/modals/GlobalModals.tsx
import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { ConfirmModal } from './ConfirmModal';

/**
 * Компонент для рендера глобальных модалок на основе uiStore
 */
export const GlobalModals: React.FC = () => {
  const activeModal = useUIStore((state) => state.activeModal);
  const modalData = useUIStore((state) => state.modalData);
  const closeModal = useUIStore((state) => state.closeModal);
  const [isLoading, setIsLoading] = useState(false);

  // Confirm Modal
  if (activeModal === 'confirm' && modalData) {
    const data = modalData as {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
      onConfirm: () => void | Promise<void>;
      onCancel?: () => void;
    };

    const handleConfirm = async () => {
      try {
        setIsLoading(true);
        await data.onConfirm();
        closeModal();
      } catch (error) {
        console.error('Confirm action failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleClose = () => {
      data.onCancel?.();
      closeModal();
    };

    return (
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={data.title}
        message={data.message}
        confirmText={data.confirmText}
        cancelText={data.cancelText}
        destructive={data.destructive}
        isLoading={isLoading}
      />
    );
  }

  // Add other global modals here as needed
  // if (activeModal === 'createBoard') { ... }
  // if (activeModal === 'sharePin') { ... }

  return null;
};

export default GlobalModals;