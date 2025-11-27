<!-- src/components/auth/RoleGuard.vue -->
<template>
  <!-- Загрузка -->
  <slot v-if="isLoading" name="loading">
    <div class="animate-pulse bg-gray-200 rounded h-32" />
  </slot>

  <!-- Нет доступа -->
  <slot v-else-if="!canAccess" name="forbidden">
    <div class="text-center p-8 bg-yellow-50 rounded-lg">
      <h3 class="text-lg font-medium text-yellow-800">Нет доступа</h3>
      <p class="text-yellow-600 mt-2">У вас недостаточно прав для просмотра этого контента</p>
    </div>
  </slot>

  <!-- Есть доступ -->
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthState } from '@/composables/auth/useAuth'
import { useRoleGuard } from '@/composables/auth/usePermissions'

interface Props {
  /** Требуемые роли (одна из) */
  roles?: string | string[]
  /** Требуемые permissions (одна из) */
  permissions?: string | string[]
  /** Требовать ВСЕ роли/permissions */
  requireAll?: boolean
  /** Скрыть вместо показа "Нет доступа" */
  hideOnForbidden?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  permissions: () => [],
  requireAll: false,
  hideOnForbidden: false,
})

const { isInitialized, isLoading: isInitializing } = useAuthState()

const isLoading = computed(() => !isInitialized.value || isInitializing.value)

// Нормализация
const normalizedRoles = computed(() =>
  Array.isArray(props.roles) ? props.roles : props.roles ? [props.roles] : [],
)

const { canAccess: hasRequiredRoles } = useRoleGuard(normalizedRoles.value)

const canAccess = computed(() => {
  if (normalizedRoles.value.length === 0) return true
  return hasRequiredRoles.value
})
</script>
