# Zinnia SmartOffice API - Scope Deviations

**Prepared For:** Zinnia SmartOffice CRM
**Client:** Apex Affinity Group
**Date:** January 15, 2026
**Reference:** Original Certification Submission (January 14, 2026)

---

## Executive Summary

After further analysis of our business requirements, we need to update our SmartIntegrator API scope. The key change is:

> **Apex is a display-only portal.** All payment processing (commissions, bonuses, overrides, payouts) happens in SmartOffice. Apex will display this data but not modify it.

This document outlines what we're **removing**, **keeping**, and **adding** to our original scope.

---

## Section 1: Operations Update

| Operation | Original | Revised | Notes |
|-----------|----------|---------|-------|
| **Insert** | ☒ Yes | ☒ Yes | Still needed - create agents when they become licensed |
| **Delete** | ☐ No | ☐ No | No change |
| **Update** | ☒ Yes | ☒ Yes | Still needed - sync contact info changes to SmartOffice |
| **Get** | ☒ Yes | ☒ Yes | No change |
| **Search** | ☒ Yes | ☒ Yes | No change - expanded scope (see below) |
| **Sync** | ☐ TBD | ☒ Yes | **NEW** - Need real-time or scheduled sync for commission data |

**Summary:** Operations remain largely the same. We still need Insert/Update for agent management.

---

## Section 2: Objects Update

| Object | Original | Revised | Notes |
|--------|----------|---------|-------|
| Contact | ☒ Yes | ☒ Yes | No change |
| Personal | ☒ Yes | ☒ Yes | No change |
| Address | ☒ Yes | ☒ Yes | No change |
| Phone | ☒ Yes | ☒ Yes | No change |
| WebAddress | ☒ Yes | ☒ Yes | No change |
| Relation | ☒ Yes | ☒ Yes | No change - still need hierarchy |
| Activity | ☒ Yes | ☒ Yes | No change |
| Carrier | ☒ Yes | ☒ Yes | No change |
| Product | ☒ Yes | ☒ Yes | No change |
| Rider | ☐ No | ☐ No | No change |
| Policy | ☒ Yes | ☒ Yes | No change |
| InterestParty | ☐ No | ☐ No | No change |
| AcctMaster | ☐ No | ☐ No | No change |
| Position | ☐ No | ☐ No | No change |
| SmartPad | ☐ No | ☐ No | No change |
| Vendor | ☐ No | ☐ No | No change |
| Agent | ☒ Yes | ☒ Yes | No change |
| CommPayable | ☒ Yes | ☒ Yes | **EXPANDED** - Need more fields (see below) |

---

## Section 3: New Data Requirements (ADDITIONS)

Since Apex displays payment data but doesn't process payments, we need **additional read access** to SmartOffice payment/commission data:

### 3.1 Commission Breakdown Details

We need access to commission components, not just totals:

| Data Point | Purpose |
|------------|---------|
| Base commission amount | Show agent their direct earnings |
| Override commission amount | Show upline their override earnings from downline |
| Bonus amounts | Show any bonus payments |
| Commission date/period | Group by pay period |
| Commission status | Pending, approved, paid, clawed back |
| Policy reference | Link commission to specific policy |
| Agent hierarchy level | Know which tier the commission applies to |

**Question for Zinnia:** Are these fields available via `GetAdvisorCommission` or another method?

### 3.2 Payout/Payment History

We need to display completed payment records:

| Data Point | Purpose |
|------------|---------|
| Payment date | When agent was paid |
| Payment amount | Total payment for period |
| Payment method | ACH, check, wire (if tracked) |
| Payment reference/ID | For agent records |
| Pay period reference | Link to pay period |

**Question for Zinnia:** Is there a payment history object or method we should access?

### 3.3 Pay Period Information

We need pay period status and totals for admin reporting:

| Data Point | Purpose |
|------------|---------|
| Pay period dates (start/end) | Display period range |
| Pay period status | Open, locked, processing, paid |
| Total commissions | Sum for the period |
| Total agents | Agents with earnings |
| Processing date | When period was processed |

**Question for Zinnia:** Is pay period data tracked as an object, or derived from commission dates?

### 3.4 Clawback Data

We need to display commission reversals:

| Data Point | Purpose |
|------------|---------|
| Original commission reference | What was clawed back |
| Clawback amount | How much was reversed |
| Clawback reason | Policy lapse, cancellation, etc. |
| Clawback date | When it occurred |
| Agent affected | Who had the clawback |

**Question for Zinnia:** How are clawbacks represented? Negative `CommPayable` records or separate object?

### 3.5 License Information (Optional)

If available, we'd like to display agent licensing data:

| Data Point | Purpose |
|------------|---------|
| License number | Display on agent profile |
| License state | Which state(s) licensed |
| License status | Active, expired, pending |
| License expiration date | Show alerts for renewals |
| License type | Life, health, etc. |

**Question for Zinnia:** Is licensing data stored in SmartOffice? If so, which object?

---

## Section 4: Use Case Updates

### 4.1 One-Way Sync (SmartOffice → Apex) - EXPANDED

**Original scope:**
- Sync agents, policies, commissions

**Revised scope (additions in bold):**
- Sync agents, policies, commissions
- **Sync commission breakdown (base, override, bonus components)**
- **Sync payout/payment history**
- **Sync pay period information**
- **Sync clawback records**
- **Sync license information (if available)**

### 4.2 Two-Way Sync (Apex → SmartOffice) - NO CHANGE

- Create agent records when pre-licensed agents become licensed
- Update agent contact information

### 4.3 Display-Only Admin Portal - NEW USE CASE

Apex corporate admin portal will display (read-only):

| Admin View | Data Source |
|------------|-------------|
| Commission history | SmartOffice CommPayable data |
| Payout history | SmartOffice payment records |
| Pay period status | SmartOffice pay period data |
| Bonus records | SmartOffice commission data (bonus type) |
| Override details | SmartOffice commission data (override type) |
| Clawback history | SmartOffice clawback records |
| Agent licensing status | SmartOffice license data |

**Key clarification:** Apex will NOT process payments. No approve/reject workflows. No payment execution. All payment processing occurs in SmartOffice.

---

## Section 5: Updated Questions for Zinnia

In addition to our original questions, we have these new questions:

### Commission Data Structure

1. **Commission components:** Does `GetAdvisorCommission` return separate fields for base commission, override commission, and bonuses? Or is this a single total?

2. **Commission breakdown by hierarchy:** Can we see which commissions are direct (policy the agent wrote) vs override (from downline agents)?

3. **Commission status:** Is there a status field (pending, approved, paid, clawed back)?

4. **Historical commissions:** Can we query commissions by date range? (e.g., "all commissions from 2025-01-01 to 2025-12-31")

### Payment/Payout Data

5. **Payment history:** Is there an object or method to retrieve payment records (when agents were actually paid)?

6. **Payment details:** Do payment records include method (ACH, check, wire) and reference numbers?

### Pay Periods

7. **Pay period object:** Is pay period data tracked as a separate object, or do we derive it from commission dates?

8. **Pay period status:** Can we determine if a pay period is open, locked, processing, or completed?

### Clawbacks

9. **Clawback representation:** Are clawbacks represented as negative `CommPayable` records, or is there a separate object?

10. **Clawback linkage:** Can we link a clawback to the original commission that was reversed?

### Licensing (Optional)

11. **License data:** Is licensing information stored in SmartOffice? If so, which object and fields?

12. **License sync:** Can we query license status, expiration dates, and licensed states?

---

## Section 6: Summary of Changes

| Category | Change Type | Description |
|----------|-------------|-------------|
| Operations | No change | Keep Insert, Update, Get, Search |
| Objects | Expanded | CommPayable needs more detail |
| Sync Direction | Clarified | Primarily one-way (SmartOffice → Apex) for payment data |
| New Data | Added | Commission breakdown, payout history, pay periods, clawbacks |
| Use Case | Clarified | Apex is display-only for payment data |
| New Questions | Added | 12 questions about commission/payment data structure |

---

## Section 7: Technical Contact

**Company:** Apex Affinity Group
**Contact Name:** [Your Name]
**Email:** [Your Email]
**Phone:** [Your Phone]

---

*This document supplements our original Certification Submission dated January 14, 2026.*
