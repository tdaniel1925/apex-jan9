/**
 * Admin Copilot Management Page
 * Manage AI Copilot subscriptions, trials, and usage
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AdminCopilotContent from './content';

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AdminCopilotPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminCopilotContent />
    </Suspense>
  );
}
