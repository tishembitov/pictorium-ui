<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import PinLikeButton from '@/components/features/pins/likes/PinLikeButton.vue'
import PinComments from '@/components/features/pins/comments/PinComments.vue'
import PinEditForm from '@/components/features/pins/PinEditForm.vue'
import UserPopover from '@/components/features/user/UserPopover.vue'
import { usePins } from '@/composables/api/usePins'
import { useAuth } from '@/composables/auth/useAuth'
import { useFollow } from '@/composables/api/useUsers'
import { useConfirm } from '@/composables/ui/useConfirm'
import { useToast } from '@/composables/ui/useToast'
import { useDateFormat } from '@/composables/utils'
import { formatCompactNumber } from '@/utils/formatters'
import { copyToClipboard } from '@/utils/helpers'
import type { Pin } from '@/types'

export interface PinDetailInfoProps {
  pin: Pin
}

const props = defineProps<PinDetailInfoProps>()

const emit = defineEmits<{
  (e: 'deleted'): void
  (e: 'updated', pin: Pin): void
}>()

const router = useRouter()
const { user } = useAuth()
const { deletePin, savePin, unsavePin } = usePins()
const { isFollowing, toggle: toggleFollow } = useFollow(props.pin.userId)
const { confirm } = useConfirm()
const { showToast } = useToast()
const { full: createdDate } = useDateFormat(props.pin.createdAt)

// State
const showEditModal = ref(false)
const showUserPopover = ref(false)
const isSaving = ref(false)

// Computed
const isOwner = computed(() => user.value?.id === props.pin.userId)
const canEdit = computed(() => isOwner.value)
const canDelete = computed(() => isOwner.value)

const displayStats = computed(() => ({
  views: formatCompactNumber(props.pin.viewCount || 0),
  likes: formatCompactNumber(props.pin.likeCount),
  comments: formatCompactNumber(props.pin.commentCount),
  saves: formatCompactNumber(props.pin.saveCount),
}))

// Actions
const handleSave = async () => {
  try {
    isSaving.value = true
    if (props.pin.isSaved) {
      await unsavePin(props.pin.id)
      showToast('Removed from saved', 'success')
    } else {
      await savePin(props.pin.id)
      showToast('Pin saved!', 'success')
    }
  } catch (error) {
    console.error('[PinDetailInfo] Save failed:', error)
    showToast('Failed to save pin', 'error')
  } finally {
    isSaving.value = false
  }
}

const handleEdit = () => {
  showEditModal.value = true
}

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Pin',
    message: 'Are you sure you want to delete this pin? This action cannot be undone.',
    confirmText: 'Delete',
    type: 'danger',
  })

  if (!confirmed) return

  try {
    await deletePin(props.pin.id)
    showToast('Pin deleted successfully!', 'success')
    emit('deleted')
  } catch (error) {
    console.error('[PinDetailInfo] Delete failed:', error)
    showToast('Failed to delete pin', 'error')
  }
}

const handleShare = async () => {
  const url = `${window.location.origin}/pin/${props.pin.id}`
  const success = await copyToClipboard(url)
  if (success) {
    showToast('Link copied to clipboard!', 'success')
  } else {
    showToast('Failed to copy link', 'error')
  }
}

const handleVisitLink = () => {
  if (props.pin.href) {
    window.open(props.pin.href, '_blank')
  }
}

const handleUserClick = () => {
  router.push(`/user/${props.pin.userId}`)
}
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto p-6">
    <!-- Header Actions -->
    <div class="flex items-center justify-between mb-6">
      <!-- Share + More -->
      <div class="flex items-center gap-2">
        <button
          @click="handleShare"
          class="p-3 hover:bg-gray-100 rounded-full transition"
          title="Share"
        >
          <i class="pi pi-share-alt text-xl"></i>
        </button>

        <button
          v-if="canEdit || canDelete"
          class="p-3 hover:bg-gray-100 rounded-full transition"
          title="More options"
        >
          <i class="pi pi-ellipsis-h text-xl"></i>
        </button>
      </div>

      <!-- Save Button -->
      <BaseButton
        :variant="pin.isSaved ? 'secondary' : 'primary'"
        size="md"
        @click="handleSave"
        :loading="isSaving"
      >
        {{ pin.isSaved ? 'Saved' : 'Save' }}
      </BaseButton>
    </div>

    <!-- Link (if exists) -->
    <div v-if="pin.href" class="mb-6">
      <button
        @click="handleVisitLink"
        class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <i class="pi pi-external-link"></i>
        <span class="truncate">{{ pin.href }}</span>
      </button>
    </div>

    <!-- Title -->
    <h1 v-if="pin.title" class="text-3xl font-bold text-gray-900 mb-4">
      {{ pin.title }}
    </h1>

    <!-- Description -->
    <p v-if="pin.description" class="text-gray-700 mb-6 whitespace-pre-wrap">
      {{ pin.description }}
    </p>

    <!-- Tags -->
    <div v-if="pin.tags && pin.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
      <RouterLink
        v-for="tag in pin.tags"
        :key="tag"
        :to="`/search?tag=${encodeURIComponent(tag)}`"
        class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition"
      >
        #{{ tag }}
      </RouterLink>
    </div>

    <!-- Stats -->
    <div class="flex items-center gap-6 mb-6 text-sm text-gray-600">
      <div class="flex items-center gap-2">
        <i class="pi pi-eye"></i>
        <span>{{ displayStats.views }}</span>
      </div>
      <div class="flex items-center gap-2">
        <i class="pi pi-heart"></i>
        <span>{{ displayStats.likes }}</span>
      </div>
      <div class="flex items-center gap-2">
        <i class="pi pi-comments"></i>
        <span>{{ displayStats.comments }}</span>
      </div>
      <div class="flex items-center gap-2">
        <i class="pi pi-bookmark"></i>
        <span>{{ displayStats.saves }}</span>
      </div>
    </div>

    <!-- Created Date -->
    <p class="text-sm text-gray-500 mb-6">Created {{ createdDate }}</p>

    <!-- Divider -->
    <hr class="mb-6" />

    <!-- User Info -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3 flex-1">
        <div class="relative">
          <UserAvatar
            :user="{ id: pin.userId, username: pin.userId }"
            size="lg"
            :clickable="true"
            @click="showUserPopover = !showUserPopover"
          />
          <UserPopover v-model="showUserPopover" :user-id="pin.userId" position="bottom" />
        </div>

        <div class="flex-1 min-w-0">
          <p
            @click="handleUserClick"
            class="font-semibold text-gray-900 cursor-pointer hover:underline truncate"
          >
            {{ pin.userId }}
          </p>
          <p class="text-sm text-gray-500">Creator</p>
        </div>
      </div>

      <!-- Follow Button -->
      <BaseButton
        v-if="!isOwner"
        :variant="isFollowing ? 'secondary' : 'primary'"
        size="sm"
        @click="toggleFollow"
      >
        {{ isFollowing ? 'Following' : 'Follow' }}
      </BaseButton>
    </div>

    <!-- Action Buttons (Edit/Delete) -->
    <div v-if="canEdit || canDelete" class="flex items-center gap-2 mb-6">
      <BaseButton v-if="canEdit" variant="outline" size="md" full-width @click="handleEdit">
        <template #icon>
          <i class="pi pi-pencil"></i>
        </template>
        Edit
      </BaseButton>

      <BaseButton v-if="canDelete" variant="danger" size="md" full-width @click="handleDelete">
        <template #icon>
          <i class="pi pi-trash"></i>
        </template>
        Delete
      </BaseButton>
    </div>

    <!-- Divider -->
    <hr class="mb-6" />

    <!-- Like Button -->
    <div class="mb-6">
      <PinLikeButton
        :pin-id="pin.id"
        :is-liked="pin.isLiked"
        :like-count="pin.likeCount"
        size="lg"
        :show-count="true"
        :show-popover="true"
      />
    </div>

    <!-- Divider -->
    <hr class="mb-6" />

    <!-- Comments Section -->
    <div class="flex-1">
      <PinComments
        :pin-id="pin.id"
        :comment-count="pin.commentCount"
        :auto-expand="true"
        :show-title="true"
        max-height="40rem"
        @comment-added="/* refresh pin */"
        @comments-count-changed="/* update count */"
      />
    </div>

    <!-- Edit Modal -->
    <PinEditForm v-model="showEditModal" :pin="pin" @success="emit('updated', $event)" />
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
