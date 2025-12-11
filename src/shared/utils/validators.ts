import { TEXT_LIMITS, IMAGE } from './constants';

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Username validation
export const isValidUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < TEXT_LIMITS.USERNAME_MIN) {
    return {
      valid: false,
      error: `Username must be at least ${TEXT_LIMITS.USERNAME_MIN} characters`,
    };
  }

  if (username.length > TEXT_LIMITS.USERNAME_MAX) {
    return {
      valid: false,
      error: `Username must be less than ${TEXT_LIMITS.USERNAME_MAX} characters`,
    };
  }

  const usernameRegex = /^\w+$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { valid: true };
};

// Allowed image types as const tuple for type safety
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// File validation
export const isValidImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType);
  if (!isAllowedType) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${IMAGE.ALLOWED_TYPES.map((t) => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > IMAGE.MAX_FILE_SIZE) {
    const maxMB = IMAGE.MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `File size must be less than ${maxMB}MB` };
  }

  return { valid: true };
};

// UUID validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Required field validation
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// Length validation
export const isMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

export const isMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

export const isInRange = (value: string, min: number, max: number): boolean => {
  return value.length >= min && value.length <= max;
};

// Number validation
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
};

export const isInNumberRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Tag validation
export const isValidTag = (tag: string): boolean => {
  if (!tag || tag.length > TEXT_LIMITS.TAG_NAME) return false;
  // Allow alphanumeric, spaces, hyphens, underscores
  const tagRegex = /^[\w\s-]+$/;
  return tagRegex.test(tag);
};

// Form validation helper
export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export const validateField = (value: unknown, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
};

// Common validation rules
export const commonRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: isRequired,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: unknown) => isMinLength(String(value ?? ''), min),
    message: message ?? `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: unknown) => isMaxLength(String(value ?? ''), max),
    message: message ?? `Must be less than ${max} characters`,
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    validate: (value: unknown) => isValidEmail(String(value ?? '')),
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule => ({
    validate: (value: unknown) => {
      const str = String(value ?? '');
      return !str || isValidUrl(str);
    },
    message,
  }),
};