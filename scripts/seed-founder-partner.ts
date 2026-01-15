/**
 * Seed Script: Create Founder Partner
 *
 * This script creates a founder partner with:
 * - Auth user with password
 * - Agent record
 * - Wallet and matrix position
 * - Founder partner slot assignment
 *
 * Usage: npx tsx scripts/seed-founder-partner.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - Update these values as needed
const FOUNDER_CONFIG = {
  email: 'tdaniel@botmakers.ai',
  password: '4Xkilla1@',
  firstName: 'Trent',
  middleInitial: 'T',
  lastName: 'Daniel',
  phone: '281-505-8290',
  slotNumber: 1, // Founder partner slot (1-4)
};

async function main() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nMake sure .env.local is loaded. You can run with:');
    console.error('npx dotenv -e .env.local -- npx tsx scripts/seed-founder-partner.ts');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🚀 Starting founder partner seed...\n');

  try {
    // Step 1: Check if agent already exists
    console.log('1. Checking if agent exists...');
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('id, user_id, agent_code')
      .eq('email', FOUNDER_CONFIG.email.toLowerCase())
      .single();

    let agentId: string;
    let userId: string;

    if (existingAgent) {
      console.log(`   ✅ Agent already exists: ${existingAgent.agent_code}`);
      agentId = existingAgent.id;
      userId = existingAgent.user_id;

      // Update password if user exists
      if (userId) {
        console.log('   Updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: FOUNDER_CONFIG.password,
        });
        if (updateError) {
          console.log(`   ⚠️ Could not update password: ${updateError.message}`);
        } else {
          console.log('   ✅ Password updated');
        }
      }
    } else {
      // Step 2: Create auth user
      console.log('2. Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: FOUNDER_CONFIG.email.toLowerCase(),
        password: FOUNDER_CONFIG.password,
        email_confirm: true, // Auto-confirm for founder
        user_metadata: {
          first_name: FOUNDER_CONFIG.firstName,
          last_name: FOUNDER_CONFIG.lastName,
        },
      });

      if (authError || !authData.user) {
        console.error('   ❌ Failed to create auth user:', authError?.message);
        process.exit(1);
      }

      userId = authData.user.id;
      console.log(`   ✅ Auth user created: ${userId}`);

      // Step 3: Generate agent code
      console.log('3. Generating agent code...');
      const agentCode = `APX${Math.floor(100000 + Math.random() * 900000)}`;

      // Generate username
      const username = FOUNDER_CONFIG.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Step 4: Create agent record
      console.log('4. Creating agent record...');
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: userId,
          email: FOUNDER_CONFIG.email.toLowerCase(),
          first_name: FOUNDER_CONFIG.firstName,
          last_name: FOUNDER_CONFIG.lastName,
          phone: FOUNDER_CONFIG.phone,
          username,
          agent_code: agentCode,
          rank: 'founder', // Founders get founder rank
          status: 'active',
          bio: 'Founding Partner - Apex Affinity Group',
          replicated_site_enabled: true,
        })
        .select()
        .single();

      if (agentError || !agent) {
        console.error('   ❌ Failed to create agent:', agentError?.message);
        // Clean up auth user
        await supabase.auth.admin.deleteUser(userId);
        process.exit(1);
      }

      agentId = agent.id;
      console.log(`   ✅ Agent created: ${agentCode}`);

      // Step 5: Create wallet
      console.log('5. Creating wallet...');
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          agent_id: agentId,
          balance: 0,
          pending_balance: 0,
          lifetime_earnings: 0,
        });

      if (walletError) {
        console.log(`   ⚠️ Wallet may already exist: ${walletError.message}`);
      } else {
        console.log('   ✅ Wallet created');
      }

      // Step 6: Get FC Inc. position for matrix placement
      console.log('6. Setting up matrix position...');
      const { data: fcPosition } = await supabase
        .from('matrix_positions')
        .select('id')
        .eq('path', '0')
        .single();

      if (fcPosition) {
        // Find next available position under FC Inc.
        const { data: existingPositions } = await supabase
          .from('matrix_positions')
          .select('position')
          .eq('level', 1);

        const usedPositions = new Set((existingPositions || []).map((p: { position: number }) => p.position));
        let nextPosition = 1;
        while (usedPositions.has(nextPosition) && nextPosition <= 5) {
          nextPosition++;
        }

        if (nextPosition <= 5) {
          const { error: posError } = await supabase
            .from('matrix_positions')
            .insert({
              agent_id: agentId,
              parent_id: fcPosition.id,
              position: nextPosition,
              level: 1,
              path: `0.${nextPosition}`,
            });

          if (posError) {
            console.log(`   ⚠️ Matrix position error: ${posError.message}`);
          } else {
            console.log(`   ✅ Matrix position created: 0.${nextPosition}`);
          }
        } else {
          console.log('   ⚠️ All Level 1 positions are full');
        }
      }
    }

    // Step 7: Update founder partner slot
    console.log('7. Assigning to founder partner slot...');

    // First check if this agent is already in a slot
    const { data: existingSlot } = await supabase
      .from('founder_partners')
      .select('slot_number')
      .eq('agent_id', agentId)
      .single();

    if (existingSlot) {
      console.log(`   ✅ Already assigned to slot #${existingSlot.slot_number}`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: slotError } = await (supabase as any)
        .from('founder_partners')
        .update({
          name: `${FOUNDER_CONFIG.firstName} ${FOUNDER_CONFIG.middleInitial}. ${FOUNDER_CONFIG.lastName}`,
          email: FOUNDER_CONFIG.email.toLowerCase(),
          agent_id: agentId,
          user_id: userId,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('slot_number', FOUNDER_CONFIG.slotNumber);

      if (slotError) {
        console.error(`   ❌ Failed to update slot: ${slotError.message}`);
      } else {
        console.log(`   ✅ Assigned to founder partner slot #${FOUNDER_CONFIG.slotNumber}`);
      }
    }

    console.log('\n✨ Founder partner setup complete!\n');
    console.log('Summary:');
    console.log(`  Email: ${FOUNDER_CONFIG.email}`);
    console.log(`  Password: ${FOUNDER_CONFIG.password}`);
    console.log(`  Name: ${FOUNDER_CONFIG.firstName} ${FOUNDER_CONFIG.middleInitial}. ${FOUNDER_CONFIG.lastName}`);
    console.log(`  Phone: ${FOUNDER_CONFIG.phone}`);
    console.log(`  Founder Slot: #${FOUNDER_CONFIG.slotNumber} (25% share)`);
    console.log('\n  The user can now log in at /login\n');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
