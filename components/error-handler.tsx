'use client';

import { useEffect } from 'react';

/**
 * Global Error Handler
 * Suppresses uncaught AbortError from Supabase queries
 * These errors are normal and happen when requests are cancelled during navigation
 */
export function ErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's an AbortError
      if (
        event.reason instanceof Error &&
        (event.reason.name === 'AbortError' ||
         event.reason.message?.includes('aborted') ||
         event.reason.message?.includes('signal is aborted'))
      ) {
        // Suppress the error - this is normal behavior during navigation/re-renders
        event.preventDefault();
        console.debug('Suppressed AbortError (normal behavior during navigation)');
        return;
      }
    };

    // Handle regular errors
    const handleError = (event: ErrorEvent) => {
      // Check if it's an AbortError
      if (
        event.error instanceof Error &&
        (event.error.name === 'AbortError' ||
         event.error.message?.includes('aborted') ||
         event.error.message?.includes('signal is aborted'))
      ) {
        // Suppress the error
        event.preventDefault();
        console.debug('Suppressed AbortError (normal behavior during navigation)');
        return;
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}
