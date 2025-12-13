// src/modules/user/types/user.types.ts

/**
 * User response from API
 */
export interface UserResponse {
    id: string;
    username: string;
    email: string;
    imageId: string | null;
    bannerImageId: string | null;
    description: string | null;
    instagram: string | null;
    tiktok: string | null;
    telegram: string | null;
    pinterest: string | null;
  }
  
  /**
   * User update request
   */
  export interface UserUpdateRequest {
    username?: string;      // 3-30 chars
    description?: string;   // 0-200 chars
    imageId?: string;       // 0-64 chars
    bannerImageId?: string; // 0-64 chars
    instagram?: string;     // 0-100 chars
    tiktok?: string;        // 0-100 chars
    telegram?: string;      // 0-100 chars
    pinterest?: string;     // 0-100 chars
  }
  
  /**
   * User with additional computed fields
   */
  export interface UserWithStats extends UserResponse {
    followersCount?: number;
    followingCount?: number;
    pinsCount?: number;
    isFollowing?: boolean;
    isCurrentUser?: boolean;
  }
  
  /**
   * Social links type
   */
  export interface SocialLinks {
    instagram: string | null;
    tiktok: string | null;
    telegram: string | null;
    pinterest: string | null;
  }
  
  /**
   * User profile form values
   */
  export interface UserProfileFormValues {
    username: string;
    description: string;
    imageId: string;
    bannerImageId: string;
    instagram: string;
    tiktok: string;
    telegram: string;
    pinterest: string;
  }