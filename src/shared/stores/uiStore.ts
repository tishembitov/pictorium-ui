// src/shared/store/uiStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ModalType = 
  | 'confirm'
  | 'createBoard'
  | 'editPin'
  | 'sharePin'
  | 'selectBoard'
  | null;

// Изменяем тип ModalData на более гибкий
type ModalData = Record<string, unknown> | null;

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Mobile menu
  isMobileMenuOpen: boolean;
  
  // Modal
  activeModal: ModalType;
  modalData: ModalData;
  
  // Global loading
  isGlobalLoading: boolean;
  globalLoadingMessage: string | null;
  
  // Scroll
  scrollPosition: number;
  isScrollingUp: boolean;
}

interface UIActions {
  // Sidebar
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  
  // Mobile menu
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  
  // Modal
  openModal: <T extends Record<string, unknown>>(type: ModalType, data?: T) => void;
  closeModal: () => void;
  setModalData: <T extends Record<string, unknown>>(data: T) => void;
  
  // Global loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Scroll
  setScrollPosition: (position: number) => void;
  setIsScrollingUp: (isUp: boolean) => void;
  
  // Reset
  reset: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  activeModal: null,
  modalData: null,
  isGlobalLoading: false,
  globalLoadingMessage: null,
  scrollPosition: 0,
  isScrollingUp: false,
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Sidebar actions
      openSidebar: () => set({ isSidebarOpen: true }, false, 'openSidebar'),
      closeSidebar: () => set({ isSidebarOpen: false }, false, 'closeSidebar'),
      toggleSidebar: () => 
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, 'toggleSidebar'),
      collapseSidebar: () => set({ isSidebarCollapsed: true }, false, 'collapseSidebar'),
      expandSidebar: () => set({ isSidebarCollapsed: false }, false, 'expandSidebar'),

      // Mobile menu actions
      openMobileMenu: () => set({ isMobileMenuOpen: true }, false, 'openMobileMenu'),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }, false, 'closeMobileMenu'),
      toggleMobileMenu: () => 
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }), false, 'toggleMobileMenu'),

      // Modal actions
      openModal: (type, data) => 
        set({ activeModal: type, modalData: data ?? null }, false, 'openModal'),
      closeModal: () => 
        set({ activeModal: null, modalData: null }, false, 'closeModal'),
      setModalData: (data) => 
        set({ modalData: data }, false, 'setModalData'),

      // Global loading
      setGlobalLoading: (loading, message) => 
        set({ 
          isGlobalLoading: loading, 
          globalLoadingMessage: message ?? null 
        }, false, 'setGlobalLoading'),

      // Scroll
      setScrollPosition: (position) => 
        set({ scrollPosition: position }, false, 'setScrollPosition'),
      setIsScrollingUp: (isUp) => 
        set({ isScrollingUp: isUp }, false, 'setIsScrollingUp'),

      // Reset
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'UIStore' }
  )
);

// Selectors
export const selectIsSidebarOpen = (state: UIStore) => state.isSidebarOpen;
export const selectIsSidebarCollapsed = (state: UIStore) => state.isSidebarCollapsed;
export const selectIsMobileMenuOpen = (state: UIStore) => state.isMobileMenuOpen;
export const selectActiveModal = (state: UIStore) => state.activeModal;
export const selectModalData = (state: UIStore) => state.modalData;
export const selectIsGlobalLoading = (state: UIStore) => state.isGlobalLoading;

export default useUIStore;