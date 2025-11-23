export interface JWTPayload {
  sub: string // Keycloak subject (user ID)
  email?: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
  exp: number
  iat: number
  iss: string
  [key: string]: unknown
}

// Decode JWT token (из старого кода)
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

// Get user ID from token
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJWT(token)
  return payload?.sub || null
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload?.exp) return true

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

// Get token expiration time
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token)
  if (!payload?.exp) return null

  return new Date(payload.exp * 1000)
}

// Check if user has role (Keycloak)
export function hasRole(token: string, role: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return false

  // Check realm roles
  if (payload.realm_access?.roles?.includes(role)) return true

  // Check resource roles
  if (payload.resource_access) {
    for (const resource of Object.values(payload.resource_access)) {
      if (resource.roles?.includes(role)) return true
    }
  }

  return false
}

// Get all user roles
export function getUserRoles(token: string): string[] {
  const payload = decodeJWT(token)
  if (!payload) return []

  const roles: string[] = []

  // Add realm roles
  if (payload.realm_access?.roles) {
    roles.push(...payload.realm_access.roles)
  }

  // Add resource roles
  if (payload.resource_access) {
    for (const resource of Object.values(payload.resource_access)) {
      if (resource.roles) {
        roles.push(...resource.roles)
      }
    }
  }

  return [...new Set(roles)] // Remove duplicates
}
