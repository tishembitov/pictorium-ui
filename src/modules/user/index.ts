// src/modules/user/index.ts

// Types
export type {
  UserResponse,
  UserUpdateRequest,
  UserWithStats,
  SocialLinks,
  UserProfileFormValues,
} from './types/user.types';

export type {
  SubscriptionResponse,
  FollowCheckResponse,
  PageUserResponse,
  FollowActionResult,
} from './types/subscription.types';

// API
export { userApi } from './api/userApi';
export { subscriptionApi } from './api/subscriptionApi';

// Hooks
export { useUser } from './hooks/useUser';
export { useUserByUsername } from './hooks/useUserByUsername'
export { useUpdateUser } from './hooks/useUpdateUser';
export { useFollowers, useInfiniteFollowers } from './hooks/useFollowers';
export { useFollowing, useInfiniteFollowing } from './hooks/useFollowing';
export { useFollow } from './hooks/useFollow';
export { useUnfollow } from './hooks/useUnfollow';
export { useFollowCheck } from './hooks/useFollowCheck';

// Components
export { UserAvatar } from './components/UserAvatar';
export { UserCard } from './components/UserCard';
export { UserProfileHeader } from './components/UserProfileHeader';
export { UserProfileForm } from './components/UserProfileForm';
export { ProfileShareButton } from './components/ProfileShareButton';
export { userProfileSchema, type UserProfileFormData } from './components/userProfileSchema';
export { FollowButton } from './components/FollowButton';
export { FollowersList } from './components/FollowersList';
export { FollowingList } from './components/FollowingList';

// Utils
export {
  getDisplayName,
  getUserInitials,
  formatUsername,
  getSocialLinks,
  hasSocialLinks,
  buildSocialUrl,
  getSocialUrls,
  isProfileComplete,
  getProfileCompletionPercentage,
  buildProfileShareUrl,
} from './utils/userUtils';