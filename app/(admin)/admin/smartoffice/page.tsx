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
} from 'lucide-react';
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
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  apex_agent_id: string | null;
  apex_agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    agent_code: string;
  } | null;
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
  policies_synced: number;
  error_count: number;
}

export default function SmartOfficePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<SyncLog[]>([]);
  const [agents, setAgents] = useState<SmartOfficeAgent[]>([]);
  const [agentFilter, setAgentFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [mappingAgent, setMappingAgent] = useState<SmartOfficeAgent | null>(null);
  const [apexAgents, setApexAgents] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);

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

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/smartoffice/agents?filter=${agentFilter}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, [agentFilter]);

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
      fetchAgents();
    }
  }, [isConfigured, agentFilter, fetchAgents]);

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
        alert('SmartOffice configuration saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save configuration'}`);
      }
    } catch (error) {
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Run sync
  const handleSync = async (type: 'full' | 'agents' | 'policies' | 'automap') => {
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
        alert(`Sync completed! ${JSON.stringify(result.result, null, 2)}`);
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
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
      } else {
        alert('Failed to map agent');
      }
    } catch (error) {
      alert('Failed to map agent');
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

      <Tabs defaultValue={isConfigured ? 'overview' : 'config'}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
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
                  <CardDescription>Map SmartOffice agents to Apex agents</CardDescription>
                </div>
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
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SmartOffice Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mapped To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {isConfigured ? 'No agents found. Run a sync first.' : 'Configure SmartOffice first.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="font-medium">
                            {agent.first_name} {agent.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{agent.smartoffice_id}</div>
                        </TableCell>
                        <TableCell>{agent.email || '-'}</TableCell>
                        <TableCell>
                          {agent.apex_agent ? (
                            <div>
                              <span className="font-medium">
                                {agent.apex_agent.first_name} {agent.apex_agent.last_name}
                              </span>
                              <Badge variant="outline" className="ml-2">
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
                            onClick={() => {
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Complete synchronization log</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Policies</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.sync_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.status === 'completed' && <Badge className="bg-green-500">Completed</Badge>}
                        {log.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                        {log.status === 'running' && <Badge variant="secondary">Running</Badge>}
                      </TableCell>
                      <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                      </TableCell>
                      <TableCell>
                        {log.agents_synced} ({log.agents_created} new)
                      </TableCell>
                      <TableCell>{log.policies_synced}</TableCell>
                      <TableCell>
                        {log.error_count > 0 ? (
                          <Badge variant="destructive">{log.error_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Actions that affect synced data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Clear All Synced Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove all imported SmartOffice data. Agent mappings will be preserved.
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    Clear Data
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
    </div>
  );
}
