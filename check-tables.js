const pg = require('pg');
const client = new pg.Client({
  connectionString: 'postgresql://postgres.ooltgvfrdodamtezqlno:ttandSellaBella1234@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  await client.connect();

  // Check admin_audit_log
  const result1 = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'admin_audit_log'
    ORDER BY ordinal_position;
  `);

  console.log('\nadmin_audit_log columns:');
  result1.rows.forEach(row => {
    console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
  });

  // Check rate_limit_requests
  const result2 = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'rate_limit_requests';
  `);

  console.log('\nrate_limit_requests exists:', result2.rows.length > 0);

  // Check webhook_events
  const result3 = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_events';
  `);

  console.log('webhook_events exists:', result3.rows.length > 0);

  await client.end();
}

checkTables().catch(console.error);
