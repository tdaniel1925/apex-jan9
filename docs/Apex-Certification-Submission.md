# Certification Process for External Clients who are using SmartIntegrator

**Prepared For:** Zinnia SmartOffice CRM
**Client:** Apex Affinity Group
**Submission Date:** January 14, 2026
**Version:** 1.0

---

## Section 1: Operations Required

| # | Operation | Required | Notes |
|---|-----------|----------|-------|
| 1 | Insert | ☒ Yes | Create new agent/contact records when agents become licensed |
| 2 | Delete | ☐ No | |
| 3 | Update | ☒ Yes | Update agent contact information |
| 4 | Get | ☒ Yes | Retrieve full details for individual records |
| 5 | Search | ☒ Yes | Search for agents, policies, and related data |
| 6 | Sync | ☐ TBD | Please advise if needed for real-time updates |

---

## Section 2: SmartIntegrator Objects to be Accessed

| # | Object | Required | Purpose |
|---|--------|----------|---------|
| 1 | Contact | ☒ Yes | Agent contact information (name, email, phone) |
| 2 | Personal | ☒ Yes | Personal details for agents |
| 3 | Address | ☒ Yes | Agent addresses |
| 4 | Phone | ☒ Yes | Agent phone numbers |
| 5 | WebAddress | ☒ Yes | Agent email addresses |
| 6 | Relation | ☒ Yes | Agent hierarchy (upline/downline relationships) |
| 7 | Activity | ☒ Yes | Track agent activities and performance |
| 8 | Carrier | ☒ Yes | Insurance carrier information |
| 9 | Product | ☒ Yes | Insurance product information |
| 10 | Rider | ☐ No | |
| 11 | Policy | ☒ Yes | Policy data including status, dates, premium |
| 12 | InterestParty | ☐ No | |
| 13 | AcctMaster | ☐ No | |
| 14 | Position | ☐ No | |
| 15 | SmartPad | ☐ No | |
| 16 | Vendor | ☐ No | |
| 17 | Agent | ☒ Yes | Agent records (ClientType=7) |
| 18 | CommPayable | ☒ Yes | Commission data via GetAdvisorCommission method |

---

## Section 3: Do you need to access the insurance objects?

**Yes** - We need access to Policy objects to track:
- Policy status (submitted, underwriting, approved, issued, in-force)
- Issue dates and effective dates
- Premium amounts
- Writing agent information
- Carrier and product details

---

## Section 4: Use Case Description

Apex Affinity Group is building an agent back-office portal that integrates with SmartOffice CRM. Our use cases include:

### 4.1 One-Way Sync (SmartOffice → Apex)
- Sync existing agents from SmartOffice to our system
- Sync policy data to show agents their book of business
- Sync commission data for performance tracking
- Allow managers to see their downline's policies and production

### 4.2 Two-Way Sync (Apex → SmartOffice)
- When a pre-licensed agent in our system becomes licensed, create their record in SmartOffice
- Update agent contact information changes back to SmartOffice

### 4.3 Reporting & Performance
- Track policy statuses through the lifecycle
- Show agents their submitted applications and issued policies
- Provide upline managers visibility into downline performance
- Display commission earnings

---

## Section 5: Sample XML Requests

### 5.1 Pagination Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
    <keepsession>true</keepsession>
  </header>
  <search pagesize="100" searchid="" total="true">
    <object>
      <Agent>
        <Status/>
        <Contact>
          <LastName/>
          <FirstName/>
          <ClientType/>
          <TaxID/>
          <WebAddresses>
            <WebAddress>
              <Address/>
              <WebAddressType/>
            </WebAddress>
          </WebAddresses>
          <Phones>
            <Phone>
              <AreaCode/>
              <Number/>
              <PhoneType/>
            </Phone>
          </Phones>
        </Contact>
      </Agent>
    </object>
  </search>
</request>
```

**Pagination Handling:**
1. Initial request with `searchid=""` and `pagesize="100"`
2. Response includes `more="true"` and `searchid="[value]"` if more records exist
3. Subsequent requests include the returned `searchid` to get next page
4. Continue until `more="false"` is received

### 5.2 Agent Search Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <search>
    <object>
      <Agent>
        <Status/>
        <Contact>
          <LastName/>
          <FirstName/>
          <ClientType/>
          <TaxID/>
          <WebAddresses>
            <WebAddress>
              <Address/>
              <WebAddressType/>
            </WebAddress>
          </WebAddresses>
          <Phones>
            <Phone>
              <AreaCode/>
              <Number/>
              <PhoneType/>
            </Phone>
          </Phones>
        </Contact>
      </Agent>
    </object>
  </search>
</request>
```

### 5.3 Policy Search Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <search pagesize="100">
    <object>
      <Policy>
        <PolicyNumber/>
        <CarrierName/>
        <HoldingType/>
        <AnnualPremium/>
      </Policy>
    </object>
  </search>
</request>
```

### 5.4 Get Single Agent Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <get>
    <Agent id="Agent.90807498.180">
      <Status/>
      <Contact>
        <LastName/>
        <FirstName/>
        <ClientType/>
        <TaxID/>
        <WebAddresses>
          <WebAddress>
            <Address/>
            <WebAddressType/>
          </WebAddress>
        </WebAddresses>
        <Phones>
          <Phone>
            <AreaCode/>
            <Number/>
            <PhoneType/>
          </Phone>
        </Phones>
      </Contact>
    </Agent>
  </get>
</request>
```

### 5.5 Insert New Contact Request (for licensed agents)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <transaction>
    <insert>
      <Contact>
        <FirstName>John</FirstName>
        <LastName>Smith</LastName>
        <ClientType>7</ClientType>
        <TaxID>123-45-6789</TaxID>
        <WebAddresses>
          <WebAddress>
            <Address>john.smith@email.com</Address>
            <WebAddressType>1</WebAddressType>
          </WebAddress>
        </WebAddresses>
        <Phones>
          <Phone>
            <AreaCode>555</AreaCode>
            <Number>1234567</Number>
            <PhoneType>2</PhoneType>
          </Phone>
        </Phones>
      </Contact>
    </insert>
  </transaction>
</request>
```

### 5.6 Update Contact Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <transaction>
    <update>
      <Contact id="Contact.90807498.180">
        <FirstName>John</FirstName>
        <LastName>Smith</LastName>
      </Contact>
    </update>
  </transaction>
</request>
```

### 5.7 Get Advisor Commission Request

```xml
<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <method>
    <GetAdvisorCommission>
      <UserID>12345</UserID>
    </GetAdvisorCommission>
  </method>
</request>
```

---

## Section 6: Technical Contact

**Company:** Apex Affinity Group
**Contact Name:** [Your Name]
**Email:** [Your Email]
**Phone:** [Your Phone]

---

## Section 7: Questions for Zinnia

We have the following questions regarding API capabilities:

1. **Policy Status Field:** We need to track policy status (submitted, underwriting, approved, issued, in-force, lapsed). Is this available via the Policy object search, or is there a separate Application object we should use?

2. **Policy Dates:** How do we retrieve IssueDate, EffectiveDate, and SubmitDate for policies? Our search attempts returned "Property is not found" errors for these fields.

3. **Agent Hierarchy:** What is the recommended approach to retrieve upline/downline relationships? Is this via the Relation object or a property on the Agent/Contact?

4. **Commission Details:** Beyond GetAdvisorCommission method, is there a way to get historical commission data by date range?

5. **Activity Object:** What activity types are available for tracking agent performance (applications submitted, policies issued, etc.)?

---

*Submitted by Apex Affinity Group for SmartIntegrator API Certification*
