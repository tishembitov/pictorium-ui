// src/modules/explore/index.ts

// Types
export type {
    ExploreTab,
    ExploreTabConfig,
    FeaturedCollection,
    ExploreCategoryItem,
    ExploreSectionConfig,
    ExploreData,
  } from './types/explore.types';
  
  export {
    EXPLORE_TABS,
    CATEGORY_ICONS,
    getCategoryEmoji,
  } from './types/explore.types';
  
  // Hooks
  export { useExploreData } from './hooks/useExploreData';
  
  // Components
  export { ExploreHeader } from './components/ExploreHeader';
  export { ExploreTabs } from './components/ExploreTabs';
  export { ExploreHero } from './components/ExploreHero';
  export { ExploreCategoryBar } from './components/ExploreCategoryBar';
  export { ExploreSection } from './components/ExploreSection';
  export { HorizontalPinCarousel } from './components/HorizontalPinCarousel';
  export { ExploreFeed } from './components/ExploreFeed';