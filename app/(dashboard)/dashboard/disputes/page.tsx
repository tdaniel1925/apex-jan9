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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('disputes');
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
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newDispute')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.total')}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('pending')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.pending')}</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('under_review')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.underReview')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.under_review}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('approved')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('stats.resolved')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('noDisputes')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filter === 'all'
                ? t('noDisputesYet')
                : t('noDisputesWithStatus', { status: filter })}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('submitFirstDispute')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const statusKey = dispute.status === 'under_review' ? 'underReview' :
                             dispute.status === 'info_requested' ? 'infoRequested' : dispute.status;
            return (
              <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`}>
                <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(dispute.status)}
                          <h3 className="font-medium">{dispute.subject}</h3>
                          <Badge variant={STATUS_BADGES[dispute.status]?.variant || 'secondary'}>
                            {t(`status.${statusKey}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {dispute.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{t(`types.${dispute.dispute_type}`)}</span>
                          <span>
                            {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                          </span>
                          {dispute.amount_disputed && (
                            <span>${dispute.amount_disputed.toFixed(2)} {t('disputed')}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Dispute Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('modal.title')}</DialogTitle>
            <DialogDescription>
              {t('modal.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">{t('form.disputeType')} *</Label>
              <Select
                value={formData.dispute_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, dispute_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {DISPUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`types.${type.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('form.subject')} *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder={t('form.subjectPlaceholder')}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t('form.amountDisputed')}</Label>
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
              <Label htmlFor="description">{t('form.descriptionLabel')} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('form.descriptionPlaceholder')}
                rows={5}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/5000 {t('form.characters')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !formData.dispute_type || !formData.subject || !formData.description}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submitDispute')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
