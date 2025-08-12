import { useCallback } from 'react'
import DOMPurify from 'dompurify'

export interface ValidationRules {
  stripHtml?: boolean
  maxLength?: number
  minLength?: number
  allowedChars?: RegExp
  preventScripts?: boolean
}

export interface ValidationResult {
  isValid: boolean
  sanitizedValue: string
  errors: string[]
}

export const useInputValidation = () => {
  const validateEmail = useCallback((email: string): ValidationResult => {
    const errors: string[] = []
    let sanitizedValue = email.trim()

    // Strip HTML tags
    sanitizedValue = DOMPurify.sanitize(sanitizedValue, { ALLOWED_TAGS: [] })

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedValue)) {
      errors.push('Please enter a valid email address')
    }

    // Prevent script injection patterns
    if (/script|javascript|vbscript|onload|onerror/i.test(sanitizedValue)) {
      errors.push('Invalid characters detected')
      sanitizedValue = sanitizedValue.replace(/script|javascript|vbscript|onload|onerror/gi, '')
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors
    }
  }, [])

  const validatePassword = useCallback((password: string): ValidationResult => {
    const errors: string[] = []
    let sanitizedValue = password

    // Minimum length check
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }

    // Prevent HTML injection
    sanitizedValue = DOMPurify.sanitize(sanitizedValue, { ALLOWED_TAGS: [] })

    // Prevent script injection
    if (/<|>|&lt;|&gt;/.test(sanitizedValue)) {
      errors.push('Invalid characters detected')
      sanitizedValue = sanitizedValue.replace(/<|>|&lt;|&gt;/g, '')
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors
    }
  }, [])

  const validateSearchInput = useCallback((input: string): ValidationResult => {
    const errors: string[] = []
    let sanitizedValue = input.trim()

    // Strip all HTML tags for search safety
    sanitizedValue = DOMPurify.sanitize(sanitizedValue, { ALLOWED_TAGS: [] })

    // Remove dangerous patterns
    sanitizedValue = sanitizedValue.replace(/[<>]/g, '')
    
    // Prevent script injection patterns
    if (/script|javascript|vbscript|onload|onerror|eval|expression/i.test(sanitizedValue)) {
      errors.push('Invalid search characters detected')
      sanitizedValue = sanitizedValue.replace(/script|javascript|vbscript|onload|onerror|eval|expression/gi, '')
    }

    // Length validation (reasonable search limit)
    if (sanitizedValue.length > 100) {
      errors.push('Search query too long')
      sanitizedValue = sanitizedValue.substring(0, 100)
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors
    }
  }, [])

  const sanitizeInput = useCallback((input: string, rules: ValidationRules = {}): ValidationResult => {
    const errors: string[] = []
    let sanitizedValue = input

    // Strip HTML if requested
    if (rules.stripHtml) {
      sanitizedValue = DOMPurify.sanitize(sanitizedValue, { ALLOWED_TAGS: [] })
    }

    // Prevent scripts if requested
    if (rules.preventScripts) {
      if (/script|javascript|vbscript|onload|onerror|eval/i.test(sanitizedValue)) {
        errors.push('Dangerous content detected')
        sanitizedValue = sanitizedValue.replace(/script|javascript|vbscript|onload|onerror|eval/gi, '')
      }
    }

    // Length validation
    if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
      errors.push(`Input too long (max ${rules.maxLength} characters)`)
      sanitizedValue = sanitizedValue.substring(0, rules.maxLength)
    }

    if (rules.minLength && sanitizedValue.length < rules.minLength) {
      errors.push(`Input too short (min ${rules.minLength} characters)`)
    }

    // Character validation
    if (rules.allowedChars && !rules.allowedChars.test(sanitizedValue)) {
      errors.push('Input contains invalid characters')
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors
    }
  }, [])

  return {
    validateEmail,
    validatePassword,
    validateSearchInput,
    sanitizeInput
  }
}