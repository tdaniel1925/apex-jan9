const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyAuditMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000004_admin_audit_logging.sql', 'utf8');

    console.log('📦 Applying admin audit logging migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify table
    console.log('\n📊 Verifying admin_audit_log table...');
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'admin_audit_log';
    `);

    if (tableResult.rows.length > 0) {
      console.log('✅ admin_audit_log table exists');

      // Show table structure
      const colsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'admin_audit_log'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Table Columns:');
      colsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Verify functions
    const funcResult = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN ('log_admin_action', 'get_admin_recent_actions', 'get_resource_audit_trail');
    `);

    console.log(`\n✅ Found ${funcResult.rows.length} helper functions:`);
    funcResult.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

    // Verify indexes
    const idxResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'admin_audit_log'
      ORDER BY indexname;
    `);

    console.log(`\n✅ Found ${idxResult.rows.length} indexes:`);
    idxResult.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    // Verify views
    const viewResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
      AND viewname IN ('admin_audit_summary', 'admin_critical_actions');
    `);

    console.log(`\n✅ Found ${viewResult.rows.length} views:`);
    viewResult.rows.forEach(row => {
      console.log(`   - ${row.viewname}`);
    });

    // Test the log function
    console.log('\n🧪 Testing log_admin_action function...');
    const testResult = await client.query(`
      SELECT log_admin_action(
        '00000000-0000-0000-0000-000000000000'::UUID,
        'test@example.com',
        'test_action',
        'test_resource',
        'test_id',
        '{"test": true}'::JSONB,
        '127.0.0.1',
        'test-agent'
      );
    `);

    if (testResult.rows.length > 0) {
      console.log('✅ log_admin_action function works!');
      const logId = testResult.rows[0].log_admin_action;

      // Clean up test data
      await client.query('DELETE FROM admin_audit_log WHERE id = $1', [logId]);
      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyAuditMigration();
