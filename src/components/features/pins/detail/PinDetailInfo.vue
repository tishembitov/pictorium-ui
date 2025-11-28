<!-- src/components/features/pins/detail/PinDetailInfo.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { PinWithBlob } from '@/types'
import { useUsersWithAvatars } from '@/composables/api/useUsersWithAvatars'
import { useTagSearch } from '@/composables/api/useTagSearch'
import { usePinActions } from '@/composables/api/usePinActions'
import { useSelectedBoard } from '@/composables/api/useSelectedBoard'
import { randomTagColor } from '@/utils/colors'
import PinLikesPopover from '@/components/features/likes/PinLikesPopover.vue'
import PinComments from '@/components/features/comments/PinComments.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import TagBadge from '@/components/features/tags/TagBadge.vue'

export interface PinDetailInfoProps {
  pin: PinWithBlob
}

const props = defineProps<PinDetailInfoProps>()

const emit = defineEmits<{
  (e: 'like'): void
  (e: 'unlike'): void
  (e: 'showLikesModal'): void
  (e: 'openBoardSelector'): void
  (e: 'tagClick', tagName: string): void
}>()

const router = useRouter()

// ✅ ИСПРАВЛЕНО: composables вместо stores
const { loadUser, getUser } = useUsersWithAvatars()

// ✅ ИСПРАВЛЕНО: getter для реактивности
const { like, unlike, saveState, saveButtonText, save } = usePinActions(() => props.pin.id)
const { boardTitle } = useSelectedBoard()

// Like state
const localIsLiked = ref(props.pin.isLiked)
const localLikeCount = ref(props.pin.likeCount)
const isLikeProcessing = ref(false)

// Popover state
const showLikesPopover = ref(false)
const insideLikesPopover = ref(false)

// Computed
const accentColor = computed(() => props.pin.rgb || '#ef4444')
const pinUser = computed(() => getUser(props.pin.userId))

const tagsWithColors = computed(() => {
  if (!props.pin.tags?.length) return []
  return props.pin.tags.map((tagName, idx) => ({
    id: `tag-${idx}`,
    name: tagName,
    color: randomTagColor(),
  }))
})

// Handle like
async function handleLike() {
  if (isLikeProcessing.value) return

  const wasLiked = localIsLiked.value
  isLikeProcessing.value = true

  localIsLiked.value = !wasLiked
  localLikeCount.value += wasLiked ? -1 : 1

  try {
    if (wasLiked) {
      await unlike()
      emit('unlike')
    } else {
      await like()
      emit('like')
    }
  } catch (error) {
    localIsLiked.value = wasLiked
    localLikeCount.value += wasLiked ? 1 : -1
  } finally {
    isLikeProcessing.value = false
  }
}

// Handle save
async function handleSave() {
  await save()
}

function handleLikesCountClick() {
  emit('showLikesModal')
}

function handleMouseLeaveLikes() {
  if (!insideLikesPopover.value) {
    showLikesPopover.value = false
  }
}

function handleTagClick(tagName: string) {
  router.push({ path: '/', query: { tag: tagName } })
  emit('tagClick', tagName)
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Top actions row -->
    <div class="flex items-center justify-between w-full p-2">
      <!-- Like button and count -->
      <div class="flex items-center space-x-4 relative">
        <i
          v-if="localIsLiked"
          @click="handleLike"
          :style="{ color: accentColor }"
          class="pi pi-heart-fill text-2xl cursor-pointer transition-transform duration-200 transform hover:scale-150"
          :class="{ 'opacity-50 pointer-events-none': isLikeProcessing }"
        />
        <i
          v-else
          @click="handleLike"
          :style="{ color: accentColor }"
          class="pi pi-heart text-2xl cursor-pointer transition-transform duration-200 transform hover:scale-150"
          :class="{ 'opacity-50 pointer-events-none': isLikeProcessing }"
        />

        <!-- Like count with popover -->
        <div
          v-if="localLikeCount > 0"
          class="font-bold text-2xl relative cursor-pointer"
          @click="handleLikesCountClick"
          @mouseover="showLikesPopover = true"
          @mouseleave="handleMouseLeaveLikes"
        >
          <span :style="{ color: accentColor }">{{ localLikeCount }}</span>

          <div
            v-if="showLikesPopover"
            @mouseover="insideLikesPopover = true"
            @mouseleave="
              insideLikesPopover = false
              showLikesPopover = false
            "
            class="absolute top-[30px] left-[-50px] z-50"
          >
            <PinLikesPopover :pin-id="pin.id" />
          </div>
        </div>
      </div>

      <!-- Save actions -->
      <div class="flex flex-row gap-1">
        <button
          @click.stop="emit('openBoardSelector')"
          class="px-6 py-3 text-sm bg-gray-800 hover:bg-black text-white rounded-3xl transition cursor-pointer"
        >
          {{ boardTitle || 'Profile' }}
        </button>

        <button
          @click="handleSave"
          :style="{ backgroundColor: saveState === 'idle' ? accentColor : '#000' }"
          class="px-6 py-3 text-sm text-white rounded-3xl transition transform hover:scale-105"
          :disabled="saveState === 'saving'"
        >
          {{ saveButtonText }}
        </button>
      </div>
    </div>

    <!-- Title -->
    <div v-if="pin.title">
      <span :style="{ color: accentColor }" class="font-bold text-2xl">
        {{ pin.title }}
      </span>
    </div>

    <!-- Description -->
    <div v-if="pin.description" class="mt-2">
      <span>{{ pin.description }}</span>
    </div>

    <!-- Visit site button -->
    <div v-if="pin.href" class="mt-4 mr-5">
      <a
        target="_blank"
        rel="noopener noreferrer"
        :href="pin.href"
        class="w-full inline-block text-center py-3 bg-neutral-200 text-black font-medium rounded-full hover:bg-neutral-300 transition duration-300"
      >
        Visit site
      </a>
    </div>

    <!-- Tags -->
    <div v-if="tagsWithColors.length > 0" class="flex flex-wrap gap-2 my-2">
      <TagBadge
        v-for="tag in tagsWithColors"
        :key="tag.id"
        :name="tag.name"
        :color="tag.color"
        size="md"
        clickable
        @click="handleTagClick(tag.name)"
      />
    </div>

    <!-- User info -->
    <div v-if="pinUser.username !== 'Loading...'">
      <RouterLink
        :to="`/user/${pinUser.username}`"
        class="inline-flex items-center mt-2 hover:underline cursor-pointer"
      >
        <BaseAvatar v-if="pinUser.image" :src="pinUser.image" :alt="pinUser.username" size="md" />
        <div
          v-else
          class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
        >
          {{ pinUser.username.charAt(0).toUpperCase() }}
        </div>
        <span class="ml-2 text-md font-medium">@{{ pinUser.username }}</span>
      </RouterLink>
    </div>

    <!-- Comments section -->
    <PinComments :pin-id="pin.id" :comment-count="pin.commentCount" :accent-color="accentColor" />
  </div>
</template>
