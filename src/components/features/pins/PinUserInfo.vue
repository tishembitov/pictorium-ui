<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import UserPopover from '@/components/features/user/UserPopover.vue'
import { shouldPositionTop } from '@/utils/positioning'
import type { Pin } from '@/types'

export interface PinUserInfoProps {
  pin: Pin
  showPopover?: boolean
}

const props = withDefaults(defineProps<PinUserInfoProps>(), {
  showPopover: true,
})

const usernameRef = ref<HTMLElement | null>(null)
const showPopoverState = ref(false)
const popoverPosition = ref<'top' | 'bottom'>('bottom')

const handleUsernameClick = async () => {
  if (!props.showPopover) return

  showPopoverState.value = !showPopoverState.value

  if (showPopoverState.value) {
    await nextTick()
    // Calculate position
    if (usernameRef.value) {
      const isTop = shouldPositionTop(usernameRef.value, document.body, 320)
      popoverPosition.value = isTop ? 'bottom' : 'top'
    }
  }
}
</script>

<template>
  <div class="relative flex items-center gap-2">
    <!-- User Avatar -->
    <RouterLink :to="`/user/${pin.userId}`">
      <UserAvatar :user="{ id: pin.userId, username: pin.userId }" size="sm" :clickable="true" />
    </RouterLink>

    <!-- Username (clickable for popover) -->
    <span
      ref="usernameRef"
      @click="handleUsernameClick"
      class="text-sm font-medium cursor-pointer hover:underline"
    >
      {{ pin.userId }}
    </span>

    <!-- User Popover -->
    <UserPopover
      v-if="showPopover"
      v-model="showPopoverState"
      :user-id="pin.userId"
      :position="popoverPosition"
    />
  </div>
</template>
