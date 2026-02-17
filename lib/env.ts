// SPEC: SPEC-DEPENDENCY-MAP > CROSS-CUTTING > ENV VALIDATION
// Environment variable validation - app refuses to start if required vars missing

type EnvVar = {
  key: string;
  value: string | undefined;
  required: boolean;
};

const envVars: EnvVar[] = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    required: true,
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    required: true,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    required: true,
  },
  {
    key: "DATABASE_URL",
    value: process.env.DATABASE_URL,
    required: true,
  },
  {
    key: "RESEND_API_KEY",
    value: process.env.RESEND_API_KEY,
    required: true,
  },
  {
    key: "EMAIL_FROM",
    value: process.env.EMAIL_FROM,
    required: true,
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    value: process.env.NEXT_PUBLIC_APP_URL,
    required: true,
  },
  {
    key: "NEXT_PUBLIC_APP_NAME",
    value: process.env.NEXT_PUBLIC_APP_NAME,
    required: false,
  },
  {
    key: "CRON_SECRET",
    value: process.env.CRON_SECRET,
    required: true,
  },
];

// Validate environment variables (server-side only)
// Client-side code can't access server-only env vars, so skip validation in browser
if (typeof window === "undefined") {
  const missingVars = envVars
    .filter((envVar) => envVar.required && !envVar.value)
    .map((envVar) => envVar.key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars
        .map((key) => `  - ${key}`)
        .join("\n")}\n\nPlease check your .env.local file and ensure all required variables are set.`
    );
  }
}

// Export typed environment object
// Server-only vars are undefined in browser (safe because they're only used in server actions)
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  NEXT_PUBLIC_APP_NAME:
    process.env.NEXT_PUBLIC_APP_NAME || "Apex Affinity Group",
  CRON_SECRET: process.env.CRON_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;
