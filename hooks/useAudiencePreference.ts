// SPEC: Audience Segmentation > Client State Management
// Custom hook for managing visitor audience preference via localStorage

"use client";

import { useState, useEffect } from "react";

/**
 * localStorage key for storing visitor's audience preference
 * @constant
 */
const STORAGE_KEY = "apex_audience_preference";

/**
 * Visitor's selected audience preference
 * - "agents": Licensed insurance agents
 * - "newcomers": People new to insurance
 * - null: No preference selected yet
 */
export type AudiencePreference = "agents" | "newcomers" | null;

/**
 * Return type for useAudiencePreference hook
 */
interface UseAudiencePreferenceReturn {
  /** Current visitor preference from localStorage */
  preference: AudiencePreference;
  /** Set visitor preference (saves to localStorage and updates state) */
  setPreference: (pref: "agents" | "newcomers") => void;
  /** Clear visitor preference from localStorage */
  clearPreference: () => void;
  /** Loading state - true during initial localStorage read (prevents hydration flash) */
  isLoading: boolean;
}

/**
 * Hook to manage visitor's audience preference via localStorage
 *
 * Features:
 * - Stores preference in browser localStorage for persistence
 * - Syncs preference across browser tabs via storage event
 * - Handles SSR gracefully (no localStorage on server)
 * - Provides loading state to prevent hydration mismatches
 * - Error handling for localStorage failures (private browsing, quota exceeded)
 *
 * localStorage Schema:
 * - Key: "apex_audience_preference"
 * - Value: "agents" | "newcomers" | null
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { preference, setPreference, isLoading } = useAudiencePreference();
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <button onClick={() => setPreference("agents")}>
 *       {preference === "agents" ? "Selected" : "Select"} Agents
 *     </button>
 *   );
 * }
 * ```
 *
 * @returns Object with preference state and control functions
 */
export function useAudiencePreference(): UseAudiencePreferenceReturn {
  const [preference, setPreferenceState] = useState<AudiencePreference>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "agents" || stored === "newcomers") {
        setPreferenceState(stored);
      }
    } catch (error) {
      console.warn("Failed to read audience preference from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newValue = e.newValue;
        if (newValue === "agents" || newValue === "newcomers") {
          setPreferenceState(newValue);
        } else if (newValue === null) {
          setPreferenceState(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setPreference = (pref: "agents" | "newcomers") => {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
      setPreferenceState(pref);
    } catch (error) {
      console.warn("Failed to save audience preference to localStorage:", error);
    }
  };

  const clearPreference = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPreferenceState(null);
    } catch (error) {
      console.warn("Failed to clear audience preference from localStorage:", error);
    }
  };

  return {
    preference,
    setPreference,
    clearPreference,
    isLoading,
  };
}
