import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import type { Agent, Wallet } from '@/lib/types/database';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent ID with explicit typing
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agentData as Pick<Agent, 'id'>;

    // Get wallet
    const { data: walletData, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('agent_id', agent.id)
      .single();

    if (error) {
      console.error('Wallet fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const wallet = walletData as Wallet;

    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
