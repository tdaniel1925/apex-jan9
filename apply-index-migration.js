const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyIndexMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000000_performance_indexes.sql', 'utf8');

    console.log('📦 Applying performance indexes migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify indexes were created
    console.log('\n📊 Verifying indexes...');
    const result = await client.query(`
      SELECT schemaname, tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log(`\n✅ Found ${result.rows.length} indexes:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.tablename}.${row.indexname}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyIndexMigration();
