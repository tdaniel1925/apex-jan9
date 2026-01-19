const pg = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applyCopilotMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const sql = fs.readFileSync('supabase/migrations/20260119000003_copilot_usage_limits.sql', 'utf8');

    console.log('📦 Applying Copilot usage limits migration...');

    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify copilot_tier_limits table
    console.log('\n📊 Verifying copilot_tier_limits table...');
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'copilot_tier_limits';
    `);

    if (tableResult.rows.length > 0) {
      console.log('✅ copilot_tier_limits table exists');

      // Show tier configurations
      const tiersResult = await client.query(`
        SELECT tier, monthly_message_limit, name, description
        FROM copilot_tier_limits
        ORDER BY
          CASE tier
            WHEN 'basic' THEN 1
            WHEN 'pro' THEN 2
            WHEN 'agency' THEN 3
          END;
      `);

      console.log('\n📋 Tier Configurations:');
      tiersResult.rows.forEach(row => {
        const limit = row.monthly_message_limit === null ? 'Unlimited' : row.monthly_message_limit;
        console.log(`   - ${row.name} (${row.tier}): ${limit} messages/month`);
        console.log(`     ${row.description}`);
      });
    }

    // Verify helper functions
    const funcResult = await client.query(`
      SELECT proname
      FROM pg_proc
      WHERE proname IN ('get_copilot_monthly_usage', 'check_copilot_usage_limit', 'increment_copilot_usage');
    `);

    console.log(`\n✅ Found ${funcResult.rows.length} helper functions:`);
    funcResult.rows.forEach(row => {
      console.log(`   - ${row.proname}()`);
    });

    // Verify index
    const idxResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname = 'idx_copilot_usage_month';
    `);

    if (idxResult.rows.length > 0) {
      console.log('\n✅ Performance index created: idx_copilot_usage_month');
    }

    // Verify view
    const viewResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
      AND viewname = 'copilot_usage_current_month';
    `);

    if (viewResult.rows.length > 0) {
      console.log('✅ View created: copilot_usage_current_month');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyCopilotMigration();
