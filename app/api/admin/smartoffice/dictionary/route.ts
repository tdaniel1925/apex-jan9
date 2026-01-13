/**
 * SmartOffice Object Dictionary Browser
 * GET - Get known objects and their properties
 * POST - Discover properties for an object by testing
 *
 * This is a developer tool for understanding SmartOffice API structure.
 * Only accessible by admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { getSmartOfficeClient } from '@/lib/smartoffice';

// Known SmartOffice objects and their discovered properties
const KNOWN_OBJECTS = {
  Agent: {
    description: 'Insurance agents/advisors in SmartOffice',
    properties: {
      confirmed: ['Status'],
      nested: {
        Contact: ['LastName', 'FirstName', 'ClientType', 'TaxID'],
        'Contact/WebAddresses/WebAddress': ['Address', 'WebAddressType'],
        'Contact/Phones/Phone': ['AreaCode', 'Number', 'PhoneType'],
      },
      notFound: ['WritingNo', 'NPN', 'ParentAgent', 'UplineAgentId', 'SponsorId', 'RecruitedBy', 'User', 'Office'],
    },
    notes: [
      'ClientType = 7 indicates an advisor (agent)',
      'WebAddressType = 1 is email',
      'Hierarchy/sponsor field not yet discovered - check API Dictionary in SmartOffice UI',
    ],
  },
  Contact: {
    description: 'Contact records (clients, prospects, agents)',
    properties: {
      confirmed: ['LastName', 'FirstName', 'ClientType', 'TaxID'],
      nested: {
        'WebAddresses/WebAddress': ['Address', 'WebAddressType'],
        'Phones/Phone': ['AreaCode', 'Number', 'PhoneType'],
      },
      notFound: ['ReferredByContact', 'PrimaryAdvisorId', 'RecruiterAgentId', 'KeyRelations'],
    },
    notes: [
      'ClientType values: 1=Individual, 2=Business, 7=Advisor, etc.',
      'WebAddressType: 1=Email, 2=Website, 3=Social',
    ],
  },
  Policy: {
    description: 'Insurance policies',
    properties: {
      confirmed: ['PolicyNumber', 'CarrierName', 'HoldingType', 'AnnualPremium', 'PrimaryAdvisor'],
      nested: {},
      notFound: ['Status', 'EffectiveDate', 'Advisors', 'ProductName'],
    },
    notes: [
      'HoldingType: 1=Life, 3=Other',
      'PrimaryAdvisor returns a Contact ID reference',
    ],
  },
  CommPayable: {
    description: 'Commission payable records (via GetAdvisorCommission method)',
    properties: {
      confirmed: [
        'CurrentRole', 'PolicyNo', 'Receivable', 'PayableDueDate',
        'PaidAmt', 'Status', 'CommType', 'ComponentPrem',
        'ReceivablePerc', 'ReceivablePercOf',
      ],
      nested: {},
      notFound: [],
    },
    notes: [
      'Accessed via GetAdvisorCommission method, not direct search',
      'Requires User ID, not Agent ID',
    ],
  },
};

// Request schema for property discovery
const discoverSchema = z.object({
  object: z.string().min(1, 'Object name is required'),
  property: z.string().min(1, 'Property name is required'),
});

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  return NextResponse.json({
    objects: KNOWN_OBJECTS,
    notes: [
      'These properties were discovered through API testing',
      'Properties marked as "notFound" returned error 4001 when queried',
      'For full object schema, check SmartOffice UI > Setup > API Dictionary',
    ],
    lastUpdated: '2026-01-12',
  });
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = discoverSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid request', parseResult.error.flatten());
    }

    const { object, property } = parseResult.data;

    // Build a test search request for this property
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <search pagesize="1">
    <object>
      <${object}>
        <${property}/>
      </${object}>
    </object>
    <condition>
      <neq>
        <${property}/>
        <value>NONEXISTENT_VALUE_12345</value>
      </neq>
    </condition>
  </search>
</request>`;

    const client = await getSmartOfficeClient();
    const response = await client.sendRawRequest(xml);

    // Check if property exists based on response
    const hasError = response.parsed.error?.code === '4001';
    const exists = !hasError && response.parsed.success;

    return NextResponse.json({
      object,
      property,
      exists,
      errorCode: response.parsed.error?.code,
      errorMessage: response.parsed.error?.message,
      rawResponse: response.rawXml,
      recommendation: hasError
        ? `Property "${property}" does not exist on ${object} (or requires different access path)`
        : exists
          ? `Property "${property}" exists on ${object} and can be queried`
          : 'Unable to determine - check raw response',
    });
  } catch (error) {
    console.error('SmartOffice Dictionary error:', error);
    return serverErrorResponse(error instanceof Error ? error.message : 'Discovery failed');
  }
}
