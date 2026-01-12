# Retail Commission Flow - Complete Architecture

> **Last Updated**: January 11, 2026
> **Author**: Claude Code
> **Status**: Phase 1 Complete - Database Ready

---

## 📊 **Volume Tracking System**

### **Two Volume Types**

```
PBV (Personal Bonus Volume)
  └─ Sum of agent's OWN retail sales
  └─ Used for: Rank qualification, Fast Start bonuses
  └─ Tracked: Lifetime + 90-day rolling

OBV (Organization Bonus Volume)
  └─ Sum of ENTIRE DOWNLINE's PBV (including agent's own)
  └─ Used for: Rank qualification, Team bonuses
  └─ Tracked: Lifetime + 90-day rolling
```

### **Database Storage**

**agents table (4 new fields)**:
- `personal_bonus_volume` - Lifetime PBV
- `organization_bonus_volume` - Lifetime OBV
- `pbv_90_days` - Rolling 90-day PBV (for rank qualification)
- `obv_90_days` - Rolling 90-day OBV (for rank qualification)

**Auto-updating**:
- ✅ PBV updates automatically via database trigger when commission created
- ✅ OBV recalculates via function call (called by workflow after commission)

---

## 🔄 **Complete Retail Commission Flow**

### **Example: Agent Sells $97 Training Course with 50 BV**

```
STEP 1: CHECKOUT
─────────────────────────────────────────────────
Customer completes Stripe checkout
  ↓
POST /api/webhooks/stripe
  ↓
Create order record:
  - agent_id: selling agent
  - total_amount: $97
  - total_bonus_volume: 50 BV
  - status: 'completed'

STEP 2: CREATE COMMISSION
─────────────────────────────────────────────────
Create commission record:
  - agent_id: selling agent
  - carrier: 'retail'
  - policy_number: 'RET-{order_id}'
  - premium_amount: $97
  - commission_rate: 0.15 (15% for agent's rank)
  - commission_amount: $97 × 0.15 = $14.55
  - bonus_volume: 50 BV
  - source: 'retail'
  - product_id: {product_id}
  - order_id: {order_id}

STEP 3: DATABASE TRIGGER (Automatic)
─────────────────────────────────────────────────
trigger_update_agent_pbv() fires
  ↓
UPDATE agents SET
  personal_bonus_volume = personal_bonus_volume + 50,
  pbv_90_days = (SUM of last 90 days)
WHERE id = selling_agent_id

Agent's PBV: 150 → 200
Agent's PBV (90-day): 75 → 125

STEP 4: WORKFLOW (Application Layer)
─────────────────────────────────────────────────
onCommissionCreated(commission) workflow fires
  ↓
├─ Credit selling agent's wallet: $14.55
│
├─ Calculate 6-gen overrides for upline
│   └─ Sponsor (Gen 1): 50 BV × 15% = $7.50
│   └─ Gen 2: 50 BV × 5% = $2.50
│   └─ Gen 3: 50 BV × 3% = $1.50
│   └─ Gen 4: 50 BV × 2% = $1.00
│   └─ Gen 5: 50 BV × 1% = $0.50
│   └─ Gen 6: 50 BV × 0.5% = $0.25
│   └─ Credit each upline agent's wallet
│
├─ Recalculate OBV for all upline (propagate BV upward)
│   └─ For each upline agent:
│       └─ recalculate_agent_obv(agent_id)
│       └─ Sums all downline's PBV
│
├─ Check for Fast Start bonus (if agent within 90 days)
│   └─ If qualified: Create bonus record + credit wallet
│
├─ Recalculate selling agent's rank
│   └─ Check if PBV/OBV/metrics now qualify for promotion
│   └─ If promoted: Trigger onRankChanged workflow
│
└─ Update contest leaderboards (if active contest)
```

---

## 💰 **Commission Breakdown Example**

**Product**: Advanced Recruiting Training
**Price**: $97
**Bonus Volume**: 50 BV

| Recipient | Type | Calculation | Amount |
|-----------|------|-------------|--------|
| Selling Agent | Direct Commission | $97 × 15% | **$14.55** |
| Sponsor (Gen 1) | Override | 50 BV × 15% | **$7.50** |
| Gen 2 | Override | 50 BV × 5% | **$2.50** |
| Gen 3 | Override | 50 BV × 3% | **$1.50** |
| Gen 4 | Override | 50 BV × 2% | **$1.00** |
| Gen 5 | Override | 50 BV × 1% | **$0.50** |
| Gen 6 | Override | 50 BV × 0.5% | **$0.25** |
| **TOTAL** | | | **$28.30** |

**PBV Impact**:
- Selling agent's PBV: +50 BV
- Sponsor's OBV: +50 BV
- Gen 2's OBV: +50 BV
- ... (propagates up entire upline)

---

## 🎯 **Fast Start Bonus Eligibility**

**Trigger**: When agent's PBV reaches certain thresholds within first 90 days

**Example Thresholds**:
- 100 BV in 90 days → $100 Fast Start Bonus
- 250 BV in 90 days → $250 Fast Start Bonus
- 500 BV in 90 days → $500 Fast Start Bonus

**How It Works**:
```typescript
// In BonusEngine.checkFastStartBonus()

// Check if agent is within fast start period
const agent = await getAgent(commission.agent_id);
const fastStartEndsAt = new Date(agent.fast_start_ends_at);
if (Date.now() > fastStartEndsAt) return; // Past 90 days

// Check PBV thresholds
if (agent.pbv_90_days >= 500 && !hasFastStartBonus(agent, 500)) {
  createBonus({
    agent_id: agent.id,
    bonus_type: 'fast_start',
    amount: 500,
    description: '500 BV Fast Start Bonus'
  });
}
```

---

## 📈 **Rank Qualification with PBV/OBV**

**Example: Rank Requirements**

| Rank | 90-Day Premium | PBV 90-Day | OBV 90-Day | Active Agents |
|------|----------------|------------|------------|---------------|
| Associate | $10,000 | 200 BV | 500 BV | 3 |
| Sr. Associate | $25,000 | 500 BV | 1,500 BV | 5 |
| Agent | $50,000 | 1,000 BV | 5,000 BV | 10 |
| Sr. Agent | $100,000 | 2,000 BV | 15,000 BV | 20 |

**Qualification Check**:
```typescript
// In RankEngine.calculateRank()

function qualifiesForRank(agent: Agent, rank: Rank): boolean {
  const requirements = RANK_CONFIG[rank].requirements;

  return (
    agent.premium_90_days >= requirements.premium_90_days &&
    agent.pbv_90_days >= requirements.pbv_90_days &&
    agent.obv_90_days >= requirements.obv_90_days &&
    agent.active_agents_count >= requirements.active_agents &&
    agent.persistency_rate >= requirements.persistency_rate &&
    agent.placement_rate >= requirements.placement_rate
  );
}
```

---

## 🛒 **E-Commerce Checkout Flow**

### **Frontend Flow**

```tsx
// 1. Agent's shop page
/dashboard/shop
  └─ Browse products
  └─ Add to cart (React state)
  └─ Click "Checkout"

// 2. Stripe Checkout
Redirect to Stripe Hosted Checkout
  └─ Pre-filled with:
      - customer_email
      - line_items (products with BV)
      - metadata: { agent_id, product_ids[] }

// 3. Payment Success
Stripe redirects to:
  /dashboard/shop/success?session_id={session_id}
  └─ Show success message
  └─ Display download links
```

### **Backend Flow**

```typescript
// Stripe webhook receives event
POST /api/webhooks/stripe
{
  type: 'checkout.session.completed',
  data: {
    customer_email: 'customer@email.com',
    amount_total: 9700, // $97.00
    metadata: {
      agent_id: 'uuid',
      products: '[{"id":"uuid","bv":50}]'
    }
  }
}

// Handler creates order
const order = await createOrder({
  customer_email,
  agent_id: metadata.agent_id,
  total_amount: 97,
  total_bonus_volume: 50,
  status: 'completed'
});

// Handler creates commission
const commission = await createCommission({
  agent_id: metadata.agent_id,
  carrier: 'retail',
  policy_number: `RET-${order.id}`,
  premium_amount: 97,
  commission_rate: getRetailCommissionRate(agent.rank),
  commission_amount: 97 * rate,
  bonus_volume: 50,
  source: 'retail',
  order_id: order.id,
  status: 'pending'
});

// Workflow fires automatically (onCommissionCreated)
// Overrides, bonuses, PBV/OBV all cascade from here
```

---

## 🔧 **Implementation Checklist**

### **Phase 1: Database** ✅ COMPLETE
- [x] Add `source`, `product_id`, `order_id`, `bonus_volume` to commissions
- [x] Create `products`, `orders`, `order_items` tables
- [x] Add `personal_bonus_volume`, `organization_bonus_volume` to agents
- [x] Add `pbv_90_days`, `obv_90_days` to agents
- [x] Create `update_agent_pbv()` trigger
- [x] Create `recalculate_agent_obv()` function
- [x] Add RLS policies for new tables

### **Phase 2A: Smart Office Integration** (Tomorrow)
- [ ] Create `/api/webhooks/smart-office` endpoint
- [ ] Parse Smart Office payload
- [ ] Map to commission record with `source: 'smart_office'`
- [ ] Trigger workflows (overrides, bonuses, OBV)

### **Phase 2B: E-Commerce** (2-3 days)
- [ ] Admin product management UI
  - [ ] Create/edit/delete products
  - [ ] Set BV per product
  - [ ] Upload digital assets
- [ ] Agent shop page
  - [ ] Product catalog with filters
  - [ ] Shopping cart (React state)
  - [ ] Stripe Checkout integration
- [ ] Stripe webhook handler
  - [ ] Create order on payment success
  - [ ] Create commission with `source: 'retail'`
  - [ ] Deliver digital assets
- [ ] Retail commission calculator
  - [ ] Get agent's rank
  - [ ] Calculate commission rate
  - [ ] Calculate direct commission
  - [ ] Trigger override workflow

### **Phase 3: Bonus Engine Updates**
- [ ] Update Fast Start bonus to check PBV thresholds
- [ ] Add OBV-based bonuses (if any)
- [ ] Update rank qualification to include PBV/OBV

### **Phase 4: Testing**
- [ ] Test retail sale → commission → overrides → wallet
- [ ] Test PBV/OBV calculations
- [ ] Test rank qualification with BV
- [ ] Test Fast Start with BV thresholds

---

## 📝 **Key Design Decisions**

1. **Selling Agent Gets Direct Commission** ✅
   - Agent earns commission on their own sales
   - Upline ALSO gets overrides on that same sale
   - Both happen simultaneously

2. **BV Propagates Upline** ✅
   - When agent makes sale → PBV increases
   - Database trigger updates PBV automatically
   - Workflow calls `recalculate_agent_obv()` for each upline
   - OBV cascades up entire genealogy

3. **90-Day Rolling Windows** ✅
   - PBV/OBV tracked for both lifetime AND 90-day
   - Rank qualification uses 90-day values
   - Recalculated on every new commission

4. **Unified Commission Engine** ✅
   - ALL sources (retail, smart_office, manual) use same workflow
   - `source` field differentiates for reporting
   - Override calculations work identically regardless of source

5. **Database Triggers for Performance** ✅
   - PBV updates via trigger (fast, automatic)
   - OBV recalculated via function (called by workflow)
   - No manual tracking needed

---

## 🚀 **Next Steps**

1. **Apply Migration** - Run `00006_multi_source_commissions.sql` in Supabase
2. **Test PBV/OBV Functions** - Verify triggers and functions work
3. **Wait for Smart Office Docs** - Build webhook handler
4. **Build E-Commerce** - Products, shop, checkout, delivery
5. **Update Bonus Engine** - Add PBV-based Fast Start thresholds

---

*Database is ready. Waiting for Smart Office docs + building e-commerce next.*
