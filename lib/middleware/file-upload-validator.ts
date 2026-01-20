/**
 * File Upload Validator
 * Phase 2 - Issue #23: Server-side file size and type validation
 */

import { NextRequest, NextResponse } from 'next/server';

export interface FileUploadLimits {
  maxSizeBytes: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export const FILE_LIMITS = {
  AVATAR: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  TRAINING_ATTACHMENT: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.mp4'],
  },
  CERTIFICATE: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  DOCUMENT: {
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    allowedExtensions: ['.pdf', '.docx', '.xlsx'],
  },
  EMAIL_LOGO: {
    maxSizeBytes: 1 * 1024 * 1024, // 1MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.svg'],
  },
} as const;

export type FileUploadType = keyof typeof FILE_LIMITS;

/**
 * Validate file upload against size and type limits
 */
export async function validateFileUpload(
  file: File,
  uploadType: FileUploadType
): Promise<{ valid: boolean; error?: string }> {
  const limits = FILE_LIMITS[uploadType];

  // Validate file size
  if (file.size > limits.maxSizeBytes) {
    return {
      valid: false,
      error: `File size ${formatBytes(file.size)} exceeds maximum of ${formatBytes(limits.maxSizeBytes)}`,
    };
  }

  // Validate MIME type
  if (limits.allowedMimeTypes && !(limits.allowedMimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${limits.allowedMimeTypes.join(', ')}`,
    };
  }

  // Validate file extension
  if (limits.allowedExtensions) {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!(limits.allowedExtensions as readonly string[]).includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} not allowed. Allowed: ${limits.allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Middleware to check request body size
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSizeBytes: number
): Promise<NextResponse | null> {
  const contentLength = request.headers.get('content-length');

  if (!contentLength) {
    return NextResponse.json(
      { error: 'Content-Length header required' },
      { status: 411 }
    );
  }

  const size = parseInt(contentLength, 10);

  if (size > maxSizeBytes) {
    return NextResponse.json(
      {
        error: 'Request too large',
        maxSize: formatBytes(maxSizeBytes),
        actualSize: formatBytes(size),
      },
      { status: 413 }
    );
  }

  return null; // Valid
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file name for security
 */
export function validateFileName(fileName: string): { valid: boolean; error?: string } {
  // Check length
  if (fileName.length > 255) {
    return { valid: false, error: 'File name too long (max 255 characters)' };
  }

  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    return { valid: false, error: 'File name contains invalid characters' };
  }

  // Check for path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { valid: false, error: 'File name cannot contain path separators' };
  }

  return { valid: true };
}

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Remove consecutive dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}
