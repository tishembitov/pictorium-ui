// src/shared/store/index.ts
export { 
    useUIStore, 
    selectIsSidebarOpen,
    selectIsSidebarCollapsed,
    selectIsMobileMenuOpen,
    selectActiveModal,
    selectModalData,
    selectIsGlobalLoading,
  } from './uiStore';
  
  export { 
    useToastStore, 
    selectToasts,
    selectHasToasts,
    type Toast, 
    type ToastType,
    type ToastOptions,
  } from './toastStore';
  
  export { 
    useSearchHistoryStore,
    selectSearchHistory,
    selectHasSearchHistory,
  } from './searchHistoryStore';