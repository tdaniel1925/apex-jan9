'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

interface Comment {
  id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  created_by_agent: {
    first_name: string;
    last_name: string;
  } | null;
  created_by_admin: {
    first_name: string;
    last_name: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending Review', variant: 'secondary', icon: Clock },
  under_review: { label: 'Under Review', variant: 'default', icon: Clock },
  info_requested: { label: 'Info Requested', variant: 'outline', icon: AlertTriangle },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
  denied: { label: 'Denied', variant: 'destructive', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'secondary', icon: XCircle },
};

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  commission: 'Commission Issue',
  clawback: 'Clawback Dispute',
  bonus: 'Bonus Calculation',
  override: 'Override Payment',
  rank: 'Rank Calculation',
  policy: 'Policy Credit',
  other: 'Other Issue',
};

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchDispute();
  }, [disputeId]);

  const fetchDispute = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}`);
      if (response.ok) {
        const data = await response.json();
        setDispute(data.dispute);
        setComments(data.comments || []);
      } else if (response.status === 404) {
        router.push('/dashboard/disputes');
      }
    } catch (error) {
      console.error('Failed to fetch dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/disputes/${disputeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchDispute();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const response = await fetch(`/api/disputes/${disputeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/disputes');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to withdraw dispute');
      }
    } catch (error) {
      console.error('Failed to withdraw dispute:', error);
      alert('Failed to withdraw dispute');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Dispute not found</p>
        <Link href="/dashboard/disputes">
          <Button variant="link">Back to Disputes</Button>
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const canWithdraw = ['pending', 'under_review', 'info_requested'].includes(dispute.status);
  const isResolved = ['approved', 'denied', 'withdrawn'].includes(dispute.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/disputes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{dispute.subject}</h1>
            <Badge variant={statusConfig.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Submitted {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
          </p>
        </div>
        {canWithdraw && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={withdrawing}>
                {withdrawing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Withdraw Dispute
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Withdraw Dispute?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to withdraw this dispute? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdraw}>
                  Yes, Withdraw
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{dispute.description}</p>
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {dispute.resolution && (
            <Card className={isResolved && dispute.status === 'approved' ? 'border-green-200 bg-green-50' : dispute.status === 'denied' ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {dispute.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{dispute.resolution}</p>
                {dispute.amount_adjusted !== null && (
                  <div className="mt-4 p-3 bg-background rounded-md">
                    <p className="text-sm text-muted-foreground">Amount Adjusted</p>
                    <p className="text-xl font-bold text-green-600">
                      ${dispute.amount_adjusted.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
              <CardDescription>
                Communication history for this dispute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No comments yet
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const author = comment.created_by_admin || comment.created_by_agent;
                    const isAdmin = !!comment.created_by_admin;
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={isAdmin ? 'bg-primary text-primary-foreground' : ''}>
                            {author ? `${author.first_name[0]}${author.last_name[0]}` : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {author ? `${author.first_name} ${author.last_name}` : 'Unknown'}
                            </span>
                            {isAdmin && (
                              <Badge variant="outline" className="text-xs">
                                Staff
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.comment}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isResolved && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={submitting || !newComment.trim()}
                      className="w-full sm:w-auto"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Comment
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{DISPUTE_TYPE_LABELS[dispute.dispute_type] || dispute.dispute_type}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge className={PRIORITY_BADGES[dispute.priority]?.className || ''}>
                  {PRIORITY_BADGES[dispute.priority]?.label || dispute.priority}
                </Badge>
              </div>

              {dispute.amount_disputed !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Amount Disputed</p>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{dispute.amount_disputed.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(dispute.created_at), 'PPp')}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(dispute.updated_at), 'PPp')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Requested Alert */}
          {dispute.status === 'info_requested' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">Information Requested</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Our team needs additional information to process your dispute. Please check the comments and respond with the requested details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
