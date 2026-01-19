const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyCertificateLimitsMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000006_certificate_generation_limits.sql', 'utf8');

    console.log('📦 Applying certificate generation limits migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify table
    console.log('\n📊 Verifying certificate_generation_log table...');
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'certificate_generation_log';
    `);

    if (tableResult.rows.length > 0) {
      console.log('✅ certificate_generation_log table exists');

      // Show table structure
      const colsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'certificate_generation_log'
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
      WHERE proname IN ('check_certificate_generation_limit', 'log_certificate_generation', 'verify_certificate');
    `);

    console.log(`\n✅ Found ${funcResult.rows.length} helper functions:`);
    funcResult.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

    // Check if verification_code column was added to certificates
    const verificationColResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'certificates'
      AND column_name = 'verification_code';
    `);

    if (verificationColResult.rows.length > 0) {
      console.log('\n✅ verification_code column added to certificates');

      // Count certificates with codes
      const certResult = await client.query(`
        SELECT COUNT(*) as total,
               COUNT(verification_code) as with_codes
        FROM certificates;
      `);

      if (certResult.rows.length > 0) {
        console.log(`   - Total certificates: ${certResult.rows[0].total}`);
        console.log(`   - With verification codes: ${certResult.rows[0].with_codes}`);
      }
    }

    // Verify view
    const viewResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
      AND viewname = 'certificate_generation_stats';
    `);

    if (viewResult.rows.length > 0) {
      console.log('\n✅ certificate_generation_stats view created');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyCertificateLimitsMigration();
