'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  RefreshCw,
  Save,
  Link,
  Unlink,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Database,
  Code2,
  Loader2,
  Timer,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SmartOfficeDeveloperTools } from '@/components/admin/smartoffice/developer-tools';

interface SyncStats {
  totalAgents: number;
  mappedAgents: number;
  unmappedAgents: number;
  totalPolicies: number;
  totalCommissions: number;
  lastSync: string | null;
  nextSync: string | null;
}

interface SmartOfficeAgent {
  id: string;
  smartoffice_id: string;
  contact_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  client_type: string | null;
  status: string | null;
  hierarchy_id: string | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  apex_agent_id: string | null;
  apex_agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    agent_code: string;
  } | null;
}

interface SmartOfficePolicy {
  id: string;
  smartoffice_id: string;
  policy_number: string | null;
  product_name: string | null;
  carrier: string | null;
  status: string | null;
  agent_id: string | null;
  writing_agent_smartoffice_id: string | null;
  premium: number | null;
  issue_date: string | null;
  effective_date: string | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  agents_synced: number;
  agents_created: number;
  agents_updated: number;
  policies_synced: number;
  policies_created: number;
  policies_updated: number;
  commissions_synced: number;
  error_count: number;
  error_messages: string[] | null;
  triggered_by: string | null;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SyncProgress {
  stage: 'init' | 'fetching_agents' | 'syncing_agents' | 'fetching_policies' | 'syncing_policies' | 'complete' | 'error';
  message: string;
  current: number;
  total: number;
  percentage: number;
  elapsed_ms: number;
  eta_ms: number | null;
  details?: {
    agents_synced?: number;
    agents_created?: number;
    agents_updated?: number;
    policies_synced?: number;
    policies_created?: number;
    errors?: number;
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default function SmartOfficePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<SyncLog[]>([]);
  const [agents, setAgents] = useState<SmartOfficeAgent[]>([]);
  const [policies, setPolicies] = useState<SmartOfficePolicy[]>([]);
  const [agentFilter, setAgentFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [agentSearch, setAgentSearch] = useState('');
  const [policySearch, setPolicySearch] = useState('');
  const [mappingAgent, setMappingAgent] = useState<SmartOfficeAgent | null>(null);
  const [apexAgents, setApexAgents] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<SmartOfficeAgent | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<SmartOfficePolicy | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Pagination state
  const [agentsPagination, setAgentsPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [policiesPagination, setPoliciesPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [logsPagination, setLogsPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Config form state
  const [config, setConfig] = useState({
    sitename: '',
    username: '',
    api_key: '',
    api_secret: '',
    is_active: true,
    sync_frequency_hours: 6,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/smartoffice');
      if (response.ok) {
        const data = await response.json();
        setIsConfigured(data.isConfigured);
        setStats(data.stats);
        setRecentLogs(data.recentLogs || []);
        if (data.config) {
          setConfig({
            sitename: data.config.sitename || '',
            username: data.config.username || '',
            api_key: '', // Don't pre-fill masked values
            api_secret: '',
            is_active: data.config.is_active ?? true,
            sync_frequency_hours: data.config.sync_frequency_hours ?? 6,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch SmartOffice data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgents = useCallback(async (page = agentsPagination.page) => {
    try {
      const params = new URLSearchParams({
        filter: agentFilter,
        page: String(page),
        limit: String(agentsPagination.limit),
      });
      if (agentSearch) {
        params.set('search', agentSearch);
      }
      const response = await fetch(`/api/admin/smartoffice/agents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        // Handle both direct total and pagination object formats
        const total = data.pagination?.total ?? data.total ?? 0;
        setAgentsPagination(prev => ({
          ...prev,
          page,
          total,
          totalPages: data.pagination?.totalPages ?? Math.ceil(total / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, [agentFilter, agentSearch, agentsPagination.page, agentsPagination.limit]);

  const fetchPolicies = useCallback(async (page = policiesPagination.page) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(policiesPagination.limit),
      });
      if (policySearch) {
        params.set('search', policySearch);
      }
      const response = await fetch(`/api/admin/smartoffice/policies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies || []);
        // Handle both direct total and pagination object formats
        const total = data.pagination?.total ?? data.total ?? 0;
        setPoliciesPagination(prev => ({
          ...prev,
          page,
          total,
          totalPages: data.pagination?.totalPages ?? Math.ceil(total / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  }, [policySearch, policiesPagination.page, policiesPagination.limit]);

  const fetchLogs = useCallback(async (page = logsPagination.page) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(logsPagination.limit),
      });
      const response = await fetch(`/api/admin/smartoffice/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecentLogs(data.logs || []);
        // Handle both direct total and pagination object formats
        const total = data.pagination?.total ?? data.total ?? 0;
        setLogsPagination(prev => ({
          ...prev,
          page,
          total,
          totalPages: data.pagination?.totalPages ?? Math.ceil(total / prev.limit),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [logsPagination.page, logsPagination.limit]);

  const fetchApexAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents?limit=500');
      if (response.ok) {
        const data = await response.json();
        setApexAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch Apex agents:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isConfigured) {
      fetchAgents(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, agentFilter, agentSearch]);

  useEffect(() => {
    if (isConfigured) {
      fetchPolicies(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, policySearch]);

  useEffect(() => {
    if (isConfigured) {
      fetchLogs(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured]);

  // Save config
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/smartoffice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        await fetchData();
        setStatusMessage({ type: 'success', message: 'SmartOffice configuration saved successfully!' });
      } else {
        const error = await response.json();
        setStatusMessage({ type: 'error', message: error.message || 'Failed to save configuration' });
      }
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  // Run sync with progress streaming
  const handleSync = async (type: 'full' | 'agents' | 'policies' | 'automap') => {
    // For automap, use the old endpoint (quick operation)
    if (type === 'automap') {
      setSyncing(true);
      try {
        const response = await fetch('/api/admin/smartoffice/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });

        if (response.ok) {
          const result = await response.json();
          await fetchData();
          await fetchAgents();
          setStatusMessage({ type: 'success', message: `Auto-mapping complete! Mapped: ${result.result?.mapped || 0}, Unmatched: ${result.result?.unmatched?.length || 0}` });
        } else {
          const error = await response.json();
          setStatusMessage({ type: 'error', message: `Auto-map failed: ${error.message || 'Unknown error'}` });
        }
      } catch {
        setStatusMessage({ type: 'error', message: 'Auto-map failed' });
      } finally {
        setSyncing(false);
      }
      return;
    }

    // For full sync, use streaming endpoint with progress
    setSyncing(true);
    setStatusMessage(null); // Clear any previous status messages
    setSyncProgress({
      stage: 'init',
      message: 'Starting sync...',
      current: 0,
      total: 100,
      percentage: 0,
      elapsed_ms: 0,
      eta_ms: null,
    });

    try {
      const response = await fetch('/api/admin/smartoffice/sync/stream', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start sync');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as SyncProgress;
              setSyncProgress(data);

              if (data.stage === 'complete') {
                // Refresh data after sync completes
                setTimeout(async () => {
                  await fetchData();
                  await fetchAgents(1);
                  await fetchPolicies(1);
                  await fetchLogs(1);
                }, 500);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      setSyncProgress({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Sync failed',
        current: 0,
        total: 100,
        percentage: 0,
        elapsed_ms: 0,
        eta_ms: null,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Clear all SmartOffice data
  const handleClearData = async () => {
    setClearing(true);
    try {
      const response = await fetch('/api/admin/smartoffice/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_ALL_SMARTOFFICE_DATA' }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowClearConfirm(false);
        setStatusMessage({
          type: 'success',
          message: `Data cleared successfully! Deleted: ${result.deleted.agents} agents, ${result.deleted.policies} policies, ${result.deleted.syncLogs} sync logs`,
        });
        // Refresh all data
        await fetchData();
        await fetchAgents(1);
        await fetchPolicies(1);
        await fetchLogs(1);
      } else {
        const error = await response.json();
        setStatusMessage({ type: 'error', message: error.error || 'Failed to clear data' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to clear data' });
    } finally {
      setClearing(false);
    }
  };

  // Map agent
  const handleMapAgent = async (apexAgentId: string | null) => {
    if (!mappingAgent) return;

    try {
      const response = await fetch('/api/admin/smartoffice/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartoffice_agent_id: mappingAgent.id,
          apex_agent_id: apexAgentId,
        }),
      });

      if (response.ok) {
        setMappingAgent(null);
        await fetchAgents();
        await fetchData();
        setStatusMessage({ type: 'success', message: 'Agent mapping updated successfully!' });
      } else {
        setStatusMessage({ type: 'error', message: 'Failed to map agent' });
      }
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to map agent' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SmartOffice Integration</h1>
          <p className="text-muted-foreground">
            Sync agent hierarchy, commissions, and policies from SmartOffice CRM.
          </p>
        </div>
        {isConfigured && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSync('automap')} disabled={syncing}>
              <Link className="mr-2 h-4 w-4" />
              Auto-Map Agents
            </Button>
            <Button onClick={() => handleSync('full')} disabled={syncing}>
              {syncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Full Sync
            </Button>
          </div>
        )}
      </div>

      {/* Inline Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${
          statusMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : statusMessage.type === 'error'
            ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {statusMessage.type === 'error' && <XCircle className="h-5 w-5" />}
            {statusMessage.type === 'info' && <AlertCircle className="h-5 w-5" />}
            <p className="text-sm whitespace-pre-wrap">{statusMessage.message}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStatusMessage(null)} className="h-6 w-6 p-0">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Inline Sync Progress */}
      {syncProgress && syncProgress.stage !== 'complete' && syncProgress.stage !== 'error' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Header with spinner */}
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{syncProgress.message}</span>
                    <span className="text-sm text-muted-foreground">{syncProgress.percentage}%</span>
                  </div>
                  <Progress value={syncProgress.percentage} className="h-2 mt-2" />
                </div>
              </div>

              {/* Time info */}
              {syncProgress.stage !== 'init' && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Elapsed:</span>
                    <span className="font-mono">{formatDuration(syncProgress.elapsed_ms)}</span>
                  </div>
                  {syncProgress.eta_ms !== null && syncProgress.eta_ms > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">ETA:</span>
                      <span className="font-mono">{formatDuration(syncProgress.eta_ms)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              {syncProgress.details && (
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {syncProgress.details.agents_synced ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Agents Synced</div>
                    {(syncProgress.details.agents_created ?? 0) > 0 && (
                      <div className="text-xs text-green-600">+{syncProgress.details.agents_created} new</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">
                      {syncProgress.details.policies_synced ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Policies Synced</div>
                    {(syncProgress.details.policies_created ?? 0) > 0 && (
                      <div className="text-xs text-green-600">+{syncProgress.details.policies_created} new</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${(syncProgress.details.errors ?? 0) > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {syncProgress.details.errors ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Complete/Error Summary */}
      {syncProgress && (syncProgress.stage === 'complete' || syncProgress.stage === 'error') && (
        <Card className={syncProgress.stage === 'complete' ? 'border-green-500/50 bg-green-50 dark:bg-green-950' : 'border-red-500/50 bg-red-50 dark:bg-red-950'}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {syncProgress.stage === 'complete' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className={`font-medium ${syncProgress.stage === 'complete' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {syncProgress.stage === 'complete' ? 'Sync Complete' : 'Sync Failed'}
                  </p>
                  <p className={`text-sm ${syncProgress.stage === 'complete' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {syncProgress.stage === 'complete'
                      ? `Synced ${syncProgress.details?.agents_synced ?? 0} agents and ${syncProgress.details?.policies_synced ?? 0} policies in ${formatDuration(syncProgress.elapsed_ms)}`
                      : syncProgress.message
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSyncProgress(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={isConfigured ? 'overview' : 'config'}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents ({agentsPagination.total})</TabsTrigger>
          <TabsTrigger value="policies">Policies ({policiesPagination.total})</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="devtools" className="flex items-center gap-1">
            <Code2 className="h-3 w-3" />
            Dev Tools
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {!isConfigured ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">SmartOffice Not Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up your SmartOffice API credentials to start syncing data.
                  </p>
                  <Button variant="outline" onClick={() => (document.querySelector('[data-value="config"]') as HTMLElement | null)?.click()}>
                    Configure Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Imported Agents</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.mappedAgents || 0} mapped, {stats?.unmappedAgents || 0} unmapped
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Policies</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalPolicies || 0}</div>
                    <p className="text-xs text-muted-foreground">Imported from SmartOffice</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : 'Not synced yet'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Next Sync</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.nextSync ? new Date(stats.nextSync).toLocaleDateString() : 'Not scheduled'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.nextSync ? new Date(stats.nextSync).toLocaleTimeString() : 'Configure sync schedule'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Sync History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Syncs</CardTitle>
                  <CardDescription>Last 5 synchronization operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No sync history yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant="outline">{log.sync_type}</Badge>
                            </TableCell>
                            <TableCell>
                              {log.status === 'completed' && (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {log.status === 'failed' && (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {log.status === 'running' && (
                                <Badge variant="secondary">
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Running
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                            <TableCell>
                              {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                            </TableCell>
                            <TableCell>
                              {log.agents_synced} agents, {log.policies_synced} policies
                              {log.error_count > 0 && (
                                <span className="text-destructive ml-2">({log.error_count} errors)</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SmartOffice Agents</CardTitle>
                  <CardDescription>Map SmartOffice agents to Apex agents. Showing {agents.length} of {agentsPagination.total} agents.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="w-[250px]"
                  />
                  <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v as typeof agentFilter)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      <SelectItem value="mapped">Mapped Only</SelectItem>
                      <SelectItem value="unmapped">Unmapped Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SO ID</TableHead>
                      <TableHead>Contact ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Tax ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hierarchy</TableHead>
                      <TableHead>Synced At</TableHead>
                      <TableHead>Mapped To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground">
                          {isConfigured ? 'No agents found. Run a sync first.' : 'Configure SmartOffice first.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      agents.map((agent) => (
                        <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedAgent(agent)}>
                          <TableCell className="font-mono text-xs">{agent.smartoffice_id}</TableCell>
                          <TableCell className="font-mono text-xs">{agent.contact_id || '-'}</TableCell>
                          <TableCell>
                            <div className="font-medium whitespace-nowrap">
                              {agent.first_name} {agent.last_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{agent.email || '-'}</TableCell>
                          <TableCell className="text-sm">{agent.phone || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{agent.tax_id ? `***${agent.tax_id.slice(-4)}` : '-'}</TableCell>
                          <TableCell>
                            {agent.client_type && <Badge variant="outline">{agent.client_type}</Badge>}
                          </TableCell>
                          <TableCell>
                            {agent.status && (
                              <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                                {agent.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{agent.hierarchy_id || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {agent.synced_at ? new Date(agent.synced_at).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {agent.apex_agent ? (
                              <div className="whitespace-nowrap">
                                <span className="font-medium text-sm">
                                  {agent.apex_agent.first_name} {agent.apex_agent.last_name}
                                </span>
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {agent.apex_agent.agent_code}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="secondary">Unmapped</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMappingAgent(agent);
                                fetchApexAgents();
                              }}
                            >
                              {agent.apex_agent_id ? (
                                <>
                                  <Unlink className="h-3 w-3 mr-1" />
                                  Change
                                </>
                              ) : (
                                <>
                                  <Link className="h-3 w-3 mr-1" />
                                  Map
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {agentsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {agentsPagination.page} of {agentsPagination.totalPages} ({agentsPagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={agentsPagination.page <= 1}
                      onClick={() => fetchAgents(agentsPagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={agentsPagination.page >= agentsPagination.totalPages}
                      onClick={() => fetchAgents(agentsPagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SmartOffice Policies</CardTitle>
                  <CardDescription>Showing {policies.length} of {policiesPagination.total} policies.</CardDescription>
                </div>
                <Input
                  placeholder="Search by policy number or product..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="w-[300px]"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SO ID</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Writing Agent</TableHead>
                      <TableHead>Synced At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          {isConfigured ? 'No policies found. Run a sync first.' : 'Configure SmartOffice first.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      policies.map((policy) => (
                        <TableRow key={policy.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPolicy(policy)}>
                          <TableCell className="font-mono text-xs">{policy.smartoffice_id}</TableCell>
                          <TableCell className="font-medium">{policy.policy_number || '-'}</TableCell>
                          <TableCell>{policy.product_name || '-'}</TableCell>
                          <TableCell>{policy.carrier || '-'}</TableCell>
                          <TableCell>
                            {policy.status && (
                              <Badge variant={policy.status === 'Active' || policy.status === 'In Force' ? 'default' : 'secondary'}>
                                {policy.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {policy.premium ? `$${policy.premium.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {policy.issue_date ? new Date(policy.issue_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{policy.writing_agent_smartoffice_id || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {policy.synced_at ? new Date(policy.synced_at).toLocaleString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {policiesPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {policiesPagination.page} of {policiesPagination.totalPages} ({policiesPagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={policiesPagination.page <= 1}
                      onClick={() => fetchPolicies(policiesPagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={policiesPagination.page >= policiesPagination.totalPages}
                      onClick={() => fetchPolicies(policiesPagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>
                Complete synchronization log. Showing {recentLogs.length} of {logsPagination.total} logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Agents Synced</TableHead>
                      <TableHead>Agents New</TableHead>
                      <TableHead>Agents Updated</TableHead>
                      <TableHead>Policies Synced</TableHead>
                      <TableHead>Policies New</TableHead>
                      <TableHead>Policies Updated</TableHead>
                      <TableHead>Commissions</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-muted-foreground">
                          No sync logs yet. Run a sync to see history.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">{log.sync_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.status === 'completed' && <Badge className="bg-green-500">Completed</Badge>}
                            {log.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                            {log.status === 'running' && <Badge variant="secondary">Running</Badge>}
                          </TableCell>
                          <TableCell className="text-sm">{log.triggered_by || 'Manual'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {new Date(log.started_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                          </TableCell>
                          <TableCell className="text-center">{log.agents_synced}</TableCell>
                          <TableCell className="text-center text-green-600">{log.agents_created}</TableCell>
                          <TableCell className="text-center text-blue-600">{log.agents_updated}</TableCell>
                          <TableCell className="text-center">{log.policies_synced}</TableCell>
                          <TableCell className="text-center text-green-600">{log.policies_created}</TableCell>
                          <TableCell className="text-center text-blue-600">{log.policies_updated}</TableCell>
                          <TableCell className="text-center">{log.commissions_synced}</TableCell>
                          <TableCell>
                            {log.error_count > 0 ? (
                              <div className="flex items-center gap-1">
                                <Badge variant="destructive">{log.error_count}</Badge>
                                {log.error_messages && log.error_messages.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1"
                                    onClick={() => setStatusMessage({ type: 'error', message: log.error_messages?.join('\n') || 'Unknown errors' })}
                                    title="View error details"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {logsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {logsPagination.page} of {logsPagination.totalPages} ({logsPagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logsPagination.page <= 1}
                      onClick={() => fetchLogs(logsPagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logsPagination.page >= logsPagination.totalPages}
                      onClick={() => fetchLogs(logsPagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Configure your SmartOffice API credentials. These will be tested before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sitename">Site Name</Label>
                  <Input
                    id="sitename"
                    value={config.sitename}
                    onChange={(e) => setConfig({ ...config, sitename: e.target.value })}
                    placeholder="e.g., PREPRODNEW"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    placeholder="e.g., PREPRODNEW_SDC_UAT_tdaniel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={config.api_key}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    placeholder={isConfigured ? '••••••••••••' : 'Enter API key'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    value={config.api_secret}
                    onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
                    placeholder={isConfigured ? '••••••••••••' : 'Enter API secret'}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="sync_frequency">Sync Frequency (hours)</Label>
                  <Select
                    value={String(config.sync_frequency_hours)}
                    onValueChange={(v) => setConfig({ ...config, sync_frequency_hours: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every hour</SelectItem>
                      <SelectItem value="6">Every 6 hours</SelectItem>
                      <SelectItem value="12">Every 12 hours</SelectItem>
                      <SelectItem value="24">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={config.is_active}
                    onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Enable automatic sync</Label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Test & Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {isConfigured && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Actions that affect synced data - use with caution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                  <div>
                    <h4 className="font-medium">Clear All Synced Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove all imported SmartOffice agents, policies, and sync logs. Configuration will be preserved.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowClearConfirm(true)} disabled={clearing}>
                    {clearing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      'Clear All Data'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Developer Tools Tab */}
        <TabsContent value="devtools" className="space-y-4">
          <SmartOfficeDeveloperTools />
        </TabsContent>
      </Tabs>

      {/* Agent Mapping Dialog */}
      <Dialog open={!!mappingAgent} onOpenChange={() => setMappingAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map SmartOffice Agent</DialogTitle>
            <DialogDescription>
              Select an Apex agent to map to {mappingAgent?.first_name} {mappingAgent?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">
                {mappingAgent?.first_name} {mappingAgent?.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{mappingAgent?.email}</div>
              <div className="text-xs text-muted-foreground mt-1">{mappingAgent?.smartoffice_id}</div>
            </div>
            <div className="space-y-2">
              <Label>Select Apex Agent</Label>
              <Select onValueChange={(v) => handleMapAgent(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Unmap agent</span>
                  </SelectItem>
                  {apexAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name} ({agent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingAgent(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agent Detail Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
            <DialogDescription>
              SmartOffice agent information for {selectedAgent?.first_name} {selectedAgent?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">SmartOffice ID</Label>
                  <div className="font-mono text-sm">{selectedAgent.smartoffice_id}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Contact ID</Label>
                  <div className="font-mono text-sm">{selectedAgent.contact_id || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <div className="font-medium">{selectedAgent.first_name} {selectedAgent.last_name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="text-sm">{selectedAgent.email || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="text-sm">{selectedAgent.phone || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tax ID</Label>
                  <div className="font-mono text-sm">{selectedAgent.tax_id || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Client Type</Label>
                  <div>{selectedAgent.client_type || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>
                    {selectedAgent.status ? (
                      <Badge variant={selectedAgent.status === 'Active' ? 'default' : 'secondary'}>
                        {selectedAgent.status}
                      </Badge>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hierarchy ID</Label>
                  <div className="font-mono text-sm">{selectedAgent.hierarchy_id || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Synced At</Label>
                  <div className="text-sm">{selectedAgent.synced_at ? new Date(selectedAgent.synced_at).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <div className="text-sm">{new Date(selectedAgent.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Updated At</Label>
                  <div className="text-sm">{new Date(selectedAgent.updated_at).toLocaleString()}</div>
                </div>
              </div>
              {selectedAgent.apex_agent && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Mapped to Apex Agent</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{selectedAgent.apex_agent.first_name} {selectedAgent.apex_agent.last_name}</span>
                    <Badge variant="outline">{selectedAgent.apex_agent.agent_code}</Badge>
                    <span className="text-sm text-muted-foreground">({selectedAgent.apex_agent.email})</span>
                  </div>
                </div>
              )}
              {selectedAgent.raw_data && (
                <div>
                  <Label className="text-xs text-muted-foreground">Raw Data from SmartOffice</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-60">
                    {JSON.stringify(selectedAgent.raw_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAgent(null)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedAgent) {
                setMappingAgent(selectedAgent);
                setSelectedAgent(null);
                fetchApexAgents();
              }
            }}>
              {selectedAgent?.apex_agent_id ? 'Change Mapping' : 'Map Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Detail Dialog */}
      <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
            <DialogDescription>
              SmartOffice policy information for {selectedPolicy?.policy_number || 'Unknown Policy'}
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">SmartOffice ID</Label>
                  <div className="font-mono text-sm">{selectedPolicy.smartoffice_id}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Policy Number</Label>
                  <div className="font-medium">{selectedPolicy.policy_number || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Product Name</Label>
                  <div>{selectedPolicy.product_name || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Carrier</Label>
                  <div>{selectedPolicy.carrier || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>
                    {selectedPolicy.status ? (
                      <Badge variant={selectedPolicy.status === 'Active' || selectedPolicy.status === 'In Force' ? 'default' : 'secondary'}>
                        {selectedPolicy.status}
                      </Badge>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Premium</Label>
                  <div className="font-mono">{selectedPolicy.premium ? `$${selectedPolicy.premium.toLocaleString()}` : '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Issue Date</Label>
                  <div className="text-sm">{selectedPolicy.issue_date ? new Date(selectedPolicy.issue_date).toLocaleDateString() : '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Effective Date</Label>
                  <div className="text-sm">{selectedPolicy.effective_date ? new Date(selectedPolicy.effective_date).toLocaleDateString() : '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Writing Agent (SmartOffice ID)</Label>
                  <div className="font-mono text-sm">{selectedPolicy.writing_agent_smartoffice_id || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Linked Agent ID</Label>
                  <div className="font-mono text-sm">{selectedPolicy.agent_id || '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Synced At</Label>
                  <div className="text-sm">{selectedPolicy.synced_at ? new Date(selectedPolicy.synced_at).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <div className="text-sm">{new Date(selectedPolicy.created_at).toLocaleString()}</div>
                </div>
              </div>
              {selectedPolicy.raw_data && (
                <div>
                  <Label className="text-xs text-muted-foreground">Raw Data from SmartOffice</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-60">
                    {JSON.stringify(selectedPolicy.raw_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPolicy(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Clear All SmartOffice Data?</DialogTitle>
            <DialogDescription className="pt-2">
              This will permanently delete:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>{stats?.totalAgents || 0}</strong> synced agents</li>
              <li><strong>{stats?.totalPolicies || 0}</strong> synced policies</li>
              <li>All sync history logs</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-destructive">
              This action cannot be undone. You will need to run a new sync to restore the data.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)} disabled={clearing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData} disabled={clearing}>
              {clearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Yes, Clear All Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
