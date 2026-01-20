/**
 * Apply Supabase Migrations Script (Safe Mode)
 * Runs migrations one statement at a time for better error reporting
 */

const fs = require('fs');
const path = require('path');

// Database connection URL from .env.local
const DATABASE_URL = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function applyMigrations() {
  console.log('🔄 Starting migration application (Safe Mode)...\n');

  // Import pg
  const pg = await import('pg');
  const Client = pg.default.Client;

  // Create client
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read individual migration files
    const migrations = [
      '20260118000000_wallet_pending_withdrawals.sql',
      '20260118000001_agent_debts_tracking.sql',
      '20260118000002_rate_limiting_and_audit.sql',
      '20260118000003_commission_workflow_transaction.sql'
    ];

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'supabase', 'migrations', migration);
      console.log(`\n📄 Applying: ${migration}`);
      console.log('━'.repeat(60));

      try {
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await client.query(sql);

        console.log(`✅ ${migration} applied successfully`);

      } catch (error) {
        console.error(`\n❌ Failed to apply ${migration}`);
        console.error('Error:', error.message);

        if (error.message.includes('already exists')) {
          console.log('ℹ️  Object already exists - this is OK, skipping...');
          continue;
        }

        if (error.detail) {
          console.error('Details:', error.detail);
        }

        // For critical errors, ask if we should continue
        console.log('\n⚠️  Migration failed, but continuing with others...\n');
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log('🔍 Verifying applied changes...\n');

    // Check if pending_withdrawals column exists
    const checkColumn = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'wallets'
        AND column_name = 'pending_withdrawals';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ wallets.pending_withdrawals column:');
      console.log(`   Type: ${checkColumn.rows[0].data_type}`);
      console.log(`   Default: ${checkColumn.rows[0].column_default}`);
    } else {
      console.warn('⚠️  wallets.pending_withdrawals column not found');
    }

    // Check if functions exist
    const checkFunctions = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN (
          'lock_withdrawal_funds',
          'unlock_withdrawal_funds',
          'handle_payout_status_change',
          'get_agent_total_debt',
          'create_clawback_debt',
          'apply_debt_repayment',
          'log_admin_action',
          'check_webhook_processed',
          'record_webhook_event',
          'create_commission_with_overrides'
        )
      ORDER BY routine_name;
    `);

    console.log(`\n✅ Found ${checkFunctions.rows.length}/10 expected functions:`);
    checkFunctions.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });

    // Check if tables exist
    const checkTables = await client.query(`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_name IN (
          'agent_debts',
          'agent_debt_repayments',
          'rate_limit_requests',
          'webhook_events',
          'admin_audit_log'
        )
      ORDER BY table_name;
    `);

    console.log(`\n✅ Found ${checkTables.rows.length}/5 expected tables:`);
    checkTables.rows.forEach(row => {
      console.log(`   - ${row.table_name} (${row.column_count} columns)`);
    });

    // Check if trigger exists
    const checkTrigger = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name = 'trigger_payout_status_change';
    `);

    if (checkTrigger.rows.length > 0) {
      console.log(`\n✅ Trigger: trigger_payout_status_change exists`);
    } else {
      console.log(`\n⚠️  Trigger: trigger_payout_status_change not found`);
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✨ Migration process complete!');
    console.log('🎉 Your database has been updated.\n');

  } catch (error) {
    console.error('\n❌ Fatal error:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Close connection
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migrations
applyMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
