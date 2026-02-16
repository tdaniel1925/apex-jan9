// SPEC: SPEC-WORKFLOWS > WF-8: Login
// SPEC: SPEC-AUTH.md > Auth actions
// Server actions for authentication

"use server";

import { createClient } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ============================================
// LOGIN ACTION
// ============================================

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input
  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return {
      error: result.error.errors[0].message,
    };
  }

  const supabase = await createClient();

  // Sign in with Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes("Invalid login credentials")) {
      return {
        error: "Invalid email or password",
      };
    }
    return {
      error: "An error occurred during login. Please try again.",
    };
  }

  // Success - redirect will happen via middleware
  // Middleware will detect role and redirect to /admin or /dashboard
  redirect("/dashboard");
}

// ============================================
// LOGOUT ACTION
// ============================================

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ============================================
// FORGOT PASSWORD ACTION
// ============================================

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;

  // Validate email
  const emailSchema = z.string().email("Invalid email address");
  const result = emailSchema.safeParse(email);

  if (!result.success) {
    return {
      error: "Invalid email address",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(result.data, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return {
      error: "An error occurred. Please try again.",
    };
  }

  return {
    success: "Password reset email sent. Please check your inbox.",
  };
}

// ============================================
// RESET PASSWORD ACTION
// ============================================

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate input
  const result = resetPasswordSchema.safeParse({ password, confirmPassword });
  if (!result.success) {
    return {
      error: result.error.errors[0].message,
    };
  }

  const supabase = await createClient();

  // Check if user has a valid session (from reset link)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      error: "Invalid or expired reset link. Please request a new one.",
    };
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return {
      error: "Failed to reset password. Please try again.",
    };
  }

  return {
    success: true,
  };
}
