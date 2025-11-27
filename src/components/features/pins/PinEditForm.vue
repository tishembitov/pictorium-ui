<!-- src/components/features/pins/PinEditForm.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useCategories } from '@/composables/api/useTagSearch'
import { useForm } from '@/composables/form/useForm'
import { useSuccessToast, useErrorToast } from '@/composables/ui/useToast'
import { randomTagColor } from '@/utils/colors'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TagBadge from '@/components/features/tags/TagBadge.vue'
import type { Pin } from '@/types'

export interface PinEditFormProps {
  pin: Pin
}

const props = defineProps<PinEditFormProps>()

const emit = defineEmits<{
  (e: 'saved', pin: Pin): void
  (e: 'cancel'): void
}>()

// Store (здесь store напрямую оправдан - это форма редактирования)
const pinsStore = usePinsStore()

// Composables
const { categories, fetch: fetchCategories } = useCategories()
const { pinUpdated } = useSuccessToast()
const { showError } = useErrorToast()

// Form state
const { values, isSubmitting, handleSubmit } = useForm({
  initialValues: {
    title: props.pin.title || '',
    description: props.pin.description || '',
    href: props.pin.href || '',
  },
  onSubmit: save,
})

// Tags
const selectedTags = ref<string[]>([...props.pin.tags])
const availableTags = ref<Array<{ id: string; name: string; color: string }>>([])
const searchValue = ref('')

// Computed
const filteredTags = computed(() => {
  const query = searchValue.value.trim().toLowerCase()
  if (!query) return availableTags.value
  return availableTags.value.filter((tag) => tag.name.toLowerCase().includes(query))
})

const hasChanges = computed(() => {
  return (
    values.title !== (props.pin.title || '') ||
    values.description !== (props.pin.description || '') ||
    values.href !== (props.pin.href || '') ||
    JSON.stringify([...selectedTags.value].sort()) !== JSON.stringify([...props.pin.tags].sort())
  )
})

// Load available tags
onMounted(async () => {
  try {
    await fetchCategories(100)
    availableTags.value = categories.value.map((cat) => ({
      id: cat.tagId,
      name: cat.tagName,
      color: randomTagColor(),
    }))

    // Ensure current tags are in the list
    props.pin.tags.forEach((tagName) => {
      if (!availableTags.value.some((t) => t.name === tagName)) {
        availableTags.value.unshift({
          id: `existing-${tagName}`,
          name: tagName,
          color: randomTagColor(),
        })
      }
    })
  } catch (error) {
    console.error('[PinEditForm] Failed to load tags:', error)
  }
})

// Methods
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

async function save() {
  if (!hasChanges.value) {
    emit('cancel')
    return
  }

  try {
    const updated = await pinsStore.updatePin(props.pin.id, {
      title: values.title.trim() || undefined,
      description: values.description.trim() || undefined,
      href: values.href.trim() || undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
    })

    pinUpdated()
    emit('saved', updated)
  } catch (error) {
    showError(error)
  }
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6 p-6">
    <h2 class="text-xl font-bold text-gray-900">Edit Pin</h2>

    <!-- Title -->
    <BaseInput v-model="values.title" label="Title" placeholder="Add a title" rounded="lg" />

    <!-- Description -->
    <BaseTextarea
      v-model="values.description"
      label="Description"
      placeholder="Tell everyone what your Pin is about"
      :rows="4"
      rounded="lg"
    />

    <!-- Link -->
    <BaseInput
      v-model="values.href"
      type="url"
      label="Website link"
      placeholder="Add a link"
      rounded="lg"
    />

    <!-- Tags -->
    <div>
      <label class="block mb-2 text-sm font-medium text-gray-900">Tags</label>

      <BaseInput
        v-model="searchValue"
        placeholder="Search or add tags"
        rounded="lg"
        size="sm"
        class="mb-3"
      />

      <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        <TagBadge
          v-for="tag in filteredTags"
          :key="tag.id"
          :name="tag.name"
          :color="tag.color"
          :selected="isTagSelected(tag.name)"
          size="sm"
          clickable
          @click="toggleTag(tag.name)"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
      <BaseButton variant="ghost" @click="cancel"> Cancel </BaseButton>
      <BaseButton
        variant="primary"
        :loading="isSubmitting"
        :disabled="!hasChanges"
        @click="handleSubmit"
      >
        Save Changes
      </BaseButton>
    </div>
  </div>
</template>
