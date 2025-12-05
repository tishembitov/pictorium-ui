// src/utils/jwt.ts

/**
 * JWT Utilities
 *
 * NOTE: Для работы с Keycloak используйте plugins/keycloak.ts
 * Эти утилиты для работы с произвольными JWT токенами
 */

export interface JWTPayload {
  sub: string
  email?: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: Record<string, { roles: string[] }>
  exp: number
  iat: number
  iss: string
  [key: string]: unknown
}

/**
 * Декодировать JWT токен (без верификации подписи)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('[JWT] Error decoding token:', error)
    return null
  }
}

/**
 * Получить user ID из токена
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token)
  return payload?.sub ?? null
}

/**
 * Проверить, истёк ли токен
 */
export function isTokenExpired(token: string, bufferSeconds: number = 0): boolean {
  const payload = decodeJWT(token)
  if (!payload?.exp) return true

  const now = Math.floor(Date.now() / 1000)
  return payload.exp - bufferSeconds < now
}

/**
 * Получить время истечения токена
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token)
  if (!payload?.exp) return null

  return new Date(payload.exp * 1000)
}

/**
 * Получить время до истечения в секундах
 */
export function getTimeToExpiration(token: string): number | null {
  const payload = decodeJWT(token)
  if (!payload?.exp) return null

  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, payload.exp - now)
}
