#!/bin/bash
# Script to push environment variables to Vercel
# Run this after: vercel login

echo "🚀 Pushing environment variables to Vercel..."
echo ""

# Function to add env var to all environments
add_env() {
  local key=$1
  local value=$2
  echo "Adding $key..."
  echo "$value" | vercel env add "$key" production preview development
}

# Supabase
add_env "NEXT_PUBLIC_SUPABASE_URL" "https://pmawmgvjrfqmpcbnrutk.supabase.co"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXdtZ3ZqcmZxbXBjYm5ydXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTQzODQsImV4cCI6MjA4Njc3MDM4NH0.8oMjc4AJo9LDLyvx1hIdLB56zUiZ7iKrAty9bEhONrg"
add_env "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXdtZ3ZqcmZxbXBjYm5ydXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5NDM4NCwiZXhwIjoyMDg2NzcwMzg0fQ.xAONuaLtvTd0FedeccPcA-mz5akQuX3bpMpbcgX52Uo"
add_env "DATABASE_URL" "postgresql://postgres.pmawmgvjrfqmpcbnrutk:ttandSellaBella1234@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Email
add_env "RESEND_API_KEY" "re_DjMiknb1_T8MdjYu6hBvdpCbbxeZeKi7A"
add_env "EMAIL_FROM" "noreply@theapexway.net"

# App config
add_env "NEXT_PUBLIC_APP_NAME" "Apex Affinity Group"
add_env "CRON_SECRET" "6873f525b93e55e9b8819d4477e55cf6d490f0d9ef95b76d8e2b81a9336020c3"

echo ""
echo "⚠️  IMPORTANT: You need to manually add NEXT_PUBLIC_APP_URL with your Vercel deployment URL"
echo "Run this after first deployment:"
echo "  vercel env add NEXT_PUBLIC_APP_URL production preview development"
echo "  # Then paste your Vercel URL (e.g., https://your-project.vercel.app)"
echo ""
echo "✅ Environment variables pushed to Vercel!"
echo ""
echo "Next steps:"
echo "1. Deploy with: vercel --prod"
echo "2. Get your deployment URL"
echo "3. Add NEXT_PUBLIC_APP_URL with that URL"
echo "4. Redeploy: vercel --prod"
