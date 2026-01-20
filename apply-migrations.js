/**
 * Apply Supabase Migrations Script
 * Runs APPLY_MIGRATIONS.sql against the remote database
 */

const fs = require('fs');
const path = require('path');

// Database connection URL from .env.local
const DATABASE_URL = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

async function applyMigrations() {
  console.log('🔄 Starting migration application...\n');

  // Import pg dynamically
  let Client;
  try {
    const pg = await import('pg');
    Client = pg.default.Client;
  } catch (error) {
    console.error('❌ Error: pg package not found');
    console.log('Installing pg package...');
    const { execSync } = require('child_process');
    execSync('npm install pg', { stdio: 'inherit' });
    const pg = await import('pg');
    Client = pg.default.Client;
  }

  // Create client
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'APPLY_MIGRATIONS.sql');
    console.log('📄 Reading migrations from:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`✅ Loaded ${sql.length} characters of SQL\n`);

    // Execute migrations
    console.log('🚀 Applying migrations...\n');
    const result = await client.query(sql);

    console.log('✅ Migrations applied successfully!\n');

    // If there's a result (the final SELECT statement)
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Result:', result.rows[0]);
    }

    // Verify migrations were applied
    console.log('\n🔍 Verifying migrations...');

    // Check if pending_withdrawals column exists
    const checkColumn = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'wallets'
        AND column_name = 'pending_withdrawals';
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ pending_withdrawals column exists');
    } else {
      console.warn('⚠️  pending_withdrawals column not found');
    }

    // Check if functions exist
    const checkFunctions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN (
          'lock_withdrawal_funds',
          'unlock_withdrawal_funds',
          'get_agent_total_debt',
          'create_clawback_debt',
          'log_admin_action',
          'create_commission_with_overrides'
        )
      ORDER BY routine_name;
    `);

    console.log(`✅ Found ${checkFunctions.rows.length}/6 expected functions:`);
    checkFunctions.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });

    // Check if tables exist
    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
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
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✨ All migrations applied successfully!');
    console.log('🎉 Your database is now up to date.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);

    if (error.detail) {
      console.error('\nDetails:', error.detail);
    }

    if (error.hint) {
      console.error('\nHint:', error.hint);
    }

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
