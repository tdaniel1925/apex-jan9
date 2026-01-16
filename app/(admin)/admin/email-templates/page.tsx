'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/components/admin/admin-auth-provider';
import { LogoUpload } from '@/components/admin/logo-upload';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  preview_text: string | null;
  is_active: boolean;
  is_system: boolean;
  for_replicated_site: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  active: number;
  byCategory: Record<string, number>;
}

interface EmailBrandingSettings {
  id: string;
  header_logo_url: string;
  header_logo_width: number;
  footer_logo_url: string;
  footer_logo_width: number;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'commissions', label: 'Commissions' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'team', label: 'Team' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'system', label: 'System' },
];

const CATEGORY_COLORS: Record<string, string> = {
  welcome: 'bg-green-100 text-green-800',
  onboarding: 'bg-blue-100 text-blue-800',
  commissions: 'bg-yellow-100 text-yellow-800',
  notifications: 'bg-purple-100 text-purple-800',
  marketing: 'bg-pink-100 text-pink-800',
  team: 'bg-orange-100 text-orange-800',
  compliance: 'bg-red-100 text-red-800',
  system: 'bg-gray-100 text-gray-800',
};

export default function AdminEmailTemplatesPage() {
  const { token } = useAdminAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandingSettings, setBrandingSettings] = useState<EmailBrandingSettings | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/email-templates?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        setStats(data.stats || null);
      } else {
        toast.error('Failed to load email templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandingSettings = useCallback(async () => {
    try {
      setBrandingLoading(true);
      const res = await fetch('/api/admin/email-branding', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setBrandingSettings(data);
      } else {
        console.error('Failed to load branding settings');
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    } finally {
      setBrandingLoading(false);
    }
  }, [token]);

  const handleLogoUpload = useCallback((type: 'header_logo' | 'footer_logo', url: string, width: number) => {
    setBrandingSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [`${type}_url`]: url,
        [`${type}_width`]: width,
      };
    });
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchBrandingSettings();
  }, [categoryFilter, fetchBrandingSettings]);

  const handleSearch = () => {
    setLoading(true);
    fetchTemplates();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the template "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error deleting template');
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          slug: `${template.slug}-copy-${Date.now()}`,
          category: template.category,
          subject: template.subject,
          preview_text: template.preview_text,
          html_content: '', // Will need to fetch full template
          is_active: false,
          for_replicated_site: template.for_replicated_site,
        }),
      });

      if (res.ok) {
        toast.success('Template duplicated. Edit the new template to customize it.');
        fetchTemplates();
      } else {
        toast.error('Failed to duplicate template');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Error duplicating template');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (res.ok) {
        toast.success(`Template ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchTemplates();
      } else {
        toast.error('Failed to update template');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Error updating template');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage email templates for the company and replicated websites.
          </p>
        </div>
        <Link href="/admin/email-templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.active}</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{stats.total - stats.active}</span>
              </div>
              <p className="text-sm text-muted-foreground">Inactive Templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {templates.filter(t => t.for_replicated_site).length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Replicated Site Templates</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            All email templates with logo header and company footer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No templates found</p>
                    <Link href="/admin/email-templates/new">
                      <Button variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Template
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {template.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[template.category] || ''}>
                        {template.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(template.id, template.is_active)}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {template.is_system && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                        {template.for_replicated_site && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Replicated
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/email-templates/${template.id}/preview`}>
                          <Button variant="ghost" size="icon" title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/email-templates/${template.id}`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Duplicate"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!template.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(template.id, template.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Branding Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Branding</CardTitle>
              <CardDescription>
                Upload and manage logos for email templates. Header logo appears on white background, footer logo on dark background.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBrandingSettings}
              disabled={brandingLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', brandingLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brandingLoading && !brandingSettings ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-[180px]" />
              <Skeleton className="h-[180px]" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Header Logo Upload */}
              <div>
                <h4 className="font-medium mb-3">Header Logo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Displayed on white background in email headers. Max 300x100px.
                </p>
                <LogoUpload
                  type="header_logo"
                  currentUrl={brandingSettings?.header_logo_url}
                  onUploadComplete={(url, width) => handleLogoUpload('header_logo', url, width)}
                  label="Upload Header Logo"
                  description="Recommended: PNG with transparency. Max 5MB."
                  previewBgColor="#ffffff"
                />
              </div>

              {/* Footer Logo Upload */}
              <div>
                <h4 className="font-medium mb-3">Footer Logo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Displayed on dark background (#1e3a5f) in email footers. Max 200x80px.
                </p>
                <LogoUpload
                  type="footer_logo"
                  currentUrl={brandingSettings?.footer_logo_url}
                  onUploadComplete={(url, width) => handleLogoUpload('footer_logo', url, width)}
                  label="Upload Footer Logo"
                  description="Use white/light colored logo. Max 5MB."
                  previewBgColor="#1e3a5f"
                />
              </div>
            </div>
          )}

          {/* Footer Address Preview */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Footer Address (All Emails)</h4>
            <div className="bg-muted p-4 rounded-lg text-center text-sm">
              <p className="font-medium">Apex Affinity Group</p>
              <p>1600 Highway 6 Ste 400</p>
              <p>Sugar Land, TX 77478</p>
              <p className="mt-2 text-muted-foreground">
                © {new Date().getFullYear()} Apex Affinity Group. All rights reserved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
