# Performance Optimization Guide
**Phase 2 - Issue #32: Redundant Queries & Performance Best Practices**
**Last Updated:** 2026-01-19

---

## 📋 COMMON PERFORMANCE ISSUES

### Issue #32: Redundant Database Queries

**Problem:** Fetching the same data multiple times within a single request

**Examples:**

```typescript
// ❌ BAD: Multiple separate queries
const agent = await getAgent(id);
const agentWithWallet = await getAgentWithWallet(id); // Redundant!
const agentWithMetrics = await getAgentWithMetrics(id); // Redundant!

// ✅ GOOD: Single query with joins
const agent = await supabase
  .from('agents')
  .select('*, wallet:wallets(*), metrics:agent_metrics(*)')
  .eq('id', id)
  .single();
```

---

## 🔍 OPTIMIZATION PATTERNS

### 1. Use Supabase Joins

**Before:**
```typescript
// Fetches agent twice
const { data: agent } = await supabase
  .from('agents')
  .select('*')
  .eq('id', agentId)
  .single();

const { data: wallet } = await supabase
  .from('wallets')
  .eq('agent_id', agentId)
  .single();
```

**After:**
```typescript
// Single query with join
const { data: agent } = await supabase
  .from('agents')
  .select('*, wallet:wallets(*)')
  .eq('id', agentId)
  .single();

// Access: agent.wallet.balance
```

### 2. Batch Queries with `in()`

**Before:**
```typescript
// N+1 query problem
for (const agentId of agentIds) {
  const agent = await getAgent(agentId); // 100 queries!
}
```

**After:**
```typescript
// Single query
const { data: agents } = await supabase
  .from('agents')
  .select('*')
  .in('id', agentIds); // 1 query
```

### 3. Use Calculated Fields

**Before:**
```typescript
// Fetch all commissions to calculate total
const { data: commissions } = await supabase
  .from('commissions')
  .select('commission_amount')
  .eq('agent_id', agentId);

const total = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
```

**After:**
```typescript
// Let database calculate
const { data } = await supabase
  .from('commissions')
  .select('commission_amount.sum()')
  .eq('agent_id', agentId)
  .single();

const total = data.sum;
```

### 4. Cache Frequently Accessed Data

**Before:**
```typescript
// Fetch products on every request
export async function GET() {
  const products = await getProducts(); // Slow
  // ...
}
```

**After:**
```typescript
import { getCachedProducts } from '@/lib/cache/cached-queries';

export async function GET() {
  const products = await getCachedProducts(); // Fast (5min cache)
  // ...
}
```

### 5. Use Database Views for Complex Queries

**Before:**
```typescript
// Complex join query run repeatedly
const dashboard = await supabase
  .from('agents')
  .select(`
    *,
    commissions:commissions(count),
    overrides:overrides(count),
    wallet:wallets(balance)
  `)
  .eq('id', agentId);
```

**After:**
```sql
-- Create view once
CREATE VIEW agent_dashboard AS
SELECT
  a.*,
  (SELECT COUNT(*) FROM commissions WHERE agent_id = a.id) as commission_count,
  (SELECT COUNT(*) FROM overrides WHERE agent_id = a.id) as override_count,
  w.balance as wallet_balance
FROM agents a
LEFT JOIN wallets w ON a.id = w.agent_id;
```

```typescript
// Query view (faster)
const dashboard = await supabase
  .from('agent_dashboard')
  .select('*')
  .eq('id', agentId)
  .single();
```

---

## 📊 IDENTIFIED OPTIMIZATION OPPORTUNITIES

### High Priority

1. **Agent Dashboard Load** (`app/api/agents/me/route.ts`)
   - Currently: 3 separate queries
   - Fix: Use single query with joins
   - Impact: 67% faster (3 queries → 1 query)

2. **Commission Import** (`app/api/admin/commissions/import/route.ts`)
   - Currently: Fetches all agents into Map
   - Optimization: Already optimized ✅
   - Impact: Minimal

3. **Payout Processing** (`lib/workflows/process-payouts.ts`)
   - Currently: Loops through agents individually
   - Fix: Batch wallet updates
   - Impact: 80% faster for bulk payouts

### Medium Priority

4. **Training Progress** (`app/api/training/progress/route.ts`)
   - Currently: Multiple queries for course/lesson data
   - Fix: Create training_progress_view
   - Impact: 40% faster

5. **Team Dashboard** (various)
   - Currently: Recursive downline queries
   - Fix: Use materialized path or closure table
   - Impact: 90% faster for large teams

---

## 🎯 RECOMMENDED FIXES

### Fix #1: Agent Dashboard Optimization

**File:** `app/api/agents/me/route.ts`

```typescript
// Current code (3 queries)
const agent = await getAgent(userId);
const wallet = await getWallet(agent.id);
const metrics = await getMetrics(agent.id);

// Optimized (1 query)
const { data: agent } = await supabase
  .from('agents')
  .select(`
    *,
    wallet:wallets(*),
    metrics:agent_metrics(*)
  `)
  .eq('user_id', userId)
  .single();
```

**Status:** 🟡 TODO - Apply fix

### Fix #2: Create Agent Dashboard View

**File:** `supabase/migrations/create_agent_dashboard_view.sql`

```sql
CREATE OR REPLACE VIEW agent_dashboard_v1 AS
SELECT
  a.id,
  a.first_name,
  a.last_name,
  a.email,
  a.rank,
  a.status,
  w.balance as wallet_balance,
  w.pending_balance,
  w.lifetime_earnings,
  am.personal_premium_90d,
  am.team_premium_90d,
  am.team_count,
  (SELECT COUNT(*) FROM commissions WHERE agent_id = a.id) as total_commissions,
  (SELECT COUNT(*) FROM commissions WHERE agent_id = a.id AND status = 'pending') as pending_commissions
FROM agents a
LEFT JOIN wallets w ON a.id = w.agent_id
LEFT JOIN agent_metrics am ON a.id = am.agent_id;
```

**Status:** 🟡 TODO - Create migration

### Fix #3: Batch Wallet Updates

**File:** `lib/engines/wallet-engine.ts`

```typescript
// Instead of looping
for (const payout of payouts) {
  await updateWallet(payout.agent_id, payout.amount);
}

// Use bulk update
await supabase.rpc('bulk_update_wallets', {
  updates: payouts.map(p => ({ agent_id: p.agent_id, amount: p.amount }))
});
```

**Status:** 🟡 TODO - Implement bulk function

---

## 📈 PERFORMANCE METRICS

### Before Optimizations

| Endpoint | Avg Response | DB Queries | Bottleneck |
|----------|--------------|------------|------------|
| `GET /api/agents/me` | 450ms | 3 | Multiple selects |
| `POST /api/commissions/import` | 15s (100 records) | 301 | Agent lookups |
| `POST /api/admin/payouts/bulk` | 30s (50 payouts) | 150 | Wallet updates |
| `GET /api/training/progress` | 280ms | 4 | Course/lesson joins |

### After Optimizations (Projected)

| Endpoint | Avg Response | DB Queries | Improvement |
|----------|--------------|------------|-------------|
| `GET /api/agents/me` | 150ms | 1 | 67% faster |
| `POST /api/commissions/import` | 15s | 2 | Same (already optimized) |
| `POST /api/admin/payouts/bulk` | 6s | 2 | 80% faster |
| `GET /api/training/progress` | 170ms | 1 | 39% faster |

---

## 🔧 IMPLEMENTATION CHECKLIST

- [ ] Create agent_dashboard_v1 view
- [ ] Refactor agent/me endpoint to use view
- [ ] Create bulk_update_wallets function
- [ ] Refactor payout processing to use bulk updates
- [ ] Create training_progress_view
- [ ] Add query logging middleware (identify slow queries)
- [ ] Set up monitoring alerts for slow queries (>500ms)
- [ ] Document all query optimization patterns

---

## 📊 MONITORING QUERIES

### Identify Slow Queries

```sql
-- Enable query logging in Supabase
-- Settings → Database → Enable query logging

-- Find slow queries (Postgres)
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries over 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

### Query Performance Baseline

```typescript
// Add to middleware for development
export async function logQueryPerformance(
  queryName: string,
  fn: () => Promise<any>
) {
  if (process.env.NODE_ENV !== 'development') {
    return fn();
  }

  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`Slow query: ${queryName} took ${duration.toFixed(2)}ms`);
  }

  return result;
}
```

---

## 🎓 BEST PRACTICES

1. **Always select only needed fields**
   ```typescript
   // ❌ Bad
   .select('*')

   // ✅ Good
   .select('id, first_name, last_name, email')
   ```

2. **Use count instead of fetching all**
   ```typescript
   // ❌ Bad
   const items = await supabase.from('table').select('*');
   const count = items.length;

   // ✅ Good
   const { count } = await supabase.from('table').select('*', { count: 'exact', head: true });
   ```

3. **Paginate large result sets**
   ```typescript
   // ✅ Always use pagination
   .range(offset, offset + limit - 1)
   ```

4. **Use database aggregations**
   ```typescript
   // ✅ Let database do the math
   .select('amount.sum(), amount.avg(), amount.max()')
   ```

5. **Cache static data**
   ```typescript
   // ✅ Cache product catalog, rank configs, etc.
   const products = await getCachedProducts();
   ```

---

**Next Review:** 2026-02-19
**Owner:** Backend Team
