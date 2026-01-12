'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentNode } from './agent-node';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/db/supabase-client';
import type { Agent, MatrixPosition } from '@/lib/types/database';

// Type for matrix position with joined agent data
interface MatrixPositionWithAgent extends MatrixPosition {
  agents: Pick<Agent, 'id' | 'first_name' | 'last_name' | 'rank' | 'status' | 'avatar_url' | 'email'> | null;
}

interface GenealogyNode {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
  status: string;
  avatarUrl?: string | null;
  email?: string | null;
  level: number;
  path: string;
  position: number;
}

interface GenealogyEdge {
  source: string;
  target: string;
}

interface GenealogyData {
  root: GenealogyNode | null;
  nodes: GenealogyNode[];
  edges: GenealogyEdge[];
  stats: {
    total: number;
    active: number;
    levelCounts: Record<number, number>;
  };
}

const nodeTypes = {
  agent: AgentNode,
};

export function GenealogyTree() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenealogyData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [depth, setDepth] = useState(7);

  const fetchGenealogy = useCallback(async (retryCount = 0) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current agent
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id, first_name, last_name, rank, status, avatar_url, email')
        .eq('user_id', user.id)
        .single();

      const agent = agentData as Pick<Agent, 'id' | 'first_name' | 'last_name' | 'rank' | 'status' | 'avatar_url' | 'email'> | null;
      if (agentError || !agent) {
        // Agent might still be getting created by the layout - retry a few times
        if (retryCount < 5) {
          setTimeout(() => fetchGenealogy(retryCount + 1), 500);
          return;
        }
        throw new Error('Agent not found. Please refresh the page.');
      }

      // Get the agent's matrix position
      const { data: myPositionData } = await supabase
        .from('matrix_positions')
        .select('*')
        .eq('agent_id', agent.id)
        .single();

      const myPosition = myPositionData as MatrixPosition | null;
      if (!myPosition) {
        // No matrix position yet - return just the agent
        const rootNode: GenealogyNode = {
          id: agent.id,
          firstName: agent.first_name,
          lastName: agent.last_name,
          rank: agent.rank,
          status: agent.status,
          avatarUrl: agent.avatar_url,
          email: agent.email,
          level: 0,
          path: '',
          position: 0,
        };

        setData({
          root: rootNode,
          nodes: [rootNode],
          edges: [],
          stats: { total: 0, active: 0, levelCounts: { 0: 1 } },
        });

        // Convert to ReactFlow nodes
        setNodes([{
          id: agent.id,
          type: 'agent',
          position: { x: 0, y: 0 },
          data: {
            firstName: agent.first_name,
            lastName: agent.last_name,
            rank: agent.rank,
            status: agent.status,
            avatarUrl: agent.avatar_url,
            email: agent.email,
            isRoot: true,
          },
        }]);
        setEdges([]);
        setLoading(false);
        return;
      }

      // Get all positions in the agent's downline (using path prefix)
      const { data: downlinePositions, error: positionsError } = await supabase
        .from('matrix_positions')
        .select('*, agents(id, first_name, last_name, rank, status, avatar_url, email)')
        .or(`path.eq.${myPosition.path},path.like.${myPosition.path}.%`)
        .order('level', { ascending: true });

      if (positionsError) {
        throw new Error('Failed to fetch genealogy');
      }

      // Filter by max depth
      const allPositions = (downlinePositions || []) as MatrixPositionWithAgent[];
      const filteredPositions = allPositions.filter((pos: MatrixPositionWithAgent) => {
        const depthFromRoot = pos.level - myPosition.level;
        return depthFromRoot <= depth;
      });

      // Build nodes
      const genealogyNodes: GenealogyNode[] = filteredPositions.map((pos: MatrixPositionWithAgent) => ({
        id: pos.agent_id,
        firstName: pos.agents?.first_name || 'Unknown',
        lastName: pos.agents?.last_name || '',
        rank: pos.agents?.rank || 'pre_associate',
        status: pos.agents?.status || 'pending',
        avatarUrl: pos.agents?.avatar_url,
        email: pos.agents?.email,
        level: pos.level - myPosition.level,
        path: pos.path,
        position: pos.position,
      }));

      // Build edges
      const genealogyEdges: GenealogyEdge[] = [];
      for (const pos of filteredPositions) {
        if (pos.parent_id) {
          const parentInSet = filteredPositions.find((p) => p.agent_id === pos.parent_id);
          if (parentInSet) {
            genealogyEdges.push({
              source: pos.parent_id,
              target: pos.agent_id,
            });
          }
        }
      }

      // Stats
      const totalInDownline = genealogyNodes.length - 1;
      const activeInDownline = genealogyNodes.filter((n) => n.status === 'active' && n.id !== agent.id).length;
      const levelCounts: Record<number, number> = {};
      genealogyNodes.forEach((n) => {
        levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
      });

      const rootNode = genealogyNodes.find((n) => n.id === agent.id) || null;

      setData({
        root: rootNode,
        nodes: genealogyNodes,
        edges: genealogyEdges,
        stats: {
          total: totalInDownline,
          active: activeInDownline,
          levelCounts,
        },
      });

      // Convert to ReactFlow nodes
      const flowNodes: Node[] = genealogyNodes.map((node) => {
        const siblings = genealogyNodes.filter((n) => n.level === node.level);
        const siblingIndex = siblings.findIndex((s) => s.id === node.id);
        const xSpacing = 280;
        const levelWidth = siblings.length * xSpacing;
        const xStart = -levelWidth / 2 + xSpacing / 2;
        const x = xStart + siblingIndex * xSpacing;

        return {
          id: node.id,
          type: 'agent',
          position: {
            x,
            y: node.level * 180,
          },
          data: {
            firstName: node.firstName,
            lastName: node.lastName,
            rank: node.rank,
            status: node.status,
            avatarUrl: node.avatarUrl,
            email: node.email,
            isRoot: node.level === 0,
          },
        };
      });

      // Convert to ReactFlow edges
      const flowEdges: Edge[] = genealogyEdges.map((edge) => ({
        id: `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: false,
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, depth, setNodes, setEdges]);

  useEffect(() => {
    fetchGenealogy();
  }, [fetchGenealogy]);

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading genealogy...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchGenealogy()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[700px] bg-muted/30 rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="hsl(var(--muted-foreground))" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.isRoot) return 'hsl(var(--primary))';
            if (node.data.status === 'active') return 'hsl(142.1 76.2% 36.3%)';
            return 'hsl(var(--muted-foreground))';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-background border"
        />
        <Panel position="top-left" className="flex items-center gap-2">
          {data?.stats && (
            <>
              <Badge variant="outline">
                {data.stats.total} in downline
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {data.stats.active} active
              </Badge>
            </>
          )}
        </Panel>
        <Panel position="top-right" className="flex items-center gap-2">
          <select
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value))}
            className="h-9 px-3 rounded-md border bg-background text-sm"
          >
            <option value="1">1 Generation</option>
            <option value="2">2 Generations</option>
            <option value="3">3 Generations</option>
            <option value="4">4 Generations</option>
            <option value="5">5 Generations</option>
            <option value="6">6 Generations</option>
            <option value="7">7 Generations (All)</option>
          </select>
        </Panel>
      </ReactFlow>
    </div>
  );
}
