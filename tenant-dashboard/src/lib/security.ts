/**
 * Security utilities for XSS protection, input sanitization, and CSRF protection
 * Implements OWASP security best practices
 */

import DOMPurify from 'dompurify'
import crypto from 'crypto'

// CSRF Token Management
class CSRFTokenManager {
  private static instance: CSRFTokenManager
  private tokens = new Map<string, { token: string; expires: number }>()
  
  static getInstance(): CSRFTokenManager {
    if (!CSRFTokenManager.instance) {
      CSRFTokenManager.instance = new CSRFTokenManager()
    }
    return CSRFTokenManager.instance
  }
  
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + (1000 * 60 * 60) // 1 hour
    
    this.tokens.set(sessionId, { token, expires })
    return token
  }
  
  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId)
    if (!stored) return false
    
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId)
      return false
    }
    
    return stored.token === token
  }
  
  removeToken(sessionId: string): void {
    this.tokens.delete(sessionId)
  }
}

// XSS Protection and Input Sanitization
export class SecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * Uses DOMPurify with strict configuration
   */
  static sanitizeHTML(dirty: string): string {
    if (typeof window === 'undefined') {
      // Server-side fallback - strip all HTML
      return dirty.replace(/<[^>]*>/g, '')
    }
    
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOWED_URI_REGEXP: /^https?:\/\/|^\/|^#/,
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    })
  }
  
  /**
   * Escape HTML entities to prevent XSS
   */
  static escapeHTML(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
  
  /**
   * Validate and sanitize user input
   */
  static sanitizeInput(input: string, options: {
    maxLength?: number
    allowedChars?: RegExp
    stripHTML?: boolean
  } = {}): string {
    const { maxLength = 1000, allowedChars, stripHTML = true } = options
    
    let sanitized = input.trim()
    
    // Strip HTML if requested
    if (stripHTML) {
      sanitized = sanitized.replace(/<[^>]*>/g, '')
    }
    
    // Apply length limit
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }
    
    // Filter allowed characters
    if (allowedChars) {
      sanitized = sanitized.replace(new RegExp(`[^${allowedChars.source}]`, 'g'), '')
    }
    
    return sanitized
  }
  
  /**
   * Validate email format with security considerations
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    // Additional security checks
    if (email.length > 320) return false // RFC 5321 limit
    if (email.includes('..')) return false // Consecutive dots
    if (email.startsWith('.') || email.endsWith('.')) return false
    
    return emailRegex.test(email)
  }
  
  /**
   * Validate URL with security restrictions
   */
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      
      // Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false
      }
      
      // Block suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /vbscript:/i,
        /data:/i,
        /file:/i,
        /ftp:/i,
      ]
      
      return !suspiciousPatterns.some(pattern => pattern.test(url))
    } catch {
      return false
    }
  }
  
  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
  
  /**
   * Hash password securely (for client-side operations)
   */
  static async hashPassword(password: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + (salt || ''))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    requirements: {
      length: boolean
      uppercase: boolean
      lowercase: boolean
      numbers: boolean
      special: boolean
    }
  } {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password),
    }
    
    const score = Object.values(requirements).reduce((acc, met) => acc + (met ? 1 : 0), 0)
    const isValid = score >= 4 && requirements.length
    
    return { isValid, score, requirements }
  }
}

// CSRF Protection
export const csrfManager = CSRFTokenManager.getInstance()

// Security Headers Helper
export const SecurityHeaders = {
  getCORSHeaders: (origin?: string) => {
    const allowedOrigins = [
      'https://pyairtable.com',
      'https://app.pyairtable.com',
      'https://localhost:3000',
      'https://localhost:5173',
    ]
    
    const isAllowed = !origin || allowedOrigins.includes(origin)
    
    return {
      'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Vary': 'Origin',
    }
  },
  
  getSecurityHeaders: () => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  }),
}

// Input validation schemas
export const ValidationSchemas = {
  email: {
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    maxLength: 320,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
  },
  username: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 3,
    maxLength: 50,
  },
  apiKey: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    minLength: 20,
    maxLength: 100,
  },
}

export default SecurityUtils