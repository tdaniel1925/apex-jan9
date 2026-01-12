import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import type { Agent, MatrixPosition } from '@/lib/types/database';

// Zod schema for query params
const queryParamsSchema = z.object({
  depth: z.coerce.number().min(1).max(10).default(7),
});

// Type for matrix position with joined agent data
interface MatrixPositionWithAgent extends MatrixPosition {
  agents: Pick<Agent, 'id' | 'first_name' | 'last_name' | 'rank' | 'status' | 'avatar_url' | 'email'> | null;
}

// Type for genealogy node
interface GenealogyNode {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
  status: string;
  avatarUrl: string | null;
  email?: string | null;
  level: number;
  path: string;
  position: number;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current agent with explicit typing
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Parse and validate query params
    const { searchParams } = new URL(request.url);
    const parseResult = queryParamsSchema.safeParse({
      depth: searchParams.get('depth'),
    });

    const maxDepth = parseResult.success ? parseResult.data.depth : 7;

    // Get the agent's matrix position
    const { data: positionData } = await supabase
      .from('matrix_positions')
      .select('*')
      .eq('agent_id', agent.id)
      .single();

    if (!positionData) {
      // No matrix position yet - return just the agent
      const { data: agentInfoData } = await supabase
        .from('agents')
        .select('id, first_name, last_name, rank, status, avatar_url')
        .eq('id', agent.id)
        .single();

      const agentInfo = agentInfoData as Pick<Agent, 'id' | 'first_name' | 'last_name' | 'rank' | 'status' | 'avatar_url'> | null;

      return NextResponse.json({
        root: agentInfo,
        nodes: agentInfo ? [agentInfo] : [],
        edges: [],
      });
    }

    const myPosition = positionData as MatrixPosition;

    // Get all positions in the agent's downline (using path prefix)
    const { data: downlineData, error: positionsError } = await supabase
      .from('matrix_positions')
      .select('*, agents(id, first_name, last_name, rank, status, avatar_url, email)')
      .or(`path.eq.${myPosition.path},path.like.${myPosition.path}.%`)
      .order('level', { ascending: true });

    if (positionsError) {
      console.error('Genealogy fetch error:', positionsError);
      return NextResponse.json({ error: 'Failed to fetch genealogy' }, { status: 500 });
    }

    const downlinePositions = (downlineData || []) as MatrixPositionWithAgent[];

    // Filter by max depth
    const filteredPositions = downlinePositions.filter((pos) => {
      const depthFromRoot = pos.level - myPosition.level;
      return depthFromRoot <= maxDepth;
    });

    // Build nodes and edges for the tree
    const nodes: GenealogyNode[] = filteredPositions.map((pos) => ({
      id: pos.agent_id,
      firstName: pos.agents?.first_name || 'Unknown',
      lastName: pos.agents?.last_name || '',
      rank: pos.agents?.rank || 'pre_associate',
      status: pos.agents?.status || 'pending',
      avatarUrl: pos.agents?.avatar_url || null,
      email: pos.agents?.email,
      level: pos.level - myPosition.level, // Relative level from current agent
      path: pos.path,
      position: pos.position,
    }));

    // Build edges (parent-child relationships)
    const edges: { source: string; target: string }[] = [];

    for (const pos of filteredPositions) {
      if (pos.parent_id) {
        // Check if parent is in our filtered set
        const parentInSet = filteredPositions.find((p) => p.agent_id === pos.parent_id);
        if (parentInSet) {
          edges.push({
            source: pos.parent_id,
            target: pos.agent_id,
          });
        }
      }
    }

    // Find the root agent info
    const rootNode = nodes.find((n) => n.id === agent.id);

    // Also get stats
    const totalInDownline = nodes.length - 1; // Exclude self
    const activeInDownline = nodes.filter((n) => n.status === 'active' && n.id !== agent.id).length;
    const levelCounts: Record<number, number> = {};
    nodes.forEach((n) => {
      levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
    });

    return NextResponse.json({
      root: rootNode,
      nodes,
      edges,
      stats: {
        total: totalInDownline,
        active: activeInDownline,
        levelCounts,
      },
    });
  } catch (error) {
    console.error('Genealogy GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
