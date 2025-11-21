<script setup lang="ts">
import UserAvatar from '@/components/common/UserAvatar.vue'
import CommentActions from './CommentActions.vue'
import type { Comment } from '@/types'

export interface CommentReplyItemProps {
  reply: Comment
  canDelete?: boolean
}

const props = withDefaults(defineProps<CommentReplyItemProps>(), {
  canDelete: false,
})

const emit = defineEmits<{
  (e: 'like'): void
  (e: 'unlike'): void
  (e: 'delete'): void
}>()

const isImage = (comment: Comment) => {
  return comment.imageUrl && !comment.imageUrl.includes('.mp4')
}

const isVideo = (comment: Comment) => {
  return comment.imageUrl && comment.imageUrl.includes('.mp4')
}
</script>

<template>
  <div class="flex flex-col">
    <!-- User info -->
    <RouterLink
      :to="`/user/${reply.userId}`"
      class="flex items-center gap-2 hover:underline cursor-pointer"
    >
      <UserAvatar
        :user="{ id: reply.userId, username: reply.userId }"
        size="sm"
        :clickable="false"
      />
      <span class="font-bold text-sm">{{ reply.userId }}</span>
    </RouterLink>

    <!-- Content -->
    <p v-if="reply.content" class="font-medium ml-10 mr-12 text-sm text-wrap break-words">
      {{ reply.content }}
    </p>

    <!-- Media -->
    <div v-if="reply.imageUrl" class="flex flex-row ml-10 mt-2">
      <img
        v-if="isImage(reply)"
        :src="reply.imageUrl"
        alt="Reply media"
        class="h-32 w-32 object-cover rounded-lg"
      />
      <video
        v-if="isVideo(reply)"
        :src="reply.imageUrl"
        class="h-32 w-32 object-cover rounded-lg"
        autoplay
        loop
        muted
      ></video>
    </div>

    <!-- Actions -->
    <CommentActions
      :commentId="reply.id"
      :createdAt="reply.createdAt"
      :isLiked="reply.isLiked"
      :likeCount="reply.likeCount"
      :canDelete="canDelete"
      :showReply="false"
      @like="emit('like')"
      @unlike="emit('unlike')"
      @delete="emit('delete')"
    />
  </div>
</template>
