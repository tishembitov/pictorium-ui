// src/shared/hooks/useConfirmModal.ts
import { useUIStore } from '../stores/uiStore';

interface ConfirmModalOptions {
  [key: string]: unknown; // Добавляем индексную сигнатуру
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export const useConfirmModal = () => {
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const activeModal = useUIStore((state) => state.activeModal);
  const modalData = useUIStore((state) => state.modalData);

  const confirm = (options: ConfirmModalOptions) => {
    openModal('confirm', options);
  };

  const isOpen = activeModal === 'confirm';

  return {
    confirm,
    isOpen,
    data: modalData as ConfirmModalOptions | null,
    close: closeModal,
  };
};

export default useConfirmModal;