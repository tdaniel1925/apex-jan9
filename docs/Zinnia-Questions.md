# Questions for Zinnia SmartOffice Support

**Subject:** SmartIntegrator API Questions - Apex Affinity Group Certification

---

Hi Zinnia Support,

We are completing the SmartIntegrator API certification process for Apex Affinity Group. We have several questions about API capabilities to ensure we're using the correct objects and methods for our use cases.

## Our Use Cases

1. **Sync agents and policies** from SmartOffice to our agent portal
2. **Create new agent records** in SmartOffice when pre-licensed agents in our system become licensed
3. **Track policy status** so agents can see their submitted applications and issued policies
4. **Performance reporting** so managers can see their downline's production

---

## Questions

### 1. Policy Status and Dates

We need to track policy lifecycle status (submitted, underwriting, approved, issued, in-force, lapsed) and dates (issue date, effective date, submit date).

When we search the Policy object, we only receive these fields:
- PolicyNumber
- CarrierName
- HoldingType
- AnnualPremium

Requesting fields like `Status`, `IssueDate`, `EffectiveDate` returns "Property is not found" errors.

**Questions:**
- How do we retrieve policy status and dates?
- Is there a separate `Application` object for pending/submitted policies?
- Should we use a `Get` request instead of `Search` for full policy details?

---

### 2. Agent Hierarchy (Upline/Downline)

Managers in our system need to see their downline agents' policies and performance.

**Questions:**
- What is the recommended way to retrieve agent hierarchy relationships?
- Is this stored in the `Relation` object, or is there a property on Agent/Contact?
- How do we query "all agents under manager X"?

---

### 3. Creating New Agents

When a pre-licensed person in our system becomes licensed, we need to create their record in SmartOffice.

**Questions:**
- Should we create a `Contact` with `ClientType=7` (advisor), or is there an `Agent` insert operation?
- What are the required fields for creating a new agent/advisor?
- How do we link a new Contact to become an Agent?

---

### 4. Activity Tracking

We want to show agents their activity metrics (applications submitted, policies issued, premium volume).

**Questions:**
- What does the `Activity` object contain?
- Is there a way to query activities by agent and date range?
- Or should we calculate metrics from Policy data instead?

---

### 5. Commission History

We're using the `GetAdvisorCommission` method for commission data.

**Questions:**
- Can we filter commissions by date range?
- Is there a way to get historical commission data (not just current/pending)?

---

## Environment

- **Sandbox URL:** https://api.sandbox.smartofficecrm.com/3markapex/v1/send
- **Site:** SDC_UAT
- **User:** tdaniel

Thank you for your help! These answers will help us complete our certification submission correctly.

Best regards,
[Your Name]
Apex Affinity Group
[Your Email]
[Your Phone]
