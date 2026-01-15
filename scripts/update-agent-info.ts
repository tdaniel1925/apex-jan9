import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAgent() {
  console.log('Updating agent info for tdaniel@botmakers.ai...\n');

  const { data, error } = await supabase
    .from('agents')
    .update({
      first_name: 'Trent',
      last_name: 'Daniel',
      phone: '281-505-8290',
    })
    .eq('email', 'tdaniel@botmakers.ai')
    .select()
    .single();

  if (error) {
    console.error('Error updating agent:', error.message);
  } else {
    console.log('✅ Agent updated successfully!');
    console.log(`  Name: ${data.first_name} ${data.last_name}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Phone: ${data.phone}`);
    console.log(`  Agent Code: ${data.agent_code}`);
    console.log(`  Rank: ${data.rank}`);
  }
}

updateAgent();
