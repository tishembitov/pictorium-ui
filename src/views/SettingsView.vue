<!-- src/views/SettingsView.vue -->
<script setup lang="ts">
/**
 * SettingsView - Настройки с LogoutButton
 */

import { ref } from 'vue'
import { useCurrentUser } from '@/composables/api/useUserProfile'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'
import { useToast } from '@/composables/ui/useToast'

import AuthGuard from '@/components/features/auth/AuthGuard.vue'
import LogoutButton from '@/components/features/auth/LogoutButton.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import BackButton from '@/components/common/BackButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

const { updateProfile } = useCurrentUser()
const { success, error: showError } = useToast()

useDocumentTitle('Settings')

// ============ STATE ============

const activeSection = ref<'profile' | 'account' | 'privacy'>('profile')
const showDeleteDialog = ref(false)

const formData = ref({
  username: '',
  description: '',
})

// ============ METHODS ============

async function handleSaveProfile() {
  try {
    await updateProfile({
      username: formData.value.username || undefined,
      description: formData.value.description || undefined,
    })
    success('Profile updated!')
  } catch {
    showError('Failed to update profile')
  }
}

// ============ SECTIONS ============

const sections = [
  { id: 'profile' as const, label: 'Profile', icon: 'pi-user' },
  { id: 'account' as const, label: 'Account', icon: 'pi-cog' },
  { id: 'privacy' as const, label: 'Privacy', icon: 'pi-lock' },
]
</script>

<template>
  <AuthGuard title="Sign in to access settings">
    <AppHeader />

    <div class="ml-20 mt-20 px-8">
      <BackButton position="absolute" class="ml-20 mt-20" />

      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Settings</h1>

        <div class="grid grid-cols-4 gap-8">
          <!-- Sidebar -->
          <div class="space-y-2">
            <button
              v-for="section in sections"
              :key="section.id"
              @click="activeSection = section.id"
              :class="[
                'w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3',
                activeSection === section.id ? 'bg-black text-white' : 'hover:bg-gray-100',
              ]"
            >
              <i :class="['pi', section.icon]" />
              {{ section.label }}
            </button>

            <hr class="my-4" />

            <!-- ✅ LogoutButton вместо обычной кнопки -->
            <LogoutButton
              redirect-uri="/"
              confirm-message="Are you sure you want to sign out?"
              class="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-3"
            >
              <i class="pi pi-sign-out" />
              Sign Out
            </LogoutButton>
          </div>

          <!-- Content -->
          <div class="col-span-3">
            <!-- Profile Section -->
            <div v-if="activeSection === 'profile'" class="space-y-6">
              <h2 class="text-xl font-semibold">Profile Settings</h2>

              <BaseInput
                v-model="formData.username"
                label="Username"
                placeholder="Your username"
                rounded="lg"
              />

              <BaseTextarea
                v-model="formData.description"
                label="Bio"
                placeholder="Tell about yourself"
                :rows="4"
                rounded="lg"
              />

              <BaseButton variant="primary" @click="handleSaveProfile"> Save Changes </BaseButton>
            </div>

            <!-- Account Section -->
            <div v-if="activeSection === 'account'" class="space-y-6">
              <h2 class="text-xl font-semibold">Account Settings</h2>

              <div class="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 class="font-medium text-red-800">Danger Zone</h3>
                <p class="text-sm text-red-600 mt-1">
                  Once you delete your account, there is no going back.
                </p>
                <BaseButton variant="danger" class="mt-4" @click="showDeleteDialog = true">
                  Delete Account
                </BaseButton>
              </div>
            </div>

            <!-- Privacy Section -->
            <div v-if="activeSection === 'privacy'" class="space-y-6">
              <h2 class="text-xl font-semibold">Privacy Settings</h2>
              <p class="text-gray-500">Privacy settings coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthGuard>
</template>
