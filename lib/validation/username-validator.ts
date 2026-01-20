/**
 * Username Validator
 * Phase 2 - Issue #31: Ensure usernames are URL-safe for replicated sites
 */

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate username for URL safety
 *
 * Rules:
 * - 3-30 characters long
 * - Only lowercase letters, numbers, hyphens, underscores
 * - Must start with a letter
 * - Cannot end with hyphen or underscore
 * - No consecutive hyphens or underscores
 * - Reserved words not allowed
 */
export function validateUsername(username: string): UsernameValidationResult {
  // Check if empty
  if (!username || username.trim() === '') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim().toLowerCase();

  // Check length
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must not exceed 30 characters' };
  }

  // Check pattern (only alphanumeric, hyphen, underscore)
  const validPattern = /^[a-z][a-z0-9_-]*[a-z0-9]$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Username must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, hyphens, and underscores',
    };
  }

  // Check for consecutive special characters
  if (/[_-]{2,}/.test(trimmed)) {
    return {
      valid: false,
      error: 'Username cannot contain consecutive hyphens or underscores',
    };
  }

  // Check reserved words
  const reservedWords = [
    'admin',
    'api',
    'app',
    'assets',
    'auth',
    'blog',
    'dashboard',
    'help',
    'home',
    'login',
    'logout',
    'mail',
    'register',
    'root',
    'settings',
    'signup',
    'support',
    'system',
    'test',
    'user',
    'users',
    'www',
    // MLM-specific reserved
    'agent',
    'agents',
    'commission',
    'commissions',
    'compensation',
    'corporate',
    'enroll',
    'enrollment',
    'join',
    'opportunity',
    'payout',
    'payouts',
    'replicated',
    'shop',
    'store',
    'team',
    'training',
    'wallet',
    // Company-specific
    'apex',
    'apexaffinity',
    'theapexway',
  ];

  if (reservedWords.includes(trimmed)) {
    return {
      valid: false,
      error: 'This username is reserved. Please choose a different one',
    };
  }

  // Check for offensive/inappropriate words (basic list)
  const inappropriateWords = [
    'admin',
    'administrator',
    'moderator',
    'staff',
    'official',
  ];

  for (const word of inappropriateWords) {
    if (trimmed.includes(word)) {
      return {
        valid: false,
        error: 'Username contains inappropriate or reserved terms',
      };
    }
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Sanitize username to make it URL-safe
 * Use this to generate suggested usernames from names/emails
 */
export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_') // Replace invalid chars with underscore
    .replace(/^[^a-z]+/, '') // Remove non-letter prefix
    .replace(/[_-]+$/, '') // Remove trailing special chars
    .replace(/[_-]{2,}/g, '_') // Collapse consecutive special chars
    .substring(0, 30); // Limit length
}

/**
 * Generate username suggestions from name or email
 */
export function generateUsernameSuggestions(
  firstName: string,
  lastName: string,
  email?: string
): string[] {
  const suggestions: string[] = [];

  // Sanitize inputs
  const first = sanitizeUsername(firstName);
  const last = sanitizeUsername(lastName);
  const emailUser = email ? sanitizeUsername(email.split('@')[0]) : '';

  // Generate variations
  if (first && last) {
    suggestions.push(`${first}${last}`);
    suggestions.push(`${first}_${last}`);
    suggestions.push(`${first}-${last}`);
    suggestions.push(`${first}${last.charAt(0)}`);
  }

  if (emailUser) {
    suggestions.push(emailUser);
  }

  if (first) {
    suggestions.push(`${first}${Math.floor(Math.random() * 9999)}`);
  }

  // Filter valid suggestions
  return suggestions
    .filter(s => validateUsername(s).valid)
    .slice(0, 5); // Return top 5
}

/**
 * Check if username is available in database
 * Note: This should be called from API routes, not client-side
 */
export async function isUsernameAvailable(
  username: string,
  supabase: any,
  excludeAgentId?: string
): Promise<boolean> {
  let query = supabase
    .from('agents')
    .select('id')
    .eq('username', username.toLowerCase());

  if (excludeAgentId) {
    query = query.neq('id', excludeAgentId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (username available)
    console.error('Error checking username availability:', error);
    return false;
  }

  return !data; // Available if no data found
}
