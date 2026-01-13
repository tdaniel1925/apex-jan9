'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Send,
  Monitor,
  Smartphone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/components/admin/admin-auth-provider';

interface PreviewData {
  subject: string;
  html: string;
  text: string | null;
}

interface SampleData {
  [key: string]: string;
}

export default function EmailTemplatePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { token } = useAdminAuth();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [sampleData, setSampleData] = useState<SampleData>({});
  const [customData, setCustomData] = useState<SampleData>({});
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${resolvedParams.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ variables: customData }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreview(data.preview);
        setSampleData(data.sampleData);
      } else {
        toast.error('Failed to load preview');
        router.push('/admin/email-templates');
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast.error('Error loading preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [resolvedParams.id]);

  const handleCustomDataChange = (key: string, value: string) => {
    setCustomData(prev => ({ ...prev, [key]: value }));
  };

  const handleRefreshPreview = () => {
    fetchPreview();
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${resolvedParams.id}/send-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipient_email: testEmail,
          variables: customData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Error sending test email');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/email-templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Email Preview</h1>
            <p className="text-muted-foreground">
              Preview how the email will appear to recipients.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/email-templates/${resolvedParams.id}`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Preview Pane */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Subject: {preview?.subject}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">
                    <Mail className="h-4 w-4 mr-2" />
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-4">
                  <div
                    className={`border rounded-lg overflow-hidden bg-gray-100 flex justify-center p-4 ${
                      viewMode === 'mobile' ? '' : ''
                    }`}
                  >
                    <div
                      className={`bg-white shadow-lg transition-all ${
                        viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[650px]'
                      }`}
                      style={{ minHeight: '600px' }}
                    >
                      {preview?.html && (
                        <iframe
                          srcDoc={preview.html}
                          className="w-full"
                          style={{ minHeight: '600px', border: 'none' }}
                          title="Email Preview"
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted min-h-[400px] font-mono text-sm whitespace-pre-wrap">
                    {preview?.text || 'No plain text version available'}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendTest}
                disabled={sending}
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Test Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Test Data</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleRefreshPreview}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Customize preview variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(sampleData).map(([key, defaultValue]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs font-mono">{key}</Label>
                  <Input
                    value={customData[key] || defaultValue}
                    onChange={(e) => handleCustomDataChange(key, e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleRefreshPreview}
              >
                Update Preview
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
