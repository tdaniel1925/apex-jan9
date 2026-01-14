/**
 * Username Validation Utilities
 * For agent replicated site URLs: /team/[username]
 */

// Reserved words that cannot be used as usernames
export const RESERVED_USERNAMES = new Set([
  // Routes
  'admin', 'login', 'signup', 'logout', 'register',
  'dashboard', 'api', 'auth', 'callback',
  'team', 'join', 'about', 'contact', 'faq',
  'terms', 'privacy', 'careers', 'blog', 'news',
  'products', 'services', 'support', 'help',
  'settings', 'profile', 'account',
  // Generic
  'apex', 'apexaffinity', 'theapexway', 'root', 'system',
  'null', 'undefined', 'test', 'testing', 'demo',
  'www', 'mail', 'email', 'ftp', 'smtp', 'pop',
  // Roles
  'agent', 'agents', 'user', 'users', 'member', 'members',
  'founder', 'founders', 'fc', 'vip', 'premium',
  // Actions
  'new', 'create', 'edit', 'delete', 'update', 'remove',
  'search', 'explore', 'discover', 'browse',
  // Content
  'training', 'courses', 'lessons', 'resources',
  'wallet', 'commissions', 'bonuses', 'payouts',
  'copilot', 'ai', 'chat', 'widget',
  // Legal
  'income-disclaimer', 'disclaimer', 'legal', 'compliance',
]);

// Username validation rules
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Normalize a username (lowercase, trim)
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

/**
 * Validate username format (not availability)
 */
export function validateUsername(username: string): UsernameValidationResult {
  const normalized = normalizeUsername(username);

  // Check length
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }

  if (normalized.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be no more than ${USERNAME_MAX_LENGTH} characters`,
    };
  }

  // Check pattern (starts with letter, alphanumeric + underscore)
  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      valid: false,
      error: 'Username must start with a letter and contain only lowercase letters, numbers, and underscores',
    };
  }

  // Check reserved words
  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      valid: false,
      error: 'This username is not available',
    };
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * Generate a suggested username from name
 */
export function suggestUsername(firstName: string, lastName: string): string {
  const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (base.length >= USERNAME_MIN_LENGTH) {
    return base.substring(0, USERNAME_MAX_LENGTH);
  }

  // If too short, pad with random numbers
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${base}${random}`.substring(0, USERNAME_MAX_LENGTH);
}
