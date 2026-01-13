'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Webhook,
  Plus,
  Play,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WebhookEndpoint {
  id: string;
  name: string;
  description: string | null;
  url: string;
  secret_key: string | null;
  is_active: boolean;
  events: string[];
  headers: Record<string, string>;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

interface WebhookEvent {
  value: string;
  label: string;
  description: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [availableEvents, setAvailableEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    secret_key: '',
    events: [] as string[],
    is_active: true,
    retry_count: 3,
    timeout_seconds: 30,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('apex_admin_token');
      const response = await fetch('/api/admin/webhooks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
        setAvailableEvents(data.availableEvents || []);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (webhook?: WebhookEndpoint) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        name: webhook.name,
        description: webhook.description || '',
        url: webhook.url,
        secret_key: webhook.secret_key || '',
        events: webhook.events,
        is_active: webhook.is_active,
        retry_count: webhook.retry_count,
        timeout_seconds: webhook.timeout_seconds,
      });
    } else {
      setEditingWebhook(null);
      setFormData({
        name: '',
        description: '',
        url: '',
        secret_key: '',
        events: [],
        is_active: true,
        retry_count: 3,
        timeout_seconds: 30,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('apex_admin_token');
      const url = editingWebhook
        ? `/api/admin/webhooks/${editingWebhook.id}`
        : '/api/admin/webhooks';

      const response = await fetch(url, {
        method: editingWebhook ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchWebhooks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save webhook');
      }
    } catch (error) {
      console.error('Failed to save webhook:', error);
      alert('Failed to save webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const token = localStorage.getItem('apex_admin_token');
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTest = async (webhook: WebhookEndpoint) => {
    setTesting(webhook.id);
    setTestResult(null);

    try {
      const token = localStorage.getItem('apex_admin_token');
      const response = await fetch(`/api/admin/webhooks/${webhook.id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setTestResult({
        id: webhook.id,
        success: data.success,
        message: data.success
          ? `Success (${data.statusCode}) in ${data.duration}ms`
          : data.error || 'Failed',
      });
    } catch (error) {
      setTestResult({
        id: webhook.id,
        success: false,
        message: 'Test failed',
      });
    } finally {
      setTesting(null);
    }
  };

  const toggleEventSelection = (eventValue: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter((e) => e !== eventValue)
        : [...prev.events, eventValue],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure Zapier and other webhook integrations
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Zapier Setup Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-600" />
            Zapier Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            To connect with Zapier, create a webhook here and use the URL as a &quot;Webhooks by Zapier&quot; trigger.
          </p>
          <p>
            Each webhook can subscribe to multiple events. When an event occurs, Apex will send a POST request
            to your webhook URL with the event data.
          </p>
          <a
            href="https://zapier.com/apps/webhook/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            Learn more about Zapier webhooks
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a webhook to start sending events to Zapier or other services.
            </p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{webhook.name}</div>
                      {webhook.description && (
                        <div className="text-xs text-muted-foreground">{webhook.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded truncate max-w-[200px] block">
                      {webhook.url}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {webhook.is_active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="text-green-600">{webhook.success_count} ok</span>
                      {' / '}
                      <span className="text-red-600">{webhook.failure_count} fail</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {webhook.last_triggered_at
                        ? formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })
                        : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Test Result */}
                      {testResult?.id === webhook.id && (
                        <span className={`text-xs mr-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                          {testResult.success ? <CheckCircle className="h-4 w-4 inline" /> : <XCircle className="h-4 w-4 inline" />}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTest(webhook)}
                        disabled={testing === webhook.id}
                        title="Test webhook"
                      >
                        {testing === webhook.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(webhook)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(webhook.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint to receive event notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Zapier - New Agents"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://hooks.zapier.com/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What this webhook is used for..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret Key (optional)</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret_key}
                onChange={(e) => setFormData((prev) => ({ ...prev, secret_key: e.target.value }))}
                placeholder="For HMAC signature verification"
              />
              <p className="text-xs text-muted-foreground">
                If provided, requests will include an X-Webhook-Signature header for verification.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Events *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select which events should trigger this webhook.
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                {availableEvents.map((event) => (
                  <div key={event.value} className="flex items-start space-x-2">
                    <Checkbox
                      id={event.value}
                      checked={formData.events.includes(event.value)}
                      onCheckedChange={() => toggleEventSelection(event.value)}
                    />
                    <div className="grid gap-1 leading-none">
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {event.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label htmlFor="active">Webhook is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.url || formData.events.length === 0}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingWebhook ? 'Update Webhook' : 'Create Webhook'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
