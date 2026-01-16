# Product Requirements Document: Apex Affinity Group Compensation Plan

**Document Version:** 1.1
**Date:** January 16, 2026
**Author:** BotMakers Inc.
**Client:** Apex Affinity Group
**Last Updated:** January 16, 2026 - Updated to match existing Apex schema

---

## 1. Executive Summary

This document defines the requirements for the Apex Affinity Group compensation plan system, with specific focus on compliant handling of commission payments when upline agents are unlicensed. The system must comply with NAIC Model Law §218 and Texas Insurance Code §4005.053, which prohibit payment of insurance commissions to unlicensed persons.

### 1.1 Implementation Approach

**IMPORTANT:** This implementation EXTENDS the existing Apex database schema rather than creating parallel tables. The Apex system already has:
- `agents` table with sponsor hierarchy
- `commissions` table for policy commissions
- `overrides` table for 6-generation direct overrides
- `bonuses` table for various bonus types
- `wallet` system for payouts

**Key Decisions:**
- **Unlicensed Override Handling:** `roll_up_to_next_licensed` (override passes to next licensed upline)
- **Direct Commission Overrides:** 6 generations (existing)
- **Roll-Up Traversal Depth:** 7 generations (to find next licensed upline)
- **License Data Source:** Synced from SmartOffice integration

---

## 2. Regulatory Background

### 2.1 The Problem

In an insurance MLM structure, an unlicensed person may recruit a licensed agent who then writes business. The question arises: can the unlicensed recruiter receive override commissions?

### 2.2 The Law

**The answer is NO.** Commissions cannot be paid to unlicensed persons under any circumstances.

| Regulation | Requirement |
|------------|-------------|
| NAIC Model Law §218, Section 13(A) | Prohibits payment of commission to a person who is required to be licensed but is not licensed |
| NAIC Model Law §218, Section 13(B) | Prohibits a person from receiving commission if they were unlicensed and required to hold a license |
| NAIC Model Law §218, Section 13(C) | Permits renewal/deferred commissions ONLY for persons who WERE licensed at the time the commission was earned |
| Texas Insurance Code §4005.053 | An insurer or agent may not pay commission to any person unless the person holds a license to act as an agent |
| NY Insurance Law §2114, §2115, §2116 | Prohibits commission sharing with unlicensed persons; compensation for referrals cannot be based on purchase of insurance |

### 2.3 Critical Compliance Points

1. **No Reserve/Escrow:** Commissions CANNOT be held in reserve for unlicensed persons. This constitutes a promise to pay an unlicensed person, which violates state law.

2. **No Retroactive Payment:** Once an agent becomes licensed, they earn on NEW business only. They cannot receive commissions for business written while they were unlicensed.

3. **Position vs. Commission:** Unlicensed persons CAN earn rank/position in the hierarchy but CANNOT receive commission until licensed.

4. **Override Must Bypass:** Override commissions for unlicensed uplines must either roll up to the next licensed upline OR be retained by the company.

---

## 3. Functional Requirements

### 3.1 Agent License Status Tracking

The system must track the following license information for each agent:

| Field | Type | Description |
|-------|------|-------------|
| license_status | Enum | licensed, unlicensed, pending, expired, suspended |
| license_number | String | State-issued license number |
| license_state | String | Two-letter state code |
| license_effective_date | Date | When license became active |
| license_expiration_date | Date | When license expires |

**License Status Definitions:**

- **licensed** - Agent holds a valid, active license
- **unlicensed** - Agent has never been licensed or has not applied
- **pending** - Agent has applied for license, awaiting approval
- **expired** - Agent's license has passed expiration date
- **suspended** - Agent's license has been suspended by regulatory authority

### 3.2 License Eligibility Check

An agent is eligible to receive commissions ONLY if ALL of the following are true:

```
1. license_status = 'licensed'
2. license_number IS NOT NULL
3. license_expiration_date IS NULL OR license_expiration_date > TODAY
```

### 3.3 Unlicensed Override Handling Options

The system must support two configurable options for handling override commissions when an upline agent is unlicensed:

#### Option A: Roll Up to Next Licensed Upline

**Configuration Value:** `roll_up_to_next_licensed`

**Behavior:**
1. When calculating override for an unlicensed upline, skip that agent
2. Add the override amount to the next licensed upline's override
3. Continue up the hierarchy until a licensed agent is found
4. If no licensed upline exists, company retains the amount
5. Log the roll-up in compliance logs with full audit trail

**Example:**

```
Hierarchy: Agent A (writes policy) → Agent B (unlicensed) → Agent C (licensed) → Agent D (licensed)

Override Schedule:
- Gen 1: 10%
- Gen 2: 5%
- Gen 3: 3%

Policy Premium: $1,000

Commission Calculation:
- Agent A (writing agent): $800 first-year commission (80%)
- Agent B: $0 (unlicensed - 10% override skipped)
- Agent C: $150 (5% own override + 10% rolled up from B)
- Agent D: $30 (3% override)

Compliance Log Entry:
"Agent B override of $100 rolled up to Agent C due to unlicensed status"
```

#### Option B: Company Retains

**Configuration Value:** `company_retains`

**Behavior:**
1. When calculating override for an unlicensed upline, record as forfeited
2. Company keeps the override amount
3. Create commission transaction with status = 'forfeited' for audit trail
4. Log in compliance logs with regulatory reference

**Example:**

```
Hierarchy: Agent A (writes policy) → Agent B (unlicensed) → Agent C (licensed) → Agent D (licensed)

Override Schedule:
- Gen 1: 10%
- Gen 2: 5%
- Gen 3: 3%

Policy Premium: $1,000

Commission Calculation:
- Agent A (writing agent): $800 first-year commission (80%)
- Agent B: $0 (unlicensed - $100 forfeited to company)
- Agent C: $50 (5% override - does NOT receive B's amount)
- Agent D: $30 (3% override)

Compliance Log Entry:
"Agent B override of $100 forfeited to company due to unlicensed status per compensation plan policy"
```

### 3.4 Admin Configuration Interface

The system must provide an admin interface to configure:

| Setting | Type | Options | Default |
|---------|------|---------|---------|
| unlicensed_override_handling | Enum | roll_up_to_next_licensed, company_retains | roll_up_to_next_licensed |
| max_generation_levels | Integer | 1-10 | 7 |
| chargeback_period_months | Integer | 3, 6, 9, 12, 18, 24 | 12 |
| minimum_payout_threshold | Decimal | Any positive number | $25.00 |
| payment_frequency | Enum | weekly, biweekly, monthly | monthly |

### 3.5 Compliance Logging Requirements

Every commission calculation involving an unlicensed agent must create a compliance log entry with:

| Field | Description |
|-------|-------------|
| agent_id | The unlicensed agent |
| event_type | unlicensed_override_prevented, commission_rolled_up, commission_forfeited |
| policy_id | The policy that generated the commission |
| description | Human-readable description of what happened |
| action_taken | What the system did (rolled up to X, forfeited, etc.) |
| regulatory_reference | Citation to applicable law (e.g., "NAIC Model Law §218 Section 13; Texas Insurance Code §4005.053") |
| created_at | Timestamp |

### 3.6 License Status Change Tracking

The system must automatically log all license status changes:

| Field | Description |
|-------|-------------|
| agent_id | The agent whose status changed |
| previous_status | Status before change |
| new_status | Status after change |
| license_number | Current license number |
| license_state | Current license state |
| effective_date | When new status takes effect |
| change_reason | Why status changed |
| changed_by | User or system that made change |

---

## 4. Data Model

### 4.1 Agent Ranks (EXISTING - Reference Only)

The Apex system uses an ENUM type with 13 predefined ranks. **DO NOT create a new ranks table.**

```sql
-- EXISTING ENUM (already in database)
CREATE TYPE agent_rank AS ENUM (
  'founder',           -- Order 0: Special founder rank
  'pre_associate',     -- Order 1: Entry level
  'associate',         -- Order 2: $10K premium requirement
  'sr_associate',      -- Order 3: $25K premium requirement
  'agent',             -- Order 4: $45K premium requirement
  'sr_agent',          -- Order 5: $75K + 5 active agents
  'mga',               -- Order 6: $150K + 10 active agents
  'associate_mga',     -- Order 7: MGA + 2 MGAs in downline
  'senior_mga',        -- Order 8: MGA + 4 MGAs in downline
  'regional_mga',      -- Order 9: MGA + 6 MGAs in downline
  'national_mga',      -- Order 10: MGA + 8 MGAs in downline
  'executive_mga',     -- Order 11: MGA + 10 MGAs in downline
  'premier_mga'        -- Order 12: MGA + 12 MGAs in downline
);
```

**Rank Configuration:** See `lib/config/ranks.ts` for full requirements including:
- `premium90Days` - 90-day premium production requirement
- `activeAgents` - Minimum active agents in downline
- `personalRecruits` - Minimum personal recruits
- `mgasInDownline` - MGAs required (for MGA+ tiers)
- `persistencyRequired` / `placementRequired` - Quality metrics

### 4.2 Agents Table Extension (ALTER EXISTING)

The `agents` table already exists. We ADD these license compliance fields:

```sql
-- NEW: License status enum
CREATE TYPE license_status AS ENUM (
  'licensed',     -- Valid, active license
  'unlicensed',   -- Never licensed or not applied
  'pending',      -- Application submitted, awaiting approval
  'expired',      -- License past expiration date
  'suspended'     -- License suspended by regulatory authority
);

-- EXTEND existing agents table (NOT CREATE)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_status license_status DEFAULT 'unlicensed';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_state CHAR(2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_expiration_date DATE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS smartoffice_contact_id TEXT;

-- NOTE: Apex uses sponsor_id for upline hierarchy (NOT upline_agent_id)
-- The existing is_licensed_agent and licensed_date fields will be kept for backward compatibility
```

**Existing License Fields (Keep for Compatibility):**
- `is_licensed_agent` BOOLEAN - Simple licensed flag
- `licensed_date` DATE - When agent became licensed

**New License Fields (Add for Compliance):**
- `license_status` ENUM - Detailed status tracking
- `license_number` TEXT - State-issued license number
- `license_state` CHAR(2) - State of licensure (e.g., "TX", "CA")
- `license_expiration_date` DATE - License expiration for proactive checks

### 4.3 Policies

```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY,
  policy_number VARCHAR(100) NOT NULL,
  carrier_id UUID REFERENCES carriers(id),
  writing_agent_id UUID REFERENCES agents(id) NOT NULL,
  
  product_type product_type NOT NULL,
  premium DECIMAL(12,2) NOT NULL,
  annualized_premium DECIMAL(12,2) NOT NULL,
  status policy_status DEFAULT 'submitted',
  
  submit_date DATE DEFAULT CURRENT_DATE,
  effective_date DATE,
  issue_date DATE,
  
  insured_name VARCHAR(255),
  smartoffice_policy_id VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Policy Status Values:**
- submitted
- underwriting
- approved
- issued
- in_force
- lapsed
- cancelled
- declined

**Product Type Values:**
- life_term
- life_whole
- life_universal
- life_indexed_universal
- annuity_fixed
- annuity_indexed
- annuity_variable
- health_major_medical
- health_supplement
- health_medicare_advantage
- health_medicare_supplement

### 4.4 Commission Schedules

```sql
CREATE TABLE commission_schedules (
  id UUID PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id),
  product_type product_type NOT NULL,
  first_year_percentage DECIMAL(5,2) NOT NULL,
  renewal_percentage DECIMAL(5,2) NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 Override Schedules

```sql
CREATE TABLE override_schedules (
  id UUID PRIMARY KEY,
  rank_id UUID REFERENCES agent_ranks(id),
  generation_level INTEGER NOT NULL,
  override_percentage DECIMAL(5,2) NOT NULL,
  product_type VARCHAR(50) DEFAULT 'all',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.6 Compensation Plan Configuration

```sql
CREATE TABLE compensation_plan_configs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  
  -- CRITICAL: How to handle unlicensed upline overrides
  unlicensed_override_handling unlicensed_override_handling NOT NULL DEFAULT 'roll_up_to_next_licensed',
  
  max_generation_levels INTEGER DEFAULT 7,
  chargeback_period_months INTEGER DEFAULT 12,
  minimum_payout_threshold DECIMAL(10,2) DEFAULT 25.00,
  payment_frequency VARCHAR(20) DEFAULT 'monthly',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.7 Commission Transactions

```sql
CREATE TABLE commission_transactions (
  id UUID PRIMARY KEY,
  policy_id UUID REFERENCES policies(id) NOT NULL,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  
  transaction_type commission_transaction_type NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL,
  net_amount DECIMAL(12,2) NOT NULL,
  status commission_status DEFAULT 'pending',
  
  payment_date DATE,
  period_start DATE,
  period_end DATE,
  
  -- Audit trail for roll-ups
  notes TEXT,
  original_agent_id UUID REFERENCES agents(id),
  roll_up_reason roll_up_reason,
  generation_level INTEGER,
  calculation_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Transaction Type Values:**
- first_year_commission
- renewal_commission
- override_commission
- bonus
- chargeback

**Commission Status Values:**
- pending
- approved
- paid
- held
- forfeited

**Roll Up Reason Values:**
- upline_unlicensed
- upline_license_expired
- upline_license_suspended
- company_policy

### 4.8 Compliance Logs

```sql
CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  event_type compliance_event_type NOT NULL,
  
  policy_id UUID REFERENCES policies(id),
  commission_transaction_id UUID REFERENCES commission_transactions(id),
  
  description TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  regulatory_reference TEXT NOT NULL,
  triggered_by VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Event Type Values:**
- unlicensed_override_prevented
- commission_rolled_up
- commission_forfeited
- license_status_change
- compliance_review_required

### 4.9 License History

```sql
CREATE TABLE license_history (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) NOT NULL,
  
  previous_status license_status,
  new_status license_status NOT NULL,
  
  license_number VARCHAR(100),
  license_state VARCHAR(2),
  effective_date DATE,
  expiration_date DATE,
  
  change_reason TEXT,
  changed_by VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Business Logic

### 5.1 Commission Calculation Flow

```
1. Policy is issued
2. System retrieves writing agent and commission schedule
3. Calculate first-year commission for writing agent
4. Build upline chain from writing agent to top of hierarchy
5. For each upline agent (up to max_generation_levels):
   a. Check if agent is licensed (isAgentLicensed function)
   b. If LICENSED:
      - Calculate override based on rank and generation level
      - Add any accumulated roll-up amount
      - Create commission transaction with status 'pending'
   c. If NOT LICENSED:
      - Create compliance log entry
      - If config = 'roll_up_to_next_licensed':
        - Add override amount to accumulator
        - Continue to next upline
      - If config = 'company_retains':
        - Create commission transaction with status 'forfeited'
        - Continue to next upline (no accumulator)
6. If roll-up accumulator has remaining amount and no licensed upline found:
   - Create compliance log: "No licensed upline found, company retains"
7. Save all commission transactions
8. Save all compliance logs
```

### 5.2 License Check Function

```typescript
function isAgentLicensed(agent: Agent): boolean {
  // Must have 'licensed' status
  if (agent.licenseStatus !== 'licensed') {
    return false;
  }

  // Must have a license number
  if (!agent.licenseNumber) {
    return false;
  }

  // License must not be expired
  if (agent.licenseExpirationDate) {
    const now = new Date();
    if (agent.licenseExpirationDate < now) {
      return false;
    }
  }

  return true;
}
```

### 5.3 Get Next Licensed Upline Function

```typescript
function getNextLicensedUpline(
  startAgentId: string, 
  agentMap: Map<string, Agent>
): Agent | null {
  let currentId = agentMap.get(startAgentId)?.uplineAgentId;
  const visited = new Set<string>();
  
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const agent = agentMap.get(currentId);
    
    if (agent && isAgentLicensed(agent)) {
      return agent;
    }
    
    currentId = agent?.uplineAgentId;
  }
  
  return null; // No licensed upline found
}
```

---

## 6. User Interface Requirements

### 6.1 Admin: Compensation Plan Settings

**Location:** Admin → Settings → Compensation Plan

**Required Elements:**

1. **Unlicensed Override Handling Section** (highlighted as critical)
   - Radio button: "Roll Up to Next Licensed Upline"
     - Description: Override commission passes to the next licensed agent in the hierarchy
     - Example diagram showing roll-up behavior
   - Radio button: "Company Retains"
     - Description: Override commission is retained by the company
     - Note: Forfeited amounts are logged but NOT held for future payment
   - Warning box: Legal notice about commissions not being held in reserve

2. **Override Generations**
   - Dropdown: Maximum generation levels (1-10)

3. **Chargeback Policy**
   - Dropdown: Chargeback period in months

4. **Payment Settings**
   - Input: Minimum payout threshold
   - Dropdown: Payment frequency

5. **Save/Reset Buttons**

### 6.2 Admin: Compliance Report

**Location:** Admin → Reports → Compliance

**Required Elements:**

1. **Summary Statistics Cards**
   - Total compliance events
   - Overrides prevented (count)
   - Amount rolled up (sum)
   - Amount forfeited (sum)

2. **Filters**
   - Event type dropdown
   - Date range (from/to)
   - Agent search

3. **Event Log Table**
   - Columns: Date/Time, Event Type, Agent, Description, Action Taken
   - Pagination
   - Click to expand for full details including regulatory reference

4. **Export Button**
   - Export to CSV for regulatory examination

5. **Regulatory Notice**
   - Statement about audit trail requirements
   - Record retention policy

### 6.3 Agent Portal: Commission Statement

**Location:** Agent Portal → Commissions

**Required Elements:**

1. **Commission Summary**
   - Total earned (YTD, MTD)
   - Pending payment
   - Next payment date

2. **Transaction History**
   - List of all commission transactions
   - For roll-up transactions received, show note: "Includes override from [Agent Name]'s downline production"

3. **License Status Warning** (if applicable)
   - If agent is unlicensed: "You are not currently licensed. Override commissions from your downline are being [rolled up to your upline / retained by the company] until you obtain your license."

---

## 7. Compliance Reporting Requirements

### 7.1 Required Reports

1. **Unlicensed Override Report**
   - All instances where override was prevented due to unlicensed status
   - Amount, affected agent, policy details, action taken

2. **License Status Change Report**
   - All license status changes with before/after status
   - Date of change, reason, changed by

3. **Commission Roll-Up Report**
   - All commissions that were rolled up
   - Original agent, recipient agent, amount, reason

4. **Forfeited Commission Report**
   - All commissions forfeited to company
   - Agent, amount, reason, policy details

### 7.2 Audit Trail Requirements

Every compliance-related action must be logged with:
- Timestamp
- Agent involved
- Action taken
- Regulatory reference
- User/system that triggered the action

Logs must be:
- Immutable (no updates or deletes)
- Retained for minimum 6 years
- Exportable for regulatory examination

---

## 8. Integration Requirements

### 8.1 SmartOffice Integration

- Sync agent records including license status
- Sync policy data for commission calculation
- Push commission transactions back to SmartOffice (if supported)

### 8.2 License Verification

- Option to integrate with state insurance department databases
- Or manual license verification workflow with approval

---

## 9. Security Requirements

### 9.1 Row Level Security

- Agents can only view their own commission data and their downline's
- Compliance logs accessible to admins only
- Configuration changes require admin role

### 9.2 Audit Logging

- All configuration changes logged with user and timestamp
- All manual license status changes logged
- All commission approvals/payments logged

---

## 10. Testing Requirements

### 10.1 License Check Test Cases

| Scenario | Expected Result |
|----------|-----------------|
| Status=licensed, number=valid, expiration=future | Eligible |
| Status=licensed, number=null, expiration=future | NOT Eligible |
| Status=licensed, number=valid, expiration=past | NOT Eligible |
| Status=unlicensed, number=valid, expiration=future | NOT Eligible |
| Status=pending, number=null, expiration=null | NOT Eligible |
| Status=expired, number=valid, expiration=past | NOT Eligible |
| Status=suspended, number=valid, expiration=future | NOT Eligible |

### 10.2 Roll-Up Test Cases

| Hierarchy | Config | Expected |
|-----------|--------|----------|
| A(lic) → B(unlic) → C(lic) | roll_up | B's override goes to C |
| A(lic) → B(unlic) → C(unlic) → D(lic) | roll_up | B+C override goes to D |
| A(lic) → B(unlic) → C(unlic) | roll_up | B+C override to company (no lic upline) |
| A(lic) → B(unlic) → C(lic) | company_retains | B's override forfeited, C gets own override only |

### 10.3 Compliance Log Test Cases

- Verify log created for every unlicensed override
- Verify log contains correct regulatory reference
- Verify log is immutable (cannot be updated/deleted)

---

## 11. Legal Disclaimer

This PRD is designed to support compliance with insurance regulations but does not constitute legal advice.

**Before launching, Apex Affinity Group must:**

1. Have the compensation plan reviewed by an insurance regulatory attorney
2. Verify compliance with specific state requirements in all operating states
3. Confirm with carriers that the commission structure is acceptable
4. Consider filing for a formal regulatory opinion in Texas and other key states
5. Train all agents on the compensation plan and compliance requirements

---

## 12. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 15, 2026 | BotMakers Inc. | Initial release |

---

## 13. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Legal Counsel | | | |
| Compliance Officer | | | |
| Technical Lead | | | |