# Database Connection Pooling Configuration
**Phase 2 - Issue #37: Optimize database connection management**
**Last Updated:** 2026-01-19

---

## 📋 OVERVIEW

Supabase uses PostgreSQL with PgBouncer for connection pooling. This document explains the configuration and best practices.

---

## 🔧 CURRENT CONFIGURATION

### Supabase Connection Modes

**1. Session Mode (Port 5432)**
- Connection string: `postgresql://...@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
- Use for: Migrations, admin tasks, long-running queries
- Max connections: Based on plan (Free: 60, Pro: 200+)
- Connection lifetime: Long-lived

**2. Transaction Mode (Port 6543)** ⭐ RECOMMENDED
- Connection string: `postgresql://...@aws-0-us-west-2.pooler.supabase.com:6543/postgres`
- Use for: API requests, short queries
- Max connections: Higher limit (3000+)
- Connection lifetime: Per-transaction
- More efficient for serverless

### Current Setup

Our application uses **Transaction Mode (Port 6543)** via Supabase client:

```typescript
// lib/db/supabase-server.ts
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

This automatically uses PgBouncer's transaction mode pooling.

---

## ⚙️ RECOMMENDED SETTINGS

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://postgres.ooltgvfrdodamtezqlno:PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres

# Connection pool settings (optional, PgBouncer handles this)
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000
```

### Supabase Client Configuration

```typescript
// lib/db/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export const createServerSupabaseClient = async () => {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'apex-app',
        },
      },
    }
  );
};
```

---

## 📊 CONNECTION POOL MONITORING

### Check Active Connections

```sql
-- See current connections
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'postgres';

-- Count connections by state
SELECT
  state,
  COUNT(*) as count
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;
```

### Monitor Pool Usage

```sql
-- PgBouncer stats (via Supabase Dashboard)
-- Settings → Database → Connection Pooling → Statistics
```

---

## 🚀 BEST PRACTICES

### 1. Use Connection Pooling for All Queries

✅ **Good:**
```typescript
// Each API route gets a fresh client from the pool
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('agents')
    .select('*');

  return NextResponse.json({ data });
}
```

❌ **Bad:**
```typescript
// Don't create persistent connections
const supabase = createClient(...); // Global connection

export async function GET() {
  // Reusing global connection
  const { data } = await supabase.from('agents').select('*');
  return NextResponse.json({ data });
}
```

### 2. Close Connections Properly

Supabase client handles connection closure automatically when using serverless functions.

### 3. Use Prepared Statements

```typescript
// Supabase automatically uses prepared statements
const { data } = await supabase
  .from('agents')
  .select('*')
  .eq('id', agentId); // Parameterized query
```

### 4. Avoid Long-Running Transactions

```typescript
// ✅ Good: Short transaction
const { data, error } = await supabase.rpc('transfer_funds', {
  from_agent: agentA,
  to_agent: agentB,
  amount: 100
});

// ❌ Bad: Long-running transaction
// Don't hold connections open while waiting for external APIs
const paymentResult = await stripe.charges.create(...); // 5s delay
await supabase.from('payments').insert({ ... });
```

### 5. Batch Operations

```typescript
// ✅ Good: Batch insert
const { data } = await supabase
  .from('commissions')
  .insert(commissions); // Array of 100 items

// ❌ Bad: Loop inserts
for (const commission of commissions) {
  await supabase.from('commissions').insert(commission); // 100 queries!
}
```

---

## 🔍 TROUBLESHOOTING

### Error: "Too many connections"

**Symptoms:**
- API requests fail with "sorry, too many clients already"
- Intermittent 500 errors

**Solutions:**
1. Switch to transaction mode (port 6543) ✅ Already done
2. Increase connection pool size (upgrade Supabase plan)
3. Audit for connection leaks
4. Implement request queuing

### Error: "Connection timeout"

**Symptoms:**
- Slow queries
- Timeout errors

**Solutions:**
1. Check database performance
2. Add indexes for slow queries
3. Optimize query complexity
4. Increase timeout setting

### Connection Leaks

**Detection:**
```sql
-- Find idle connections older than 5 minutes
SELECT
  pid,
  usename,
  application_name,
  state,
  NOW() - state_change AS idle_time
FROM pg_stat_activity
WHERE state = 'idle'
  AND NOW() - state_change > INTERVAL '5 minutes';
```

**Fix:**
- Ensure all connections are properly closed
- Use connection timeout settings
- Review long-running background jobs

---

## 📈 SCALING GUIDELINES

### Current Limits (Supabase Pro)

| Metric | Limit | Current Usage |
|--------|-------|---------------|
| Max connections | 200 (session) | Monitor |
| Pooled connections | 3000 (transaction) | Monitor |
| Connection timeout | 60s | Default |
| Statement timeout | 15s | Default |

### When to Upgrade

Scale up if:
- Connection pool exhaustion errors
- Consistent >80% pool utilization
- User growth exceeds 10,000 active agents

### Optimization Before Scaling

Before upgrading plan:
1. Implement caching (✅ Done - Issue #25)
2. Add database indexes (✅ Done - Issue #14)
3. Optimize queries (see PERFORMANCE-OPTIMIZATION-GUIDE.md)
4. Use read replicas for analytics

---

## 🔐 SECURITY

### Connection String Security

```bash
# ✅ Good: Use environment variables
DATABASE_URL=postgresql://...

# ❌ Bad: Hardcoded in code
const client = new Pool({
  connectionString: 'postgresql://user:pass@host:5432/db'
});
```

### SSL Configuration

Supabase enforces SSL by default:
- All connections use TLS 1.2+
- Certificate validation enabled
- Connection string includes `sslmode=require`

---

## 📚 REFERENCES

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
- [PostgreSQL Connection Management](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Serverless Database Best Practices](https://www.prisma.io/dataguide/database-tools/connection-pooling)

---

**Version:** 1.0
**Last Updated:** 2026-01-19
**Owner:** Database Team
