<!-- src/components/features/comments/CommentReplyItem.vue -->
<script setup lang="ts">
/**
 * CommentReplyItem - Один ответ на комментарий
 * ✅ Компонент был чистым
 */

import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { CommentWithBlob } from '@/types'
import { isVideoUrl } from '@/utils/media'
import CommentActions from './CommentActions.vue'

export interface CommentReplyItemProps {
  reply: CommentWithBlob
  userImage?: string | null
  username?: string
}

const props = defineProps<CommentReplyItemProps>()

const emit = defineEmits<{
  (e: 'like', commentId: string): void
  (e: 'delete', commentId: string): void
}>()

// Local state
const isLiked = ref(props.reply.isLiked)
const likeCount = ref(props.reply.likeCount)

// Sync
watch(
  () => props.reply.isLiked,
  (val) => {
    isLiked.value = val
  },
)

watch(
  () => props.reply.likeCount,
  (val) => {
    likeCount.value = val
  },
)

// isVideoUrl из utils/media
const isVideo = computed(() => {
  if (!props.reply.imageUrl) return false
  return isVideoUrl(props.reply.imageUrl)
})

const isImage = computed(() => props.reply.imageBlobUrl && !isVideo.value)

function handleLikeChange(liked: boolean, count: number) {
  isLiked.value = liked
  likeCount.value = count
  emit('like', props.reply.id)
}

function handleDelete() {
  emit('delete', props.reply.id)
}
</script>

<template>
  <div class="flex flex-col mb-2">
    <RouterLink
      :to="`/user/${username}`"
      class="flex items-center space-x-2 hover:underline cursor-pointer"
    >
      <img
        v-if="userImage"
        :src="userImage"
        alt="User Image"
        class="w-10 h-10 rounded-full object-cover"
      />
      <div
        v-else
        class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
      >
        {{ username?.charAt(0).toUpperCase() || '?' }}
      </div>
      <span class="font-bold">{{ username }}</span>
    </RouterLink>

    <span v-if="reply.content" class="font-medium ml-12 mr-12">
      {{ reply.content }}
    </span>

    <div v-if="reply.imageBlobUrl" class="flex flex-row ml-12">
      <img
        v-if="isImage"
        :src="reply.imageBlobUrl"
        alt="comment image"
        class="h-32 w-32 object-cover rounded-lg"
      />
      <video
        v-if="isVideo"
        :src="reply.imageBlobUrl"
        alt="comment video"
        class="h-32 w-32 object-cover rounded-lg"
        autoplay
        loop
        muted
      />
    </div>

    <div class="flex items-center space-x-2 ml-12 mt-2">
      <CommentActions
        :comment-id="reply.id"
        :user-id="reply.userId"
        :is-liked="isLiked"
        :like-count="likeCount"
        :created-at="reply.createdAt"
        :show-reply-button="false"
        @delete="handleDelete"
        @like-change="handleLikeChange"
      />
    </div>
  </div>
</template>
