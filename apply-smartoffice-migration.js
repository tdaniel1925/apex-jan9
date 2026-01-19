const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applySmartOfficeMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000002_smartoffice_duplicate_protection.sql', 'utf8');

    console.log('📦 Applying SmartOffice duplicate protection migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify columns were added
    console.log('\n📊 Verifying sync_run_id columns...');
    const colResult = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND column_name = 'sync_run_id'
      AND table_name LIKE 'smartoffice%'
      ORDER BY table_name;
    `);

    console.log(`\n✅ Found ${colResult.rows.length} sync_run_id columns:`);
    colResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}.${row.column_name}`);
    });

    // Verify unique indexes
    const idxResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE '%smartoffice%unique%'
      ORDER BY indexname;
    `);

    console.log(`\n✅ Found ${idxResult.rows.length} unique indexes:`);
    idxResult.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    // Verify helper functions
    const funcResult = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN ('is_smartoffice_commission_imported', 'get_unmapped_smartoffice_commissions');
    `);

    console.log(`\n✅ Found ${funcResult.rows.length} helper functions:`);
    funcResult.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySmartOfficeMigration();
