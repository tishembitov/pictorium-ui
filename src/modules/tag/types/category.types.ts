// src/modules/tag/types/category.types.ts

/**
 * Pin preview for category display
 */
export interface PinPreview {
    id: string;
    imageId: string;
    thumbnailId?: string;
    videoPreviewId?: string;
  }
  
  /**
   * Category response from API
   * Represents a tag with a representative pin image
   */
  export interface CategoryResponse {
    tagId: string;
    tagName: string;
    pin: PinPreview | null;
  }
  
  /**
   * Category for UI with computed properties
   */
  export interface Category extends CategoryResponse {
    displayName: string;
    imageUrl?: string;
  }