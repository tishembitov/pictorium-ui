<!-- src/components/features/pin/PinCreateForm.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCreatePin } from '@/composables/api/useCreatePin'
import { useCategories } from '@/composables/api/useTagSearch'
import { useToast } from '@/composables/ui/useToast'
import { useForm } from '@/composables/form/useForm'
import { randomTagColor } from '@/utils/colors'
import FileUpload from '@/components/ui/FileUpload.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import TagBadge from '@/components/ui/TagBadge.vue'
import BackButton from '@/components/common/BackButton.vue'
import MediaErrorDialog from '@/components/ui/MediaErrorDialog.vue'

const router = useRouter()
const { error: showError, success } = useToast()

// Composables
const createPin = useCreatePin()
const { categories, fetch: fetchCategories, isLoading: isLoadingCategories } = useCategories()

// Form with validation
const {
  values: formValues,
  handleSubmit,
  isSubmitting,
} = useForm({
  initialValues: {
    title: '',
    description: '',
    href: '',
  },
  onSubmit: submitPin,
})

// Tags state
const tagToAdd = ref('')
const searchValue = ref('')
const selectedTags = ref<string[]>([])
const availableTags = ref<Array<{ id: string; name: string; color: string }>>([])

// Error dialog
const showFileError = ref(false)

// Computed
const filteredTags = computed(() => {
  const query = searchValue.value.trim().toLowerCase()
  if (!query) return availableTags.value
  return availableTags.value.filter((tag) => tag.name.toLowerCase().includes(query))
})

const canSubmit = computed(() => {
  return createPin.file.value !== null && !createPin.isCreating.value
})

// Load categories/tags
onMounted(async () => {
  try {
    await fetchCategories(50)
    availableTags.value = categories.value.map((cat) => ({
      id: cat.tagId,
      name: cat.tagName,
      color: randomTagColor(),
    }))
  } catch (error) {
    console.error('[PinCreateForm] Failed to load tags:', error)
  }
})

// Methods
function addCustomTag() {
  const trimmed = tagToAdd.value.trim()
  if (!trimmed) return

  // Add to available if not exists
  const exists = availableTags.value.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
  if (!exists) {
    availableTags.value.unshift({
      id: `custom-${Date.now()}`,
      name: trimmed,
      color: randomTagColor(),
    })
  }

  // Add to selected
  if (!selectedTags.value.includes(trimmed)) {
    selectedTags.value.push(trimmed)
  }

  tagToAdd.value = ''
}

function toggleTag(tagName: string) {
  const index = selectedTags.value.indexOf(tagName)
  if (index === -1) {
    selectedTags.value.push(tagName)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

function isTagSelected(tagName: string) {
  return selectedTags.value.includes(tagName)
}

async function submitPin() {
  if (!canSubmit.value) {
    showError('Please upload a file')
    return
  }

  try {
    const pin = await createPin.create({
      title: formValues.title.trim() || undefined,
      description: formValues.description.trim() || undefined,
      href: formValues.href.trim() || undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    })

    success('Pin created!')
    router.push(`/pin/${pin.id}`)
  } catch (error: any) {
    if (error?.response?.status === 415) {
      showFileError.value = true
    } else {
      showError(error?.message || 'Failed to create pin')
    }
  }
}

function handleFileError(errors: string[]) {
  showError(errors[0] || 'Invalid file')
}

function goBack() {
  router.back()
}
</script>

<template>
  <!-- File error dialog -->
  <MediaErrorDialog v-model="showFileError" />

  <div class="ml-20 mt-20">
    <!-- Loading spinner -->
    <BaseLoader v-if="createPin.isCreating.value" variant="colorful" size="lg" fullscreen />

    <div v-else class="grid grid-cols-2 mt-10 mr-72 gap-10">
      <!-- Back button -->
      <BackButton class="absolute top-4 left-20 ml-20 mt-20" />

      <!-- Left column: File upload -->
      <div class="ml-56">
        <label for="pin-media-upload" class="cursor-pointer block">
          <FileUpload
            v-model="createPin.file.value"
            :show-preview="true"
            preview-width="271.84px"
            :min-width="200"
            :min-height="300"
            :max-video-duration="30"
            @error="handleFileError"
          />
        </label>

        <BaseButton
          @click="handleSubmit"
          :loading="createPin.isCreating.value"
          :disabled="!canSubmit"
          full-width
          variant="primary"
          class="mt-10"
        >
          Create Pin
        </BaseButton>
      </div>

      <!-- Right column: Form fields -->
      <div class="space-y-7 mt-2 mb-10">
        <!-- Title -->
        <BaseInput v-model="formValues.title" placeholder="Add title" rounded="full" size="md" />

        <!-- Description -->
        <BaseTextarea
          v-model="formValues.description"
          placeholder="Add description"
          :rows="3"
          rounded="xl"
        />

        <!-- Link -->
        <BaseInput
          v-model="formValues.href"
          type="url"
          placeholder="Add link (any website link)"
          rounded="full"
          size="md"
        />

        <!-- Tags section -->
        <div class="mt-5">
          <h3 class="text-md mb-2 text-gray-600">Add Tags to Pin</h3>

          <!-- Create new tag -->
          <div class="flex items-center space-x-2 mb-4">
            <BaseButton variant="primary" size="sm" @click="addCustomTag"> Create </BaseButton>
            <BaseInput
              v-model="tagToAdd"
              placeholder="Create Tag"
              rounded="full"
              size="sm"
              class="flex-1"
              @enter="addCustomTag"
            />
          </div>

          <!-- Search tags -->
          <BaseInput
            v-model="searchValue"
            placeholder="Search Tag"
            rounded="full"
            size="sm"
            class="mb-4"
          />

          <!-- Tags list -->
          <div class="flex flex-wrap gap-2" v-auto-animate>
            <TagBadge
              v-for="tag in filteredTags"
              :key="tag.id"
              :label="tag.name"
              :color="tag.color"
              :selected="isTagSelected(tag.name)"
              clickable
              @click="toggleTag(tag.name)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
