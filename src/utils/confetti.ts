import JSConfetti from 'js-confetti'

let confettiInstance: JSConfetti | null = null

// Get or create confetti instance
function getConfettiInstance(): JSConfetti {
  if (!confettiInstance) {
    confettiInstance = new JSConfetti()
  }
  return confettiInstance
}

// Default confetti (для регистрации)
export function showConfetti(): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🦄'],
    confettiColors: ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7'],
    confettiRadius: 6,
    confettiNumber: 100,
    emojiSize: 40,
    emojiNumber: 50,
  })
}

// Success confetti
export function showSuccessConfetti(): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: ['🎉', '🎊', '✨', '🌟', '⭐'],
    confettiColors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    confettiNumber: 80,
    emojiNumber: 30,
  })
}

// Custom confetti
export interface ConfettiOptions {
  emojis?: string[]
  colors?: string[]
  count?: number
}

export function showCustomConfetti(options: ConfettiOptions = {}): void {
  const confetti = getConfettiInstance()

  confetti.addConfetti({
    emojis: options.emojis || ['🎉'],
    confettiColors: options.colors || ['#ff0a54', '#ff477e'],
    confettiNumber: options.count || 100,
  })
}

// Cleanup confetti instance
export function destroyConfetti(): void {
  if (confettiInstance) {
    confettiInstance.clearCanvas()
    confettiInstance = null
  }
}
