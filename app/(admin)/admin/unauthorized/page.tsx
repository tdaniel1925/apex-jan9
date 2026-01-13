'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';

export default function UnauthorizedPage() {
  const handleLogout = () => {
    // Clear admin token
    localStorage.removeItem('apex_admin_token');
    // Redirect to login
    window.location.href = '/admin-login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <ShieldX className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Access Denied
          </CardTitle>
          <CardDescription className="text-slate-400">
            You don&apos;t have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300 text-center">
            Your account doesn&apos;t have the required permissions to view this content.
            If you believe this is an error, please contact your administrator.
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
