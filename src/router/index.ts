import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Если есть сохраненная позиция (кнопка "назад")
    if (savedPosition) {
      return savedPosition
    }

    // Если есть hash (#section)
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    // По умолчанию - вверх страницы
    // Но для home с keep-alive не скроллим
    if (to.name === 'home' && from.name === 'pin') {
      return false // Не скроллим, сохраняем позицию
    }

    return { top: 0, behavior: 'smooth' }
  },
})

// Настраиваем guards
setupGuards(router)

export default router
