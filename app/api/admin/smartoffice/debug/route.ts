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
      parserDebug = {
        total: policyResult.total,
        more: policyResult.more,
        itemCount: policyResult.items.length,
        firstItemRaw: policyResult.items[0]?.rawData || null,
      };
    } else {
      const agentResult = parseAgentSearchResult(result.parsed);
      parsedItems = agentResult.items;

      // Debug info to understand the parsing
      const firstAgent = agentResult.items[0];
      parserDebug = {
        total: agentResult.total,
        more: agentResult.more,
        itemCount: agentResult.items.length,
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
        firstAgentRaw: firstAgent?.rawData || null,
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
