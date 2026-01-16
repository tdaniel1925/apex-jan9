Here's the full PRD as text:

---

# PRODUCT REQUIREMENTS DOCUMENT
## APEX Incentive Programs Module

| Field | Value |
|-------|-------|
| Project | APEX Compensation Engine - Incentive Programs |
| Version | 1.0 |
| Date | January 2026 |
| Author | BotMakers, Inc. |
| Status | Draft - Pending Leadership Approval |

---

## 1. Executive Summary

This PRD defines three new incentive programs to be added to the APEX compensation engine: the Car Bonus Program (APEX Drive), the Fast Start Bonus Program (APEX Ignition), and the Elite 10 Recognition Program. These programs are designed to reward top performers, accelerate new agent success, and build a culture of excellence within the APEX field force.

All three programs will be managed entirely within the BotMakers compensation engine and will submit payout data to SmartOffice for processing, consistent with the existing compensation plan architecture.

---

## 2. Programs Overview

### 2.1 Program #1: APEX Drive (Car Bonus)

A tiered monthly bonus program that rewards consistent high producers with a monthly car allowance based on placed/paid premium volume.

| Tier | Monthly Premium | Monthly Bonus | Annual Value |
|------|-----------------|---------------|--------------|
| Silver | $15,000 | $300 | $3,600 |
| Gold | $25,000 | $500 | $6,000 |
| Platinum | $40,000 | $800 | $9,600 |
| Elite | $60,000+ | $1,200 | $14,400 |

**Qualification Rules:**
- Must maintain production level for 3 consecutive months to qualify
- Miss one month = warning, miss two consecutive = drop to lower tier
- Quality gates apply: 60% placement, 80% persistency, no chargebacks
- Bonus paid on 15th of following month

### 2.2 Program #2: APEX Ignition (Fast Start)

A milestone-based bonus program for new agents in their first 90 days, designed to accelerate onboarding and reward early success.

| Milestone | Timeframe | Bonus |
|-----------|-----------|-------|
| First Policy Placed | Days 1-30 | $100 |
| $5,000 Premium | Days 1-45 | $150 |
| $10,000 Premium | Days 1-60 | $250 |
| $25,000 Premium | Days 1-90 | $500 |
| **TOTAL POSSIBLE** | | **$1,000** |

**Recruiter Match:** Recruiting agent earns 25% match on their recruit's Fast Start bonus.

### 2.3 Program #3: The APEX Elite 10

A quarterly recognition program identifying the top 10 performers who serve as closing resources for the entire field force.

**Selection Criteria (Weighted Score):**
- Total Premium Placed: 40%
- Number of Policies Written: 20%
- Closing Ratio (Apps to Placements): 20%
- Quality (Persistency + Placement): 20%

**Minimum Requirements:**
- Must be Agent rank or higher
- 60% placement ratio minimum
- 80% persistency ratio minimum

**Benefits:**
- $500 quarterly bonus for selection
- $50-$100 per assist when helping another agent close
- 1% override on assisted deals
- Featured on company website and marketing materials
- Professional bio distributed to all agents
- Direct line to leadership
- Invitation to annual Elite Summit

**Hall of Fame:** Agents who make Elite 10 for 4+ quarters receive permanent recognition.

---

## 3. Database Schema

### 3.1 New Tables

#### incentive_car_bonus_tiers

```sql
CREATE TABLE incentive_car_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(50) NOT NULL, -- Silver, Gold, Platinum, Elite
  min_monthly_premium DECIMAL(12,2) NOT NULL,
  max_monthly_premium DECIMAL(12,2), -- NULL for Elite (no cap)
  monthly_bonus_amount DECIMAL(10,2) NOT NULL,
  consecutive_months_required INT DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### incentive_car_bonus_tracking

```sql
CREATE TABLE incentive_car_bonus_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  month_year DATE NOT NULL, -- First of month
  placed_premium DECIMAL(12,2) NOT NULL,
  qualified_tier_id UUID REFERENCES incentive_car_bonus_tiers(id),
  consecutive_months INT DEFAULT 0,
  bonus_earned DECIMAL(10,2) DEFAULT 0,
  quality_gate_passed BOOLEAN DEFAULT false,
  placement_ratio DECIMAL(5,2),
  persistency_ratio DECIMAL(5,2),
  has_chargebacks BOOLEAN DEFAULT false,
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, month_year)
);
```

#### incentive_fast_start_milestones

```sql
CREATE TABLE incentive_fast_start_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_name VARCHAR(100) NOT NULL,
  milestone_type VARCHAR(20) NOT NULL, -- first_policy, premium_threshold
  premium_threshold DECIMAL(12,2), -- NULL for first_policy type
  days_limit INT NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### incentive_fast_start_tracking

```sql
CREATE TABLE incentive_fast_start_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  start_date DATE NOT NULL, -- Agent's contracting date
  end_date DATE NOT NULL, -- start_date + 90 days
  milestone_id UUID REFERENCES incentive_fast_start_milestones(id),
  achieved_date DATE,
  bonus_earned DECIMAL(10,2) DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, milestone_id)
);
```

#### incentive_fast_start_recruiter_match

```sql
CREATE TABLE incentive_fast_start_recruiter_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_agent_id UUID REFERENCES agents(id),
  new_agent_id UUID REFERENCES agents(id),
  fast_start_tracking_id UUID REFERENCES incentive_fast_start_tracking(id),
  match_percentage DECIMAL(5,2) DEFAULT 25.00,
  match_bonus_earned DECIMAL(10,2) DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### incentive_elite_10_periods

```sql
CREATE TABLE incentive_elite_10_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name VARCHAR(50) NOT NULL, -- Q1 2026, Q2 2026, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  selection_date DATE, -- When Elite 10 are selected
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### incentive_elite_10_members

```sql
CREATE TABLE incentive_elite_10_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES incentive_elite_10_periods(id),
  agent_id UUID REFERENCES agents(id),
  rank_position INT NOT NULL, -- 1-10
  total_score DECIMAL(10,4) NOT NULL,
  premium_score DECIMAL(10,4),
  policy_count_score DECIMAL(10,4),
  close_ratio_score DECIMAL(10,4),
  quality_score DECIMAL(10,4),
  quarterly_bonus DECIMAL(10,2) DEFAULT 500.00,
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_id, agent_id),
  UNIQUE(period_id, rank_position)
);
```

#### incentive_elite_10_assists

```sql
CREATE TABLE incentive_elite_10_assists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elite_member_id UUID REFERENCES incentive_elite_10_members(id),
  assisted_agent_id UUID REFERENCES agents(id),
  policy_id UUID REFERENCES policies(id),
  request_date TIMESTAMPTZ NOT NULL,
  assist_date TIMESTAMPTZ,
  close_date TIMESTAMPTZ,
  policy_premium DECIMAL(12,2),
  assist_bonus DECIMAL(10,2), -- $50-$100 flat
  override_percentage DECIMAL(5,2) DEFAULT 1.00,
  override_bonus DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'requested', -- requested, in_progress, closed, expired
  payout_status VARCHAR(20) DEFAULT 'pending',
  payout_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### incentive_elite_10_hall_of_fame

```sql
CREATE TABLE incentive_elite_10_hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  total_quarters INT DEFAULT 0,
  first_selection_date DATE,
  last_selection_date DATE,
  inducted_date DATE, -- When they hit 4 quarters
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id)
);
```

---

## 4. API Endpoints

### 4.1 Car Bonus Endpoints

#### GET /api/incentives/car-bonus/tiers
Returns all active car bonus tiers with requirements and bonus amounts.

#### GET /api/incentives/car-bonus/agent/{agentId}/status
Returns current car bonus status for an agent including current tier, consecutive months, and projected bonus.

#### POST /api/incentives/car-bonus/calculate-monthly
Triggered by scheduler at month end. Calculates car bonus eligibility for all agents.

```json
Request Body:
{
  "month_year": "2026-01-01",
  "dry_run": false
}
```

### 4.2 Fast Start Endpoints

#### GET /api/incentives/fast-start/milestones
Returns all active fast start milestones with requirements.

#### GET /api/incentives/fast-start/agent/{agentId}/progress
Returns fast start progress for a new agent including achieved milestones and remaining opportunities.

#### POST /api/incentives/fast-start/check-milestone
Triggered when a policy is placed. Checks if agent has achieved any new milestones.

```json
Request Body:
{
  "agent_id": "uuid",
  "policy_id": "uuid"
}
```

### 4.3 Elite 10 Endpoints

#### GET /api/incentives/elite-10/current
Returns current Elite 10 members with their profiles and contact information.

#### GET /api/incentives/elite-10/leaderboard
Returns real-time leaderboard for current quarter showing top candidates.

#### POST /api/incentives/elite-10/request-assist
Agent requests help from an Elite 10 member.

```json
Request Body:
{
  "requesting_agent_id": "uuid",
  "elite_member_id": "uuid",
  "policy_id": "uuid",
  "notes": "string"
}
```

#### POST /api/incentives/elite-10/record-assist
Records an assist when Elite 10 member helps close a deal.

```json
Request Body:
{
  "assist_id": "uuid",
  "close_date": "2026-01-15",
  "policy_premium": 5000.00
}
```

#### POST /api/incentives/elite-10/calculate-quarterly
Triggered by scheduler at quarter end. Selects new Elite 10 members.

```json
Request Body:
{
  "period_id": "uuid",
  "dry_run": false
}
```

---

## 5. Business Logic

### 5.1 Car Bonus Calculation Logic

```javascript
function calculateCarBonus(agentId, monthYear) {
  // 1. Get agent's placed/paid premium for the month
  const monthlyPremium = getPlacedPaidPremium(agentId, monthYear);
  
  // 2. Check quality gates
  const qualityGates = checkQualityGates(agentId, monthYear);
  if (!qualityGates.passed) {
    return { eligible: false, reason: qualityGates.reason };
  }
  
  // 3. Determine qualifying tier
  const tier = getTierByPremium(monthlyPremium);
  if (!tier) {
    return { eligible: false, reason: 'Below minimum threshold' };
  }
  
  // 4. Check consecutive months
  const consecutiveMonths = getConsecutiveMonths(agentId, tier.id);
  
  // 5. If 3+ consecutive months at tier, award bonus
  if (consecutiveMonths >= 3) {
    return {
      eligible: true,
      tier: tier.name,
      bonus: tier.monthlyBonusAmount,
      consecutiveMonths: consecutiveMonths
    };
  }
  
  // 6. Building toward qualification
  return {
    eligible: false,
    tier: tier.name,
    consecutiveMonths: consecutiveMonths,
    monthsUntilQualified: 3 - consecutiveMonths
  };
}
```

### 5.2 Fast Start Milestone Logic

```javascript
function checkFastStartMilestones(agentId, policyId) {
  // 1. Verify agent is in fast start period (first 90 days)
  const agent = getAgent(agentId);
  const daysSinceStart = daysBetween(agent.contractingDate, today());
  
  if (daysSinceStart > 90) {
    return { inFastStart: false };
  }
  
  // 2. Get all milestones not yet achieved
  const pendingMilestones = getPendingMilestones(agentId);
  const achievedMilestones = [];
  
  // 3. Check each milestone
  for (const milestone of pendingMilestones) {
    if (daysSinceStart > milestone.daysLimit) continue;
    
    if (milestone.type === 'first_policy') {
      if (getPlacedPolicyCount(agentId) >= 1) {
        achievedMilestones.push(milestone);
      }
    } else if (milestone.type === 'premium_threshold') {
      const totalPremium = getTotalPlacedPremium(agentId);
      if (totalPremium >= milestone.premiumThreshold) {
        achievedMilestones.push(milestone);
      }
    }
  }
  
  // 4. Record achievements and calculate recruiter match
  for (const milestone of achievedMilestones) {
    recordMilestoneAchievement(agentId, milestone);
    calculateRecruiterMatch(agentId, milestone);
  }
  
  return { achievedMilestones };
}
```

### 5.3 Elite 10 Selection Logic

```javascript
function selectElite10(periodId) {
  const period = getPeriod(periodId);
  
  // 1. Get all eligible agents (Agent rank or higher, meets quality gates)
  const eligibleAgents = getEligibleAgents(period);
  
  // 2. Calculate scores for each agent
  const scoredAgents = eligibleAgents.map(agent => {
    const metrics = getAgentMetrics(agent.id, period);
    
    return {
      agentId: agent.id,
      premiumScore: normalizeScore(metrics.totalPremium, 'premium') * 0.40,
      policyCountScore: normalizeScore(metrics.policyCount, 'policies') * 0.20,
      closeRatioScore: normalizeScore(metrics.closeRatio, 'closeRatio') * 0.20,
      qualityScore: normalizeScore(metrics.qualityScore, 'quality') * 0.20,
      totalScore: 0 // Calculated below
    };
  });
  
  // 3. Calculate total scores
  scoredAgents.forEach(agent => {
    agent.totalScore = agent.premiumScore + agent.policyCountScore + 
                       agent.closeRatioScore + agent.qualityScore;
  });
  
  // 4. Sort and select top 10
  scoredAgents.sort((a, b) => b.totalScore - a.totalScore);
  const elite10 = scoredAgents.slice(0, 10);
  
  // 5. Record selections and update Hall of Fame
  elite10.forEach((agent, index) => {
    recordElite10Selection(periodId, agent, index + 1);
    updateHallOfFame(agent.agentId);
  });
  
  return elite10;
}
```

---

## 6. SmartOffice Integration

### 6.1 Payout Data Submission

All incentive bonuses are calculated by the BotMakers compensation engine and submitted to SmartOffice for payment processing via the existing integration pipeline.

#### Submission Format

```json
{
  "submission_type": "incentive_bonus",
  "submission_date": "2026-01-15",
  "payouts": [
    {
      "agent_id": "uuid",
      "agent_smartoffice_id": "SO-12345",
      "bonus_type": "car_bonus",
      "bonus_period": "2026-01",
      "bonus_amount": 500.00,
      "description": "APEX Drive - Gold Tier",
      "reference_id": "uuid"
    },
    {
      "agent_id": "uuid",
      "agent_smartoffice_id": "SO-67890",
      "bonus_type": "fast_start",
      "bonus_period": "2026-01",
      "bonus_amount": 250.00,
      "description": "APEX Ignition - $10K Premium Milestone",
      "reference_id": "uuid"
    }
  ]
}
```

### 6.2 Payout Schedule

- **Car Bonus:** Paid on 15th of following month
- **Fast Start Bonuses:** Paid within 7 days of milestone achievement
- **Elite 10 Quarterly Bonus:** Paid within 14 days of quarter end
- **Elite 10 Assist Bonuses:** Paid weekly with regular commission run

---

## 7. UI Requirements

### 7.1 Agent Dashboard - Incentives Section

- Car Bonus progress tracker showing current tier, consecutive months, and next tier requirements
- Fast Start timeline (for new agents) showing achieved and pending milestones
- Elite 10 leaderboard showing current standings (for qualified agents)
- Request Assist button to connect with Elite 10 members

### 7.2 Admin Dashboard - Incentive Management

- Configure tier thresholds and bonus amounts
- View and approve pending bonus payouts
- Run Elite 10 selection process
- View assist request queue and status
- Generate incentive reports by program, period, agent

### 7.3 Elite 10 Portal

- View incoming assist requests with case details
- Accept/decline assist requests
- Track assist history and earnings
- View Hall of Fame status and quarterly recognition

---

## 8. Quality Gates

All incentive programs require agents to meet the following quality gates:

| Gate | Requirement |
|------|-------------|
| Placement Ratio | Minimum 60% |
| Persistency Ratio | Minimum 80% |
| Chargebacks | No chargebacks in measurement period |
| Elite 10 Only: Rank | Must be Agent rank or higher |

---

## 9. Acceptance Criteria

### 9.1 Car Bonus Program

1. System correctly calculates monthly placed/paid premium for each agent
2. System correctly identifies qualifying tier based on premium thresholds
3. System tracks consecutive months at each tier level
4. System resets consecutive month counter when agent misses 2 months
5. System enforces quality gates before awarding bonus
6. Bonus data correctly submitted to SmartOffice on the 15th

### 9.2 Fast Start Program

1. System correctly identifies new agents in first 90 days
2. System tracks milestone achievements with proper date validation
3. Milestones stack correctly (agent can earn all four)
4. Recruiter match calculated and paid correctly (25%)
5. Milestone bonuses paid within 7 days of achievement

### 9.3 Elite 10 Program

1. Selection algorithm correctly weights all four criteria
2. Only agents meeting rank and quality requirements are eligible
3. Assist request workflow functions correctly
4. Assist bonuses calculated correctly ($50-$100 + 1% override)
5. Hall of Fame correctly tracks agents with 4+ quarters
6. Elite 10 profiles display correctly on agent dashboard

---

## 10. Implementation Timeline

| Phase | Deliverable | Timeline |
|-------|-------------|----------|
| Phase 1 | Fast Start Program | Immediate (Week 1-2) |
| Phase 2 | Elite 10 Program | 30-60 days (Week 3-8) |
| Phase 3 | Car Bonus Program | 60-90 days (Week 9-12) |
| Phase 4 | Full Integration & Testing | Week 13-14 |

---

*— End of Document —*

*BotMakers, Inc. | A Subsidiary of BioQuest, Inc. (BQST)*