<script setup lang="ts">
import { ref } from 'vue'
import { useDropdown } from '@/composables/ui/usePopover'
import UserAvatar from './UserAvatar.vue'

export interface UserMenuProps {
  user: {
    id: string
    username: string
    email?: string
    imageUrl?: string
  }
  userImage?: string
}

const props = defineProps<UserMenuProps>()

const emit = defineEmits<{
  logout: []
  settings: []
  profile: []
}>()

const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

// ✅ Используем useDropdown вместо BasePopover
const { isOpen, toggle, close } = useDropdown(triggerRef, menuRef, {
  closeOnClickOutside: true,
  closeOnEscape: true,
})

const handleAction = (action: 'profile' | 'settings' | 'logout') => {
  if (action === 'logout') {
    emit('logout')
  } else if (action === 'settings') {
    emit('settings')
  } else if (action === 'profile') {
    emit('profile')
  }
  close()
}
</script>

<template>
  <div class="relative">
    <!-- Trigger -->
    <div ref="triggerRef" @click="toggle" class="cursor-pointer">
      <UserAvatar :user="user" :image-url="userImage" size="md" :clickable="false" />
    </div>

    <!-- Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl p-2 min-w-[200px] z-50"
      >
        <!-- User info -->
        <div class="px-4 py-3 border-b border-gray-200">
          <p class="font-semibold text-gray-900">{{ user.username }}</p>
          <p v-if="user.email" class="text-sm text-gray-500 truncate">{{ user.email }}</p>
        </div>

        <!-- Menu items -->
        <div class="py-2">
          <button
            @click="handleAction('profile')"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
          >
            <i class="pi pi-user" />
            <span>Profile</span>
          </button>

          <button
            @click="handleAction('settings')"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
          >
            <i class="pi pi-cog" />
            <span>Settings</span>
          </button>

          <hr class="my-2" />

          <button
            @click="handleAction('logout')"
            class="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center gap-2"
          >
            <i class="pi pi-sign-out" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
