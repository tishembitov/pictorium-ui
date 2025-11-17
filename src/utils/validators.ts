import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  PIN_TITLE_MAX_LENGTH,
  PIN_DESCRIPTION_MAX_LENGTH,
  COMMENT_MAX_LENGTH,
  TAG_MAX_LENGTH,
} from './constants'

// Username validation (3-30 chars, alphanumeric + underscore)
export function validateUsername(username: string): boolean {
  if (!username) return false
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) return false
  return /^[a-zA-Z0-9_]+$/.test(username)
}

export function getUsernameError(username: string): string | null {
  if (!username) return 'Username is required'
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${USERNAME_MIN_LENGTH} characters`
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `Username must be at most ${USERNAME_MAX_LENGTH} characters`
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores'
  }
  return null
}

// Email validation
export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getEmailError(email: string): string | null {
  if (!email) return 'Email is required'
  if (!validateEmail(email)) return 'Invalid email format'
  return null
}

// URL validation
export function validateUrl(url: string): boolean {
  if (!url) return true // URL is optional
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function getUrlError(url: string): string | null {
  if (!url) return null
  if (!validateUrl(url)) return 'Invalid URL format'
  return null
}

// Pin title validation
export function validatePinTitle(title: string): boolean {
  return title.length <= PIN_TITLE_MAX_LENGTH
}

export function getPinTitleError(title: string): string | null {
  if (title.length > PIN_TITLE_MAX_LENGTH) {
    return `Title must be at most ${PIN_TITLE_MAX_LENGTH} characters`
  }
  return null
}

// Pin description validation
export function validatePinDescription(description: string): boolean {
  return description.length <= PIN_DESCRIPTION_MAX_LENGTH
}

export function getPinDescriptionError(description: string): string | null {
  if (description.length > PIN_DESCRIPTION_MAX_LENGTH) {
    return `Description must be at most ${PIN_DESCRIPTION_MAX_LENGTH} characters`
  }
  return null
}

// Comment validation
export function validateComment(content: string): boolean {
  return content.trim().length > 0 && content.length <= COMMENT_MAX_LENGTH
}

export function getCommentError(content: string): string | null {
  if (!content.trim()) return 'Comment cannot be empty'
  if (content.length > COMMENT_MAX_LENGTH) {
    return `Comment must be at most ${COMMENT_MAX_LENGTH} characters`
  }
  return null
}

// Tag validation
export function validateTag(tag: string): boolean {
  return tag.trim().length > 0 && tag.length <= TAG_MAX_LENGTH
}

export function getTagError(tag: string): string | null {
  if (!tag.trim()) return 'Tag cannot be empty'
  if (tag.length > TAG_MAX_LENGTH) {
    return `Tag must be at most ${TAG_MAX_LENGTH} characters`
  }
  return null
}

// Generic length validator
export function validateLength(value: string, min: number = 0, max: number = Infinity): boolean {
  const length = value.trim().length
  return length >= min && length <= max
}

export function getLengthError(
  value: string,
  fieldName: string,
  min: number = 0,
  max: number = Infinity,
): string | null {
  const length = value.trim().length
  if (length < min) return `${fieldName} must be at least ${min} characters`
  if (length > max) return `${fieldName} must be at most ${max} characters`
  return null
}
