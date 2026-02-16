# Database Migration: Add target_audience

## Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from `lib/db/migrations/0001_add_target_audience.sql`
5. Click "Run"
6. Verify success in the output panel

## Option 2: Run via command line

```bash
# If you have psql installed and DATABASE_URL set:
psql $DATABASE_URL -f lib/db/migrations/0001_add_target_audience.sql
```

## Option 3: Run via Node script (with env loaded)

```bash
# From project root:
node --env-file=.env.local -e "
const postgres = require('postgres');
const fs = require('fs');
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const migration = fs.readFileSync('lib/db/migrations/0001_add_target_audience.sql', 'utf-8');
sql.unsafe(migration).then(() => {
  console.log('✅ Migration complete');
  sql.end();
}).catch(err => {
  console.error('❌ Migration failed:', err);
  sql.end();
});
"
```

## Verify Migration

After running, verify with:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'distributors'
AND column_name = 'target_audience';
```

Should return:
- column_name: target_audience
- data_type: USER-DEFINED (enum)
- column_default: 'both'::target_audience
