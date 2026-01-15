'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertCircle,
  Crown,
  Edit,
  Loader2,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/engines/wallet-engine';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  agent_code: string;
  rank: string;
}

interface FounderPartner {
  id: string;
  slot_number: number;
  name: string | null;
  email: string | null;
  agent_id: string | null;
  user_id: string | null;
  share_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  agent: Agent | null;
}

interface OverrideSummary {
  totalPending: number;
  totalPaid: number;
  recentPeriods: {
    period_year: number;
    period_month: number;
    status: string;
    override_count: number;
    total_amount: number;
  }[];
}

export default function AdminFoundersPage() {
  const [partners, setPartners] = useState<FounderPartner[]>([]);
  const [overrideSummary, setOverrideSummary] = useState<OverrideSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<FounderPartner | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    agent_id: '',
    is_active: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/founders');

      if (!response.ok) {
        throw new Error(`Failed to fetch founders: ${response.statusText}`);
      }

      const data = await response.json();
      setPartners(data.partners || []);
      setOverrideSummary(data.overrideSummary || null);
    } catch (err) {
      console.error('Error fetching founders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load founder partners');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAgents();
  }, []);

  const handleEditClick = (partner: FounderPartner) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name || '',
      email: partner.email || '',
      agent_id: partner.agent_id || '',
      is_active: partner.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleAgentSelect = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setFormData({
        ...formData,
        agent_id: agentId,
        name: `${agent.first_name} ${agent.last_name}`,
        email: agent.email,
      });
    } else if (agentId === '__clear__') {
      setFormData({
        ...formData,
        agent_id: '',
        name: '',
        email: '',
      });
    }
  };

  const handleSave = async () => {
    if (!selectedPartner) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/founders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: selectedPartner.slot_number,
          name: formData.name || null,
          email: formData.email || null,
          agent_id: formData.agent_id || null,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update founder partner');
      }

      toast.success(`Partner slot ${selectedPartner.slot_number} updated successfully`);
      setIsEditDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error updating founder partner:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSlot = async () => {
    if (!selectedPartner) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/founders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: selectedPartner.slot_number,
          name: null,
          email: null,
          agent_id: null,
          is_active: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear slot');
      }

      toast.success(`Partner slot ${selectedPartner.slot_number} cleared`);
      setIsEditDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error clearing slot:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to clear slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate active partners
  const activePartners = partners.filter((p) => p.is_active).length;
  const totalShareActive = partners
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + Number(p.share_percentage), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Founders Club Management
          </h1>
          <p className="text-muted-foreground">
            Manage the 4 founder partner positions who share FC Inc.&apos;s override earnings.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePartners} / 4</div>
            <p className="text-xs text-muted-foreground">
              {totalShareActive}% of overrides allocated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Overrides</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overrideSummary?.totalPending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting distribution
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overrideSummary?.totalPaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time distributions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Root Entity</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">FC Inc.</div>
            <p className="text-xs text-muted-foreground">
              Agent Code: FC-INC-001
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matrix Structure Info */}
      <Card>
        <CardHeader>
          <CardTitle>Matrix Structure</CardTitle>
          <CardDescription>
            How the Founders Club fits into the 5x7 matrix structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
            <div className="text-center mb-2 text-muted-foreground">Level 0 (Root)</div>
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500 px-4 py-2 rounded-lg">
                <span className="font-bold">FC Inc.</span>
                <span className="text-muted-foreground ml-2">(path: 0)</span>
              </div>
            </div>
            <div className="text-center mb-2 text-muted-foreground">Level 1 - Direct Positions</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((pos) => (
                <div
                  key={pos}
                  className="bg-background border px-3 py-1 rounded text-sm"
                >
                  Position {pos}
                  <span className="text-muted-foreground ml-1">(0.{pos})</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-4 text-xs text-muted-foreground">
              All agents without a sponsor are placed under FC Inc. via spillover
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner Slots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Founder Partner Slots</CardTitle>
          <CardDescription>
            Each partner receives 25% of FC Inc.&apos;s override earnings when active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Linked Agent</TableHead>
                <TableHead>Share</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">#{partner.slot_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.name ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {partner.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{partner.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Empty Slot</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {partner.email || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {partner.agent ? (
                      <div>
                        <p className="text-sm font-medium">
                          {partner.agent.first_name} {partner.agent.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {partner.agent.agent_code}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not linked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.share_percentage}%</Badge>
                  </TableCell>
                  <TableCell>
                    {partner.is_active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(partner)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Founders Club Works</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>FC Inc.</strong> is the root entity at the top of the matrix (level 0, path &quot;0&quot;).
            </li>
            <li>
              When an agent signs up <strong>without a sponsor</strong>, they are placed under FC Inc. via spillover.
            </li>
            <li>
              FC Inc. earns override commissions on all agents in its downline (up to 6 generations).
            </li>
            <li>
              The 4 founder partners <strong>share these overrides equally</strong> (25% each when all slots are active).
            </li>
            <li>
              Partners can be linked to an agent account to track their own recruiting activity.
            </li>
            <li>
              Inactive slots do not receive distributions — their share is held until the slot is filled.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Edit Partner Slot #{selectedPartner?.slot_number}
            </DialogTitle>
            <DialogDescription>
              Configure this founder partner position. Link to an agent for automatic name/email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Link to Agent (Optional)</Label>
              <Select
                value={formData.agent_id || ''}
                onValueChange={handleAgentSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__">
                    — No linked agent —
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Linking an agent auto-fills name and email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Partner Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter partner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Partner Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter partner email"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Only active partners receive override distributions
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearSlot}
              disabled={isSubmitting}
            >
              Clear Slot
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
