'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Code,
  FileText,
  History,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/components/admin/admin-auth-provider';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  text_content: string | null;
  variables: string[];
  is_active: boolean;
  is_system: boolean;
  for_replicated_site: boolean;
  created_at: string;
  updated_at: string;
}

interface Version {
  id: string;
  version_number: number;
  subject: string;
  html_content: string;
  text_content: string | null;
  created_at: string;
  notes: string | null;
}

const CATEGORIES = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'commissions', label: 'Commissions' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'team', label: 'Team' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'system', label: 'System' },
];

const COMMON_VARIABLES = [
  'first_name',
  'last_name',
  'email',
  'agent_code',
  'sponsor_name',
  'dashboard_url',
  'logo_url',
  'current_year',
];

export default function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { token } = useAdminAuth();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const isNew = resolvedParams.id === 'new';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'notifications',
    subject: '',
    preview_text: '',
    html_content: getDefaultTemplate(),
    text_content: '',
    variables: [] as string[],
    is_active: true,
    for_replicated_site: false,
  });

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/admin/email-templates/${resolvedParams.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          setTemplate(data.template);
          setVersions(data.versions || []);
          setFormData({
            name: data.template.name,
            slug: data.template.slug,
            category: data.template.category,
            subject: data.template.subject,
            preview_text: data.template.preview_text || '',
            html_content: data.template.html_content,
            text_content: data.template.text_content || '',
            variables: data.template.variables || [],
            is_active: data.template.is_active,
            for_replicated_site: data.template.for_replicated_site,
          });
        } else {
          toast.error('Failed to load template');
          router.push('/admin/email-templates');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast.error('Error loading template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [resolvedParams.id, isNew, router, token]);

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.subject || !formData.html_content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = isNew
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${resolvedParams.id}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(isNew ? 'Template created successfully' : 'Template saved successfully');
        if (isNew) {
          const data = await res.json();
          router.push(`/admin/email-templates/${data.template.id}`);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (isNew) {
      // For new templates, just render the HTML directly
      setPreviewHtml(formData.html_content);
      return;
    }

    try {
      const res = await fetch(`/api/admin/email-templates/${resolvedParams.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.preview.html);
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Error generating preview');
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    if (isNew) {
      toast.error('Please save the template first before sending a test email');
      return;
    }

    try {
      const res = await fetch(`/api/admin/email-templates/${resolvedParams.id}/send-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipient_email: testEmail }),
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
    }
  };

  const handleRestoreVersion = (version: Version) => {
    if (!confirm(`Restore to version ${version.version_number}? This will replace the current content.`)) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      subject: version.subject,
      html_content: version.html_content,
      text_content: version.text_content || '',
    }));
    toast.success(`Restored to version ${version.version_number}. Click Save to apply changes.`);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('html_content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.html_content;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = `${before}{{${variable}}}${after}`;
      setFormData(prev => ({ ...prev, html_content: newText }));
    } else {
      setFormData(prev => ({
        ...prev,
        html_content: `${prev.html_content}{{${variable}}}`,
      }));
    }

    // Add to variables list if not already there
    if (!formData.variables.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variable],
      }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
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
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Create Email Template' : `Edit: ${template?.name}`}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? 'Create a new email template' : 'Edit template content and settings'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    }))}
                    placeholder="e.g., welcome-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Welcome to Apex, {{first_name}}!"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview_text">Preview Text</Label>
                <Input
                  id="preview_text"
                  value={formData.preview_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, preview_text: e.target.value }))}
                  placeholder="Text shown in email preview (optional)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Use {'{{variable_name}}'} syntax for dynamic content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">
                    <Code className="h-4 w-4 mr-2" />
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <FileText className="h-4 w-4 mr-2" />
                    Plain Text
                  </TabsTrigger>
                  {previewHtml && (
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="html" className="mt-4">
                  <div className="mb-2 flex flex-wrap gap-1">
                    {COMMON_VARIABLES.map((v) => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => insertVariable(v)}
                      >
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                    className="font-mono text-sm min-h-[400px]"
                  />
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                  <Textarea
                    value={formData.text_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                    className="font-mono text-sm min-h-[400px]"
                    placeholder="Plain text version of the email (optional)"
                  />
                </TabsContent>
                {previewHtml && (
                  <TabsContent value="preview" className="mt-4">
                    <div
                      className="border rounded-lg overflow-hidden"
                      style={{ height: '500px' }}
                    >
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-full"
                        title="Email Preview"
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Enable this template</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Replicated Site</Label>
                  <p className="text-sm text-muted-foreground">For agent websites</p>
                </div>
                <Switch
                  checked={formData.for_replicated_site}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, for_replicated_site: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendTest}
                disabled={isNew}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </Button>
              {isNew && (
                <p className="text-xs text-muted-foreground">
                  Save the template first to send test emails.
                </p>
              )}
            </CardContent>
          </Card>

          {!isNew && versions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <History className="h-4 w-4 inline mr-2" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">v{version.version_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(version.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreVersion(version)}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Variables Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {formData.variables.length > 0 ? (
                  formData.variables.map((v) => (
                    <Badge key={v} variant="secondary">
                      {v}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No variables detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getDefaultTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="padding: 30px 40px; text-align: center; background-color: #1e3a5f;">
        <img src="{{logo_url}}" alt="Apex Affinity Group" style="max-width: 200px; height: auto;">
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h1 style="color: #1e3a5f; margin: 0 0 20px;">Your Email Title</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Dear {{first_name}},
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Your email content goes here.
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_url}}" style="background-color: #c41e3a; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Call to Action</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 14px; margin: 0 0 10px;">
          Apex Affinity Group<br>
          1600 Highway 6 Ste 400<br>
          Sugar Land, TX 77478
        </p>
        <p style="color: #999; font-size: 12px; margin: 0;">
          © {{current_year}} Apex Affinity Group. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
