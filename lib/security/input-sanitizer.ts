/**
 * Input Sanitization Utility
 * Phase 2 - Issue #19: Prevent XSS attacks by sanitizing user-provided text
 *
 * This utility provides comprehensive XSS protection for all user-generated content.
 */

/**
 * HTML entities that need to be escaped to prevent XSS
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
} as const;

/**
 * Escape HTML special characters to prevent XSS
 * @param text - The text to sanitize
 * @returns Sanitized text with HTML entities escaped
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string by escaping HTML and trimming whitespace
 * @param text - The text to sanitize
 * @param maxLength - Optional maximum length (truncate if exceeded)
 * @returns Sanitized text
 */
export function sanitizeText(text: string | null | undefined, maxLength?: number): string | null {
  if (text === null || text === undefined || text === '') {
    return null;
  }

  let sanitized = escapeHtml(text).trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized || null;
}

/**
 * Sanitize an object's text fields recursively
 * @param obj - The object containing text fields
 * @param fields - Array of field names to sanitize
 * @returns New object with sanitized fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...obj };

  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Zod transform function for sanitizing string inputs
 * Usage: z.string().transform(sanitizeTransform)
 */
export const sanitizeTransform = (val: string) => sanitizeText(val);

/**
 * Sanitize rich text content (for future use with Markdown/rich editors)
 * Currently escapes all HTML - can be enhanced to allow safe Markdown
 * @param content - The rich text content
 * @returns Sanitized content
 */
export function sanitizeRichText(content: string | null | undefined): string | null {
  if (content === null || content === undefined || content === '') {
    return null;
  }

  // For now, treat rich text the same as plain text
  // TODO: In the future, consider using a library like DOMPurify
  // to allow safe Markdown while stripping dangerous HTML
  return sanitizeText(content);
}

/**
 * Strip all HTML tags from a string (for search indexing)
 * @param html - The HTML string
 * @returns Plain text with all HTML removed
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

/**
 * Sanitize URL to prevent javascript: and data: XSS vectors
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return null;
    }
  }

  // Allow http, https, mailto, tel
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/')
  ) {
    return url.trim();
  }

  // Relative URLs are safe
  if (!trimmed.includes(':')) {
    return url.trim();
  }

  console.warn(`Blocked suspicious URL: ${url}`);
  return null;
}

/**
 * Configuration for field-level sanitization
 */
export interface SanitizationConfig {
  /** Text fields to sanitize (escape HTML) */
  textFields?: string[];
  /** URL fields to validate */
  urlFields?: string[];
  /** Rich text fields (future: allow safe Markdown) */
  richTextFields?: string[];
  /** Maximum lengths for specific fields */
  maxLengths?: Record<string, number>;
}

/**
 * Apply sanitization to an object based on configuration
 * @param data - The data object to sanitize
 * @param config - Sanitization configuration
 * @returns Sanitized data object
 */
export function applySanitization<T extends Record<string, any>>(
  data: T,
  config: SanitizationConfig
): T {
  const sanitized = { ...data } as any;

  // Sanitize text fields
  if (config.textFields) {
    for (const field of config.textFields) {
      if (field in sanitized && typeof sanitized[field] === 'string') {
        const maxLength = config.maxLengths?.[field];
        sanitized[field] = sanitizeText(sanitized[field], maxLength);
      }
    }
  }

  // Sanitize URL fields
  if (config.urlFields) {
    for (const field of config.urlFields) {
      if (field in sanitized && typeof sanitized[field] === 'string') {
        sanitized[field] = sanitizeUrl(sanitized[field]);
      }
    }
  }

  // Sanitize rich text fields
  if (config.richTextFields) {
    for (const field of config.richTextFields) {
      if (field in sanitized && typeof sanitized[field] === 'string') {
        sanitized[field] = sanitizeRichText(sanitized[field]);
      }
    }
  }

  return sanitized as T;
}
