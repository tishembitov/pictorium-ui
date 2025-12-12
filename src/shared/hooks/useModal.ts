// src/shared/hooks/useModal.ts
import { useUIStore } from '../stores/uiStore';

type ModalType = 
  | 'confirm'
  | 'createBoard'
  | 'editPin'
  | 'sharePin'
  | 'selectBoard'
  | null;

/**
 * Hook to use modal with UI store
 */
export const useModal = () => {
  const activeModal = useUIStore((state) => state.activeModal);
  const modalData = useUIStore((state) => state.modalData);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const setModalData = useUIStore((state) => state.setModalData);

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    setModalData,
    isOpen: (type: ModalType) => activeModal === type,
  };
};

export default useModal;