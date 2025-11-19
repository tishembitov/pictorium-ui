import { TAG_COLORS } from './constants'

// Random tag color (из старого кода)
export function randomTagColor(): string {
  const randomIndex = Math.floor(Math.random() * TAG_COLORS.length)
  return TAG_COLORS[randomIndex] ?? '#808080' // Fallback на случай undefined
}

// Extract dominant color from image (для pin.rgb)
// Simplified version - в старом коде не было реализации, только хранение
export function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve('#808080')
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      let r = 0,
        g = 0,
        b = 0

      for (let i = 0; i < data.length; i += 4) {
        r += data[i] ?? 0
        g += data[i + 1] ?? 0
        b += data[i + 2] ?? 0
      }

      const pixelCount = data.length / 4
      r = Math.floor(r / pixelCount)
      g = Math.floor(g / pixelCount)
      b = Math.floor(b / pixelCount)

      resolve(rgbToHex(r, g, b))
    }

    img.onerror = () => {
      resolve('#808080')
    }

    img.src = imageUrl
  })
}

// RGB to HEX converter
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

// HEX to RGB converter
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1]!, 16),
        g: Number.parseInt(result[2]!, 16),
        b: Number.parseInt(result[3]!, 16),
      }
    : null
}

// Lighten color
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const r = Math.min(255, Math.floor(rgb.r + ((255 - rgb.r) * percent) / 100))
  const g = Math.min(255, Math.floor(rgb.g + ((255 - rgb.g) * percent) / 100))
  const b = Math.min(255, Math.floor(rgb.b + ((255 - rgb.b) * percent) / 100))

  return rgbToHex(r, g, b)
}

// Darken color
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const r = Math.max(0, Math.floor(rgb.r - (rgb.r * percent) / 100))
  const g = Math.max(0, Math.floor(rgb.g - (rgb.g * percent) / 100))
  const b = Math.max(0, Math.floor(rgb.b - (rgb.b * percent) / 100))

  return rgbToHex(r, g, b)
}
