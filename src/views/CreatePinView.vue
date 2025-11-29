<!-- src/views/CreatePinView.vue -->
<script setup lang="ts">
/**
 * CreatePinView - Создание пина с AdvancedTagsSelector
 */

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'

import AuthGuard from '@/components/features/auth/AuthGuard.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import PinCreateForm from '@/components/features/pins/PinCreateForm.vue'

const router = useRouter()
const route = useRoute()

useDocumentTitle('Create Pin')

// Pre-filled tags from query
const initialTags = ref<string[]>([])

// Check for tag in query
const tagFromQuery = route.query.tag
if (typeof tagFromQuery === 'string') {
  initialTags.value = [tagFromQuery]
}

function handleCreated(pinId: string) {
  router.push(`/pin/${pinId}`)
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <AuthGuard title="Sign in to create" description="You need to be logged in to create pins">
    <AppHeader />

    <PinCreateForm :initial-tags="initialTags" @created="handleCreated" @cancel="handleCancel" />
  </AuthGuard>
</template>
