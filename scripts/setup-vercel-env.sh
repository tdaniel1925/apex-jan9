#!/bin/bash
# Quick script to set all environment variables in Vercel
# Make sure you've run 'vercel link' first!

echo "🚀 Setting up Vercel environment variables..."
echo "⚠️  Make sure you've run 'vercel link' first!"
echo ""

# Set environment variables (non-interactive)
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development <<< "https://pmawmgvjrfqmpcbnrutk.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXdtZ3ZqcmZxbXBjYm5ydXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTQzODQsImV4cCI6MjA4Njc3MDM4NH0.8oMjc4AJo9LDLyvx1hIdLB56zUiZ7iKrAty9bEhONrg"
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXdtZ3ZqcmZxbXBjYm5ydXRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5NDM4NCwiZXhwIjoyMDg2NzcwMzg0fQ.xAONuaLtvTd0FedeccPcA-mz5akQuX3bpMpbcgX52Uo"
vercel env add DATABASE_URL production preview development <<< "postgresql://postgres.pmawmgvjrfqmpcbnrutk:ttandSellaBella1234@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
vercel env add RESEND_API_KEY production preview development <<< "re_DjMiknb1_T8MdjYu6hBvdpCbbxeZeKi7A"
vercel env add EMAIL_FROM production preview development <<< "noreply@theapexway.net"
vercel env add NEXT_PUBLIC_APP_NAME production preview development <<< "Apex Affinity Group"
vercel env add CRON_SECRET production preview development <<< "6873f525b93e55e9b8819d4477e55cf6d490f0d9ef95b76d8e2b81a9336020c3"

echo ""
echo "⚠️  IMPORTANT: Set NEXT_PUBLIC_APP_URL manually with your deployment URL:"
echo ""
echo "  vercel env add NEXT_PUBLIC_APP_URL production preview development"
echo "  # Then enter your URL (e.g., https://theapexway.net)"
echo ""
echo "✅ Done! Environment variables set in Vercel."
echo "🔄 Trigger a new deployment to apply the changes."
