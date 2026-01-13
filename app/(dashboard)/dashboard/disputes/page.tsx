'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Dispute {
  id: string;
  dispute_type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  amount_disputed: number | null;
  amount_adjusted: number | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  pending: number;
  under_review: number;
  resolved: number;
}

const DISPUTE_TYPES = [
  { value: 'commission', label: 'Commission Issue' },
  { value: 'clawback', label: 'Clawback Dispute' },
  { value: 'bonus', label: 'Bonus Calculation' },
  { value: 'override', label: 'Override Payment' },
  { value: 'rank', label: 'Rank Calculation' },
  { value: 'policy', label: 'Policy Credit' },
  { value: 'other', label: 'Other Issue' },
];

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Review', variant: 'secondary' },
  under_review: { label: 'Under Review', variant: 'default' },
  info_requested: { label: 'Info Requested', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  denied: { label: 'Denied', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'secondary' },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, under_review: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const [formData, setFormData] = useState({
    dispute_type: '',
    subject: '',
    description: '',
    amount_disputed: '',
  });

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      const url = filter === 'all'
        ? '/api/disputes'
        : `/api/disputes?status=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        setStats(data.stats || { total: 0, pending: 0, under_review: 0, resolved: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.dispute_type || !formData.subject || !formData.description) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_type: formData.dispute_type,
          subject: formData.subject,
          description: formData.description,
          amount_disputed: formData.amount_disputed ? parseFloat(formData.amount_disputed) : undefined,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ dispute_type: '', subject: '', description: '', amount_disputed: '' });
        fetchDisputes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create dispute');
      }
    } catch (error) {
      console.error('Failed to create dispute:', error);
      alert('Failed to create dispute');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
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
          <h1 className="text-2xl font-bold tracking-tight">My Disputes</h1>
          <p className="text-muted-foreground">
            Submit and track disputes for commissions, clawbacks, and other issues
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Dispute
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('pending')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('under_review')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">{stats.under_review}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('approved')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No disputes found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filter === 'all'
                ? "You haven't submitted any disputes yet."
                : `No disputes with status "${filter}".`}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit Your First Dispute
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`}>
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dispute.status)}
                        <h3 className="font-medium">{dispute.subject}</h3>
                        <Badge variant={STATUS_BADGES[dispute.status]?.variant || 'secondary'}>
                          {STATUS_BADGES[dispute.status]?.label || dispute.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {dispute.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{dispute.dispute_type.replace('_', ' ')}</span>
                        <span>
                          {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                        </span>
                        {dispute.amount_disputed && (
                          <span>${dispute.amount_disputed.toFixed(2)} disputed</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dispute Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a Dispute</DialogTitle>
            <DialogDescription>
              Describe your issue and we&apos;ll review it as soon as possible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Dispute Type *</Label>
              <Select
                value={formData.dispute_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dispute_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief summary of the issue"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount Disputed (optional)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount_disputed}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount_disputed: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide all relevant details including dates, policy numbers, and any other information that will help us resolve this quickly..."
                rows={5}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/5000 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.dispute_type || !formData.subject || !formData.description}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
