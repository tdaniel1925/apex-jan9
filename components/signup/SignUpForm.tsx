// SPEC: SPEC-PAGES > Sign-Up Page
// DEP-MAP: FEATURE 3 > Sign-Up Flow > UI

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { signUpSchema, type SignUpFormData } from "@/lib/types/schemas";
import { createDistributor } from "@/lib/actions/signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";

interface SignUpFormProps {
  enrollerId: string;
  enrollerName: string;
}

interface UsernameCheckResult {
  available: boolean;
  suggestions?: string[];
  error?: string;
}

export function SignUpForm({ enrollerId, enrollerName }: SignUpFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const username = watch("username");
  const password = watch("password");

  // Auto-generate username from name
  useEffect(() => {
    if (firstName && lastName && !username) {
      const generated = generateUsername(firstName, lastName);
      setValue("username", generated);
    }
  }, [firstName, lastName, username, setValue]);

  // Debounce username for checking
  const debouncedUsername = useDebounce(username, 500);

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus("checking");

      try {
        const params = new URLSearchParams({
          username: debouncedUsername,
          firstName: firstName || "",
          lastName: lastName || "",
        });

        const response = await fetch(`/api/check-username?${params}`);
        const data: UsernameCheckResult = await response.json();

        if (data.error === "rate_limited") {
          setUsernameStatus("idle");
          return;
        }

        if (data.available) {
          setUsernameStatus("available");
          setUsernameSuggestions([]);
          clearErrors("username");
        } else {
          setUsernameStatus("taken");
          setUsernameSuggestions(data.suggestions || []);
          setError("username", {
            type: "manual",
            message: "This username is already taken",
          });
        }
      } catch (error) {
        // Error handled
        setUsernameStatus("idle");
      }
    };

    checkUsername();
  }, [debouncedUsername, firstName, lastName, setError, clearErrors]);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);

      const result = await createDistributor(enrollerId, data);
      console.log("Signup result:", result);

      if (result.success) {
        console.log("Success! Redirecting to:", result.redirectTo || "/login");
        toast.success(
          "Account created successfully! You can now log in to your dashboard."
        );
        router.push(result.redirectTo || "/login");
      } else {
        console.log("Signup failed:", result.error);
        if (result.field) {
          setError(result.field as any, {
            type: "manual",
            message: result.error || "Invalid value",
          });
        }
        toast.error(result.error || "Failed to create account");
      }
    } catch (error) {
      // Error handled
      console.error("Signup exception:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue("username", suggestion);
    setUsernameSuggestions([]);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* First Name */}
      <div>
        <Label htmlFor="firstName">
          First Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="firstName"
          type="text"
          placeholder="John"
          {...register("firstName")}
          className={errors.firstName ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.firstName && (
          <p className="text-sm text-red-500 mt-1">
            {errors.firstName.message}
          </p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <Label htmlFor="lastName">
          Last Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lastName"
          type="text"
          placeholder="Smith"
          {...register("lastName")}
          className={errors.lastName ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.lastName && (
          <p className="text-sm text-red-500 mt-1">
            {errors.lastName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">
          Phone <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          {...register("phone")}
          className={errors.phone ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* License Status */}
      <div>
        <Label>
          License Status <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="mt-3 space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="licensed"
              value="licensed"
              {...register("licenseStatus")}
              className="w-4 h-4"
              disabled={isSubmitting}
            />
            <Label htmlFor="licensed" className="font-normal cursor-pointer">
              I am a licensed insurance agent
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="not_licensed"
              value="not_licensed"
              {...register("licenseStatus")}
              className="w-4 h-4"
              disabled={isSubmitting}
            />
            <Label htmlFor="not_licensed" className="font-normal cursor-pointer">
              I am new to insurance (not licensed)
            </Label>
          </div>
        </div>
        {errors.licenseStatus && (
          <p className="text-sm text-red-500 mt-1">
            {errors.licenseStatus.message}
          </p>
        )}
      </div>

      {/* Username with real-time check */}
      <div>
        <Label htmlFor="username">
          Username <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="j.smith"
            {...register("username")}
            className={errors.username ? "border-red-500 pr-10" : "pr-10"}
            disabled={isSubmitting}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {usernameStatus === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {usernameStatus === "available" && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {usernameStatus === "taken" && (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        {errors.username && (
          <p className="text-sm text-red-500 mt-1">
            {errors.username.message}
          </p>
        )}
        {usernameSuggestions.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">
              Try these available usernames:
            </p>
            <div className="flex flex-wrap gap-2">
              {usernameSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-md text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">
            {errors.password.message}
          </p>
        )}
        {!errors.password && password && (
          <p className="text-sm text-muted-foreground mt-1">
            At least 8 characters, one uppercase, one number
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword">
          Confirm Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register("confirmPassword")}
          className={errors.confirmPassword ? "border-red-500" : ""}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start space-x-2">
        <input
          id="terms"
          type="checkbox"
          {...register("terms")}
          className="mt-1"
          disabled={isSubmitting}
        />
        <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
          I agree to the{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms & Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          <span className="text-red-500">*</span>
        </Label>
      </div>
      {errors.terms && (
        <p className="text-sm text-red-500 mt-1">{errors.terms.message}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || usernameStatus === "taken"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          `Join ${enrollerName}'s Team`
        )}
      </Button>
    </form>
  );
}

/**
 * Generate username from name
 */
function generateUsername(firstName: string, lastName: string): string {
  const first = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const last = lastName.toLowerCase().replace(/[^a-z]/g, "");

  if (!first || !last) return "";

  return `${first.charAt(0)}.${last}`;
}
