'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Search,
  Send,
  DollarSign,
  User,
  Calendar,
  Filter,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  agent_code: string;
}

interface Dispute {
  id: string;
  agent_id: string;
  dispute_type: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  amount_disputed: number | null;
  amount_adjusted: number | null;
  resolution: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  agent: Agent;
}

interface Comment {
  id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
  created_by_agent: { first_name: string; last_name: string } | null;
  created_by_admin: { first_name: string; last_name: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  under_review: number;
  info_requested: number;
  approved: number;
  denied: number;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  under_review: { label: 'Under Review', variant: 'default', icon: Clock },
  info_requested: { label: 'Info Requested', variant: 'outline', icon: AlertTriangle },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
  denied: { label: 'Denied', variant: 'destructive', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'secondary', icon: XCircle },
};

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  commission: 'Commission',
  clawback: 'Clawback',
  bonus: 'Bonus',
  override: 'Override',
  rank: 'Rank',
  policy: 'Policy',
  other: 'Other',
};

const PRIORITY_BADGES: Record<string, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, under_review: 0, info_requested: 0, approved: 0, denied: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [resolution, setResolution] = useState('');
  const [amountAdjusted, setAmountAdjusted] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [updatingDispute, setUpdatingDispute] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, typeFilter]);

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('apex_admin_token');
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        setStats(data.stats || { total: 0, pending: 0, under_review: 0, info_requested: 0, approved: 0, denied: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetails = async (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setLoadingComments(true);
    setNewStatus(dispute.status);
    setNewPriority(dispute.priority);
    setResolution(dispute.resolution || '');
    setAmountAdjusted(dispute.amount_adjusted?.toString() || '');

    try {
      const token = localStorage.getItem('apex_admin_token');
      const response = await fetch(`/api/admin/disputes/${dispute.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch dispute details:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDispute) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('apex_admin_token');
      const response = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: newComment,
          is_internal: isInternal,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setIsInternal(false);
        fetchDisputeDetails(selectedDispute);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;

    setUpdatingDispute(true);
    try {
      const token = localStorage.getItem('apex_admin_token');
      const updateData: Record<string, unknown> = {};

      if (newStatus !== selectedDispute.status) {
        updateData.status = newStatus;
      }
      if (newPriority !== selectedDispute.priority) {
        updateData.priority = newPriority;
      }
      if (resolution !== (selectedDispute.resolution || '')) {
        updateData.resolution = resolution || null;
      }
      if (amountAdjusted !== (selectedDispute.amount_adjusted?.toString() || '')) {
        updateData.amount_adjusted = amountAdjusted ? parseFloat(amountAdjusted) : null;
      }

      if (Object.keys(updateData).length === 0) {
        setUpdatingDispute(false);
        return;
      }

      const response = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDispute(data.dispute);
        fetchDisputes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update dispute');
      }
    } catch (error) {
      console.error('Failed to update dispute:', error);
      alert('Failed to update dispute');
    } finally {
      setUpdatingDispute(false);
    }
  };

  const filteredDisputes = disputes.filter((dispute) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dispute.subject.toLowerCase().includes(query) ||
      dispute.agent.first_name.toLowerCase().includes(query) ||
      dispute.agent.last_name.toLowerCase().includes(query) ||
      dispute.agent.email.toLowerCase().includes(query) ||
      dispute.agent.agent_code.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispute Management</h1>
        <p className="text-muted-foreground">
          Review and resolve agent disputes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('under_review')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">{stats.under_review}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('info_requested')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Info Requested</p>
            <p className="text-2xl font-bold text-orange-600">{stats.info_requested}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setStatusFilter('denied')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Denied</p>
            <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by agent, email, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="clawback">Clawback</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="override">Override</SelectItem>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No disputes found
                </TableCell>
              </TableRow>
            ) : (
              filteredDisputes.map((dispute) => {
                const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                return (
                  <TableRow key={dispute.id} className="cursor-pointer hover:bg-muted/50" onClick={() => fetchDisputeDetails(dispute)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {dispute.agent.first_name[0]}{dispute.agent.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {dispute.agent.first_name} {dispute.agent.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dispute.agent.agent_code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate font-medium">
                        {dispute.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {DISPUTE_TYPE_LABELS[dispute.dispute_type] || dispute.dispute_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_BADGES[dispute.priority]?.className || ''}>
                        {PRIORITY_BADGES[dispute.priority]?.label || dispute.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dispute.amount_disputed !== null ? (
                        <span className="font-medium">${dispute.amount_disputed.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dispute Detail Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedDispute.subject}
                  <Badge variant={STATUS_CONFIG[selectedDispute.status]?.variant || 'secondary'}>
                    {STATUS_CONFIG[selectedDispute.status]?.label || selectedDispute.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedDispute.agent.first_name} {selectedDispute.agent.last_name} ({selectedDispute.agent.agent_code})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedDispute.created_at), 'PPp')}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium">{DISPUTE_TYPE_LABELS[selectedDispute.dispute_type]}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Priority</Label>
                      <Badge className={PRIORITY_BADGES[selectedDispute.priority]?.className || ''}>
                        {PRIORITY_BADGES[selectedDispute.priority]?.label}
                      </Badge>
                    </div>
                    {selectedDispute.amount_disputed !== null && (
                      <div>
                        <Label className="text-muted-foreground">Amount Disputed</Label>
                        <p className="font-medium text-lg">${selectedDispute.amount_disputed.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedDispute.amount_adjusted !== null && (
                      <div>
                        <Label className="text-muted-foreground">Amount Adjusted</Label>
                        <p className="font-medium text-lg text-green-600">${selectedDispute.amount_adjusted.toFixed(2)}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 whitespace-pre-wrap">{selectedDispute.description}</p>
                  </div>

                  {selectedDispute.resolution && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground">Resolution</Label>
                        <p className="mt-1 whitespace-pre-wrap">{selectedDispute.resolution}</p>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="comments" className="space-y-4 mt-4">
                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No comments yet
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {comments.map((comment) => {
                        const author = comment.created_by_admin || comment.created_by_agent;
                        const isAdmin = !!comment.created_by_admin;
                        return (
                          <div key={comment.id} className={`flex gap-3 p-3 rounded-md ${comment.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/50'}`}>
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
                                {isAdmin && <Badge variant="outline" className="text-xs">Staff</Badge>}
                                {comment.is_internal && <Badge variant="secondary" className="text-xs">Internal</Badge>}
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

                  <Separator />

                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded"
                        />
                        Internal note (agent won&apos;t see this)
                      </label>
                      <Button
                        onClick={handleAddComment}
                        disabled={submittingComment || !newComment.trim()}
                      >
                        {submittingComment ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="info_requested">Info Requested</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newPriority} onValueChange={setNewPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(newStatus === 'approved' || newStatus === 'denied') && (
                    <>
                      <div className="space-y-2">
                        <Label>Resolution</Label>
                        <Textarea
                          placeholder="Explain the resolution..."
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {newStatus === 'approved' && selectedDispute.amount_disputed !== null && (
                        <div className="space-y-2">
                          <Label>Amount Adjusted</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={amountAdjusted}
                              onChange={(e) => setAmountAdjusted(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Original disputed amount: ${selectedDispute.amount_disputed.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                  Close
                </Button>
                <Button onClick={handleUpdateDispute} disabled={updatingDispute}>
                  {updatingDispute ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
