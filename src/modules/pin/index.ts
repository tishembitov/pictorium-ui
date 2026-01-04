// src/modules/pin/index.ts

// Types
export type {
  PinResponse,
  PinCreateRequest,
  PinUpdateRequest,
  PagePinResponse,
  PinWithState,
  PinFormValues,
  PinPreview,
  PinFilter,
  PinScope,
  PinSort,
  PinSortField,
  PinSortDirection,
  ScopeOption
} from './types/pin.types';

export { SCOPE_OPTIONS, SORT_OPTIONS } from './types/pin.types';

export type {
  LikeResponse,
  PageLikeResponse,
  LikeActionResult,
} from './types/pinLike.types';

// API
export { pinApi } from './api/pinApi';
export { pinLikeApi } from './api/pinLikeApi';
export { pinCommentApi } from './api/pinCommentApi';

// Hooks
export { usePins, useUserPins, useRelatedPins } from './hooks/usePins';
export { usePin } from './hooks/usePin';
export { useCreatePin } from './hooks/useCreatePin';
export { useUpdatePin } from './hooks/useUpdatePin';
export { useDeletePin } from './hooks/useDeletePin';
export { useLikePin } from './hooks/useLikePin';
export { useUnlikePin } from './hooks/useUnlikePin';
export { usePinLikes, useInfinitePinLikes } from './hooks/usePinLikes';
export { usePinComments, useInfinitePinComments } from './hooks/usePinComments';
export { useCreateComment } from './hooks/useCreateComment';
export { useScrollToComments } from './hooks/useScrollToComments';

// Store
export { usePinPreferencesStore, selectSort } from './stores/pinPreferencesStore';

// Components
export { PinCard } from './components/PinCard';
export { PinCardSkeleton } from './components/PinCardSkeleton';
export { PinGrid } from './components/PinGrid';
export { PinCreateForm } from './components/PinCreateForm';
export { pinCreateSchema, type PinCreateFormData } from './components/pinCreateSchema';
export { PinEditForm } from './components/PinEditForm';
export { pinEditSchema, type PinEditFormData } from './components/pinEditSchema';
export { PinLikeButton } from './components/PinLikeButton';
export { PinSaveButton } from './components/PinSaveButton';
export { PinShareButton } from './components/PinShareButton';
export { PinMenuButton } from './components/PinMenuButton';
export { PinSearchBar } from './components/PinSearchBar';
export { PinTagFilter } from './components/filters/PinTagFilter';
export { PinScopeSelect } from './components/filters/PinScopeSelect';
export { PinSortSelect } from './components/filters/PinSortSelect';
export { PinSearchInput } from './components/filters/PinSearchInput';
export { CompactSaveSection } from './components/CompactSaveSection';
export { PinSaveSection } from './components/PinSaveSection';

export { PinDetail } from './components/detail/PinDetail';
export { PinDetailCard } from './components/detail/PinDetailCard';
export { PinDetailImage } from './components/detail/PinDetailImage';
export { PinDetailContent } from './components/detail/PinDetailContent';
export { PinDetailHeader } from './components/detail/PinDetailHeader';
export { PinDetailInfo } from './components/detail/PinDetailInfo';
export { PinDetailAuthor } from './components/detail/PinDetailAuthor';
export { PinDetailStats } from './components/detail/PinDetailStats';
export { PinDetailComments } from './components/detail/PinDetailComments';

// Utils
export {
  getPinImageId,
  hasVideoPreview,
  getPinTitle,
  getPinDescriptionPreview,
  hasPinLink,
  formatPinLink,
  ensurePinLinkProtocol,
  buildPinShareUrl,
  isPinOwner,
  calculateEngagementScore,
  sortPinsByEngagement,
  groupPinsByDate,
  filterPinsByTags,
  searchPins,
  isPinSaved,
} from './utils/pinUtils';