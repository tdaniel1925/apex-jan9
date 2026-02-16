// SPEC: WF-2 > Username Availability Check
// DEP-MAP: FEATURE 3 > Username Check API

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUsernameAvailable } from "@/lib/db/queries";
import { rateLimit, RateLimits, getClientIp } from "@/lib/rate-limit";
import { usernameSchema } from "@/lib/types/schemas";

/**
 * Query parameters schema
 */
const querySchema = z.object({
  username: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

/**
 * Generate username suggestions based on name
 */
function generateSuggestions(
  firstName?: string,
  lastName?: string
): string[] {
  if (!firstName || !lastName) {
    return [];
  }

  const first = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const last = lastName.toLowerCase().replace(/[^a-z]/g, "");
  const firstInitial = first.charAt(0);

  const suggestions: string[] = [];

  // firstname.lastname
  if (first && last) {
    suggestions.push(`${first}.${last}`);
  }

  // f.lastname
  if (firstInitial && last) {
    suggestions.push(`${firstInitial}.${last}`);
  }

  // f.lastname1, f.lastname2, etc.
  for (let i = 1; i <= 5; i++) {
    if (firstInitial && last) {
      suggestions.push(`${firstInitial}.${last}${i}`);
    }
  }

  // first.last
  if (first.length > 1 && last.length > 1) {
    suggestions.push(`${first}.${last.charAt(0)}`);
  }

  // firstname1, firstname2, etc.
  for (let i = 1; i <= 3; i++) {
    if (first) {
      suggestions.push(`${first}${i}`);
    }
  }

  // Remove duplicates and limit to 10
  return [...new Set(suggestions)].slice(0, 10);
}

/**
 * Check which suggestions are available
 */
async function getAvailableSuggestions(
  suggestions: string[]
): Promise<string[]> {
  const available: string[] = [];

  for (const suggestion of suggestions) {
    try {
      // Validate format
      usernameSchema.parse(suggestion);

      // Check availability
      const isAvailable = await isUsernameAvailable(suggestion);
      if (isAvailable) {
        available.push(suggestion);

        // Return first 5 available
        if (available.length >= 5) {
          break;
        }
      }
    } catch {
      // Invalid format, skip
      continue;
    }
  }

  return available;
}

/**
 * GET /api/check-username
 * Check if a username is available and return suggestions if not
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = await rateLimit({
      ...RateLimits.USERNAME_CHECK,
      identifier: clientIp,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          available: false,
          error: "rate_limited",
          message: "Too many requests. Please wait a moment.",
          resetAt: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.safeParse({
      username: searchParams.get("username"),
      firstName: searchParams.get("firstName") || undefined,
      lastName: searchParams.get("lastName") || undefined,
    });

    if (!query.success) {
      return NextResponse.json(
        {
          available: false,
          error: "invalid_params",
          message: "Invalid query parameters",
        },
        { status: 400 }
      );
    }

    const { username, firstName, lastName } = query.data;

    // Validate username format
    const usernameValidation = usernameSchema.safeParse(username);

    if (!usernameValidation.success) {
      return NextResponse.json({
        available: false,
        error: "invalid_format",
        message: usernameValidation.error.errors[0]?.message || "Invalid username format",
      }, { status: 400 });
    }

    // Check availability
    const available = await isUsernameAvailable(username);

    if (available) {
      return NextResponse.json({
        available: true,
      });
    }

    // Username is taken, generate suggestions
    const allSuggestions = generateSuggestions(firstName, lastName);
    const availableSuggestions = await getAvailableSuggestions(
      allSuggestions
    );

    return NextResponse.json({
      available: false,
      suggestions: availableSuggestions,
    });
  } catch (error) {
    // Error handled

    return NextResponse.json(
      {
        available: false,
        error: "server_error",
        message: "Failed to check username availability",
      },
      { status: 500 }
    );
  }
}
