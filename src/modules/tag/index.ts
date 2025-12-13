// src/modules/tag/index.ts

// Types
export type {
    TagResponse,
    Tag,
    TagSearchParams,
    TagFilter,
  } from './types/tag.types';
  
  export type {
    PinPreview,
    CategoryResponse,
    Category,
  } from './types/category.types';
  
  // API
  export { tagApi } from './api/tagApi';
  
  // Hooks
  export { useTags, useInfiniteTags } from './hooks/useTags';
  export { useTag } from './hooks/useTag';
  export { useSearchTags } from './hooks/useSearchTags';
  export { usePinTags } from './hooks/usePinTags';
  export { useCategories } from './hooks/useCategories';
  
  // Components
  export { TagChip } from './components/TagChip';
  export { TagList } from './components/TagList';
  export { TagInput } from './components/TagInput';
  export { CategoryCard } from './components/CategoryCard';
  export { CategoryGrid } from './components/CategoryGrid';
  export { TagSearch } from './components/TagSearch';