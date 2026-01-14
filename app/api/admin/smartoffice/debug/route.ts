/**
 * SmartOffice Debug API
 * GET - Test SmartOffice connection and show raw response structure
 * Query params:
 *  - type: 'agents' (default) | 'policies' | 'raw'
 *  - count: number of records to fetch (default 1)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { getSmartOfficeClient } from '@/lib/smartoffice';
import { buildSearchAgentsRequest, buildSearchPoliciesRequest } from '@/lib/smartoffice/xml-builder';
import { parseAgentSearchResult, parsePolicySearchResult } from '@/lib/smartoffice/xml-parser';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await getSmartOfficeClient();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'agents';
    const count = parseInt(searchParams.get('count') || '1', 10);

    let xml: string;
    if (type === 'policies') {
      xml = buildSearchPoliciesRequest({ pageSize: count });
    } else {
      xml = buildSearchAgentsRequest({ pageSize: count });
    }

    // Send raw request and get back both raw XML and parsed
    const result = await client.sendRawRequest(xml);

    // Also run through our parser to see what we extract
    let parsedItems: unknown = null;
    let parserDebug: Record<string, unknown> = {};

    if (type === 'policies') {
      const policyResult = parsePolicySearchResult(result.parsed);
      parsedItems = policyResult.items;

      const firstPolicy = policyResult.items[0];
      parserDebug = {
        total: policyResult.total,
        more: policyResult.more,
        itemCount: policyResult.items.length,
        firstPolicy: firstPolicy ? {
          id: firstPolicy.id,
          policyNumber: firstPolicy.policyNumber,
          carrierName: firstPolicy.carrierName,
          productName: firstPolicy.productName,
          holdingType: firstPolicy.holdingType,
          annualPremium: firstPolicy.annualPremium,
          status: firstPolicy.status,
          issueDate: firstPolicy.issueDate,
          effectiveDate: firstPolicy.effectiveDate,
          primaryAdvisorContactId: firstPolicy.primaryAdvisorContactId,
          writingAgentId: firstPolicy.writingAgentId,
        } : null,
        firstPolicyRaw: firstPolicy?.rawData || null,
        // Show the raw search data structure for debugging
        searchDataKeys: result.parsed?.data ? Object.keys(result.parsed.data as object) : [],
        searchDataSample: result.parsed?.data || null,
      };
    } else {
      const agentResult = parseAgentSearchResult(result.parsed);
      parsedItems = agentResult.items;

      // Debug info to understand the parsing
      const firstAgent = agentResult.items[0];

      // Deep dive into raw data structure
      const rawAgent = firstAgent?.rawData;
      const rawContact = rawAgent?.Contact;

      // Analyze ALL agents to see if Contact is present
      const agentContactAnalysis = agentResult.items.slice(0, 5).map((agent, idx) => {
        const raw = agent.rawData as Record<string, unknown> | undefined;
        const contact = raw?.Contact as Record<string, unknown> | undefined;
        return {
          index: idx,
          id: agent.id,
          hasContact: !!contact,
          contactKeys: contact ? Object.keys(contact) : [],
          firstName: agent.firstName || null,
          lastName: agent.lastName || null,
          clientType: agent.clientType,
          status: agent.status,
        };
      });

      parserDebug = {
        total: agentResult.total,
        more: agentResult.more,
        itemCount: agentResult.items.length,
        // Show analysis of first 5 agents to spot pattern
        agentContactAnalysis,
        // Parsed/normalized agent
        firstAgent: firstAgent ? {
          id: firstAgent.id,
          contactId: firstAgent.contactId,
          firstName: firstAgent.firstName,
          lastName: firstAgent.lastName,
          email: firstAgent.email,
          phone: firstAgent.phone,
          taxId: firstAgent.taxId,
          clientType: firstAgent.clientType,
          status: firstAgent.status,
        } : null,
        // Raw agent from API (after XML parse)
        firstAgentRaw: rawAgent || null,
        // Contact structure analysis
        contactAnalysis: rawContact ? {
          hasContact: true,
          contactKeys: Object.keys(rawContact),
          firstName: rawContact.FirstName,
          firstNameType: typeof rawContact.FirstName,
          lastName: rawContact.LastName,
          lastNameType: typeof rawContact.LastName,
          taxId: rawContact.TaxID,
          clientType: rawContact.ClientType,
          hasWebAddresses: !!rawContact.WebAddresses,
          webAddressesKeys: rawContact.WebAddresses ? Object.keys(rawContact.WebAddresses) : [],
          hasPhones: !!rawContact.Phones,
          phonesKeys: rawContact.Phones ? Object.keys(rawContact.Phones) : [],
        } : {
          hasContact: false,
          reason: 'Contact property is missing or undefined in raw agent',
        },
        // Show the raw search data structure for debugging
        searchDataKeys: result.parsed?.data ? Object.keys(result.parsed.data as object) : [],
      };
    }

    return NextResponse.json({
      success: true,
      type,
      requestXml: xml,
      responseXml: result.rawXml,
      parsedResponse: result.parsed,
      extractedItems: parsedItems,
      parserDebug,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
