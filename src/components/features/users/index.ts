// src/components/features/users/index.ts
/**
 * User Components Index
 * ✅ ОБНОВЛЕНО: добавлены новые объединенные компоненты
 */

// Profile components
export { default as UserProfile } from './profile/UserProfile.vue'
export { default as UserHeader } from './profile/UserHeader.vue'
export { default as UserStats } from './profile/UserStats.vue'
export { default as UserBio } from './profile/UserBio.vue'
export { default as UserSocialLinks } from './profile/UserSocialLinks.vue'
export { default as UserActions } from './profile/UserActions.vue'
export { default as UserTabs } from './profile/UserTabs.vue'
export { default as UserPins } from './profile/UserPins.vue'
export { default as UserBoards } from './profile/UserBoards.vue'
export { default as UserEditModal } from './profile/UserEditModal.vue'
export { default as AboutUserModal } from './profile/AboutUserModal.vue'
export { default as SendMessageModal } from './profile/SendMessageModal.vue'
export { default as MediaUploadModal } from './MediaUploadModal.vue'
export { default as FollowModal } from './follow/FollowModal.vue'

// Follow components
export { default as FollowButton } from './follow/FollowButton.vue'
export { default as FollowList } from './follow/FollowList.vue'
export { default as FollowUserItem } from './follow/FollowUserItem.vue'

// Standalone components
export { default as UserCard } from './UserCard.vue'
export { default as UserSearchItem } from './UserSearchItem.vue'
export { default as UserPopover } from './UserPopover.vue'

// ✅ Re-export types
export type { UserProfileProps } from './profile/UserProfile.vue'
export type { UserHeaderProps } from './profile/UserHeader.vue'
export type { UserStatsProps } from './profile/UserStats.vue'
export type { UserBioProps } from './profile/UserBio.vue'
export type { UserSocialLinksProps } from './profile/UserSocialLinks.vue'
export type { UserActionsProps } from './profile/UserActions.vue'
export type { UserTabsProps } from './profile/UserTabs.vue'
export type { UserPinsProps } from './profile/UserPins.vue'
export type { UserBoardsProps } from './profile/UserBoards.vue'
export type { UserEditModalProps } from './profile/UserEditModal.vue'
export type { MediaUploadModalProps } from './MediaUploadModal.vue'
export type { FollowModalProps } from './follow/FollowModal.vue'
export type { FollowButtonProps } from './follow/FollowButton.vue'
export type { FollowListProps } from './follow/FollowList.vue'
export type { FollowUserItemProps } from './follow/FollowUserItem.vue'
export type { UserCardProps } from './UserCard.vue'
export type { UserSearchItemProps } from './UserSearchItem.vue'
export type { UserPopoverProps } from './UserPopover.vue'
