const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyEmailRetryMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000001_email_retry_logic.sql', 'utf8');

    console.log('📦 Applying email retry logic migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify columns were added
    console.log('\n📊 Verifying new columns...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'lead_email_queue'
      AND column_name IN ('retry_count', 'max_retries', 'next_retry_at', 'permanent_failure', 'updated_at')
      ORDER BY column_name;
    `);

    console.log(`\n✅ Found ${result.rows.length} new columns:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Check if function was created
    const funcResult = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'calculate_email_retry_time';
    `);

    if (funcResult.rows.length > 0) {
      console.log('\n✅ Function created: calculate_email_retry_time()');
    } else {
      console.log('\n⚠️  Warning: Function calculate_email_retry_time() not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyEmailRetryMigration();
