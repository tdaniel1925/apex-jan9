/**
 * SmartOffice Sample Requests Library
 * GET - Get pre-built sample XML requests
 *
 * This is a developer tool with working examples for SmartOffice API.
 * Only accessible by admins.
 */

import { NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse } from '@/lib/auth/admin-auth';

// Pre-built sample requests that work with SmartOffice API
const SAMPLE_REQUESTS = [
  {
    id: 'test-connection',
    name: 'Test Connection',
    category: 'Basics',
    description: 'Test if your credentials work by getting server time',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <method>
    <GetSystemTime/>
  </method>
</request>`,
    notes: 'Should return systime if connection works',
  },
  {
    id: 'search-agents',
    name: 'Search All Agents',
    category: 'Agents',
    description: 'Get a paginated list of all agents/advisors (ClientType=7)',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
    <keepsession>true</keepsession>
  </header>
  <search pagesize="10">
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
    <condition>
      <eq>
        <Contact.ClientType/>
        <value>7</value>
      </eq>
    </condition>
  </search>
</request>`,
    notes: 'ClientType=7 means advisor. Use keepsession for pagination.',
  },
  {
    id: 'search-agent-by-email',
    name: 'Find Agent by Email',
    category: 'Agents',
    description: 'Search for a specific agent by their email address',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <search pagesize="1">
    <object>
      <Agent>
        <Status/>
        <Contact>
          <LastName/>
          <FirstName/>
          <ClientType/>
          <WebAddresses>
            <WebAddress>
              <Address/>
              <WebAddressType/>
            </WebAddress>
          </WebAddresses>
        </Contact>
      </Agent>
    </object>
    <condition>
      <eq>
        <Contact.WebAddresses.WebAddress.Address/>
        <value>example@email.com</value>
      </eq>
    </condition>
  </search>
</request>`,
    notes: 'Replace example@email.com with the actual email to search',
  },
  {
    id: 'get-agent-by-id',
    name: 'Get Agent by ID',
    category: 'Agents',
    description: 'Retrieve a specific agent by their SmartOffice ID',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <get>
    <object>
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
    </object>
  </get>
</request>`,
    notes: 'Replace Agent.90807498.180 with the actual agent ID',
  },
  {
    id: 'search-policies',
    name: 'Search All Policies',
    category: 'Policies',
    description: 'Get a paginated list of all policies',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
    <keepsession>true</keepsession>
  </header>
  <search pagesize="10">
    <object>
      <Policy>
        <PolicyNumber/>
        <CarrierName/>
        <HoldingType/>
        <AnnualPremium/>
        <PrimaryAdvisor/>
      </Policy>
    </object>
    <condition>
      <neq>
        <PolicyNumber/>
        <value>INVALID</value>
      </neq>
    </condition>
  </search>
</request>`,
    notes: 'HoldingType: 1=Life, 3=Other. PrimaryAdvisor returns Contact ID.',
  },
  {
    id: 'get-commissions',
    name: 'Get Advisor Commissions',
    category: 'Commissions',
    description: 'Get commission payables for a specific user ID',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <method>
    <GetAdvisorCommission>
      <UserID>USER_ID_HERE</UserID>
    </GetAdvisorCommission>
  </method>
</request>`,
    notes: 'Replace USER_ID_HERE with the actual User ID (not Agent ID)',
  },
  {
    id: 'update-contact',
    name: 'Update Contact Info',
    category: 'Updates',
    description: 'Update a contact\'s first and last name',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <update>
    <object>
      <Contact id="Contact.90807498.180">
        <FirstName>NewFirstName</FirstName>
        <LastName>NewLastName</LastName>
      </Contact>
    </object>
  </update>
</request>`,
    notes: 'Replace Contact ID and names. This enables two-way sync.',
  },
  {
    id: 'pagination-next-page',
    name: 'Pagination - Next Page',
    category: 'Advanced',
    description: 'Get the next page of results using searchid',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
    <keepsession>true</keepsession>
  </header>
  <search pagesize="10" page="2" searchid="SEARCH_ID_HERE">
    <object>
      <Agent>
        <Status/>
        <Contact>
          <LastName/>
          <FirstName/>
        </Contact>
      </Agent>
    </object>
  </search>
</request>`,
    notes: 'Replace SEARCH_ID_HERE with the searchid from previous response. Increment page number.',
  },
];

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  // Group samples by category
  const categories = [...new Set(SAMPLE_REQUESTS.map((s) => s.category))];
  const grouped = categories.reduce(
    (acc, category) => {
      acc[category] = SAMPLE_REQUESTS.filter((s) => s.category === category);
      return acc;
    },
    {} as Record<string, typeof SAMPLE_REQUESTS>
  );

  return NextResponse.json({
    samples: SAMPLE_REQUESTS,
    grouped,
    categories,
    usage: {
      steps: [
        '1. Copy a sample XML request',
        '2. Go to API Explorer tab',
        '3. Paste the XML and modify as needed',
        '4. Click "Execute" to send the request',
        '5. View the response and understand the structure',
      ],
      tips: [
        'Start with "Test Connection" to verify credentials work',
        'Use pagesize and keepsession for large datasets',
        'Replace placeholder values (like IDs, emails) with real data',
        'Check the notes for each sample for important details',
      ],
    },
  });
}
