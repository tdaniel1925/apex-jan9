const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyEmailPreferencesMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000005_email_preferences.sql', 'utf8');

    console.log('📦 Applying email preferences migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify table
    console.log('\n📊 Verifying email_preferences table...');
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'email_preferences';
    `);

    if (tableResult.rows.length > 0) {
      console.log('✅ email_preferences table exists');

      // Show table structure
      const colsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'email_preferences'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Table Columns:');
      colsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });

      // Count existing preferences
      const countResult = await client.query('SELECT COUNT(*) FROM email_preferences');
      console.log(`\n✅ Initialized preferences for ${countResult.rows[0].count} agents`);
    }

    // Verify functions
    const funcResult = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN ('get_email_preferences', 'can_send_email', 'unsubscribe_all');
    `);

    console.log(`\n✅ Found ${funcResult.rows.length} helper functions:`);
    funcResult.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

    // Test can_send_email function
    console.log('\n🧪 Testing can_send_email function...');
    const testResult = await client.query(`
      SELECT can_send_email(
        '00000000-0000-0000-0000-000000000000'::UUID,
        'password_reset'
      );
    `);
    console.log(`✅ Function test result: ${testResult.rows[0].can_send_email} (should be true for transactional)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyEmailPreferencesMigration();
