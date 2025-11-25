// src/composables/index.ts

/**
 * Composables Index - Полный экспорт всех composables
 */

// ============================================================================
// API COMPOSABLES
// ============================================================================
export * from './api/usePinDetail'
export * from './api/usePinActions'
export * from './api/usePinComments'
export * from './api/useRelatedPins' // ✅ ДОБАВЛЕНО
export * from './api/useBoardDetail'
export * from './api/useCommentThread'
export * from './api/useFollow'
export * from './api/useUserProfile'
export * from './api/useTagSearch'
export * from './api/useStorage'
export * from './api/useSelectedBoard'
export * from './api/useSavedPins' // ✅ ДОБАВЛЕНО
export * from './api/useCreatePin' // ✅ ДОБАВЛЕНО

// ============================================================================
// AUTH COMPOSABLES
// ============================================================================
export * from './auth/useAuth'
export * from './auth/usePermissions'

// ============================================================================
// UI COMPOSABLES
// ============================================================================
export * from './ui/useConfirm'
export * from './ui/useLoading'
export * from './ui/useModal'
export * from './ui/usePopover'
export * from './ui/useToast'

// ============================================================================
// UTILS COMPOSABLES
// ============================================================================
export * from './utils/useClickOutside'
export * from './utils/useClipboard'
export * from './utils/useDebounce'
export * from './utils/useDocumentTitle'
export * from './utils/useEventListener'
export * from './utils/useFocusTrap'
export * from './utils/useIntersectionObserver'
export * from './utils/useKeyboardShortcuts'
export * from './utils/useLocalStorage'
export * from './utils/useMediaQuery'
export * from './utils/useScrollRestore'

// ============================================================================
// FEATURES COMPOSABLES
// ============================================================================
export * from './features/useAnimations'
export * from './features/useHover'
export * from './features/useVideoPlayer'
export * from './features/useFileUpload'
export * from './features/usePagination'
export * from './features/useSearch'

// ============================================================================
// FORM COMPOSABLES
// ============================================================================
export * from './form/useForm'
export * from './form/useFormValidation'
