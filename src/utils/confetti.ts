// src/utils/confetti.ts
import JSConfetti from 'js-confetti'

/**
 * Singleton для confetti
 * Использует замыкание вместо глобальной переменной
 */
let instance: JSConfetti | null = null

/**
 * Получить или создать экземпляр confetti
 */
function getConfettiInstance(): JSConfetti {
  instance ??= new JSConfetti()
  return instance
}

/**
 * Default confetti (для регистрации и успешных действий)
 */
export function showConfetti(): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🦄'],
    confettiColors: ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7'],
    confettiRadius: 6,
    confettiNumber: 100,
  })
}

/**
 * Success confetti
 */
export function showSuccessConfetti(): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: ['🎉', '🎊', '✨', '🌟', '⭐'],
    confettiColors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    confettiNumber: 80,
  })
}

/**
 * Error confetti (грустные эмоджи)
 */
export function showErrorConfetti(): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: ['😢', '😞', '💔'],
    confettiNumber: 30,
  })
}

/**
 * Custom confetti
 */
export interface ConfettiOptions {
  emojis?: string[]
  colors?: string[]
  count?: number
  emojiSize?: number
}

export function showCustomConfetti(options: ConfettiOptions = {}): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: options.emojis,
    confettiColors: options.colors,
    confettiNumber: options.count || 100,
    emojiSize: options.emojiSize || 40,
  })
}

/**
 * Очистить canvas
 */
export function clearConfetti(): void {
  if (instance) {
    instance.clearCanvas()
  }
}

/**
 * Уничтожить экземпляр (для cleanup)
 */
export function destroyConfetti(): void {
  if (instance) {
    instance.clearCanvas()
    instance = null
  }
}

/**
 * Проверка, инициализирован ли confetti
 */
export function isConfettiInitialized(): boolean {
  return instance !== null
}
