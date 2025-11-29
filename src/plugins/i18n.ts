// src/plugins/i18n.ts
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'

// Сообщения для локализации
const messages = {
  en: {
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      loginWithGoogle: 'Continue with Google',
      loginWithGithub: 'Continue with GitHub',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
    },
    errors: {
      unauthorized: 'Please login to continue',
      forbidden: 'Access denied',
      notFound: 'Not found',
      serverError: 'Server error, please try again later',
    },
  },
  ru: {
    auth: {
      login: 'Войти',
      logout: 'Выйти',
      register: 'Регистрация',
      loginWithGoogle: 'Продолжить с Google',
      loginWithGithub: 'Продолжить с GitHub',
    },
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      cancel: 'Отмена',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
    },
    errors: {
      unauthorized: 'Пожалуйста, войдите для продолжения',
      forbidden: 'Доступ запрещён',
      notFound: 'Не найдено',
      serverError: 'Ошибка сервера, попробуйте позже',
    },
  },
}

// Определяем язык по умолчанию
function getDefaultLocale(): string {
  const saved = localStorage.getItem('locale')
  if (saved) return saved

  const browserLang = navigator.language.split('-')[0]
  return ['en', 'ru'].includes(browserLang) ? browserLang : 'en'
}

export const i18n = createI18n({
  legacy: false, // Используем Composition API
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages,
})

export default i18n
