import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  // Get founder partners
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: partners } = await (supabase as any)
    .from('founder_partners')
    .select('slot_number, name, email, is_active, share_percentage')
    .order('slot_number');

  console.log('\n📋 Founder Partner Slots:');
  console.log('─'.repeat(60));
  for (const p of partners || []) {
    const status = p.is_active ? '✅ Active' : '⬜ Empty';
    console.log(`  Slot #${p.slot_number}: ${p.name || '(empty)'} - ${p.email || 'N/A'} - ${p.share_percentage}% - ${status}`);
  }

  // Get the agent info
  const { data: agent } = await supabase
    .from('agents')
    .select('first_name, last_name, email, agent_code, rank, status, phone')
    .eq('email', 'tdaniel@botmakers.ai')
    .single();

  if (agent) {
    console.log('\n👤 Agent Info:');
    console.log('─'.repeat(60));
    console.log(`  Name: ${agent.first_name} ${agent.last_name}`);
    console.log(`  Email: ${agent.email}`);
    console.log(`  Phone: ${agent.phone || 'N/A'}`);
    console.log(`  Agent Code: ${agent.agent_code}`);
    console.log(`  Rank: ${agent.rank}`);
    console.log(`  Status: ${agent.status}`);
  }
  console.log('');
}

verify();
