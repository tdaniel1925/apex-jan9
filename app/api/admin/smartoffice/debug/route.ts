/**
 * SmartOffice Debug API
 * GET - Test SmartOffice connection and show raw response structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { getSmartOfficeClient } from '@/lib/smartoffice';
import { buildSearchAgentsRequest } from '@/lib/smartoffice/xml-builder';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await getSmartOfficeClient();

    // Build request for just 1 agent to see structure
    const xml = buildSearchAgentsRequest({ pageSize: 1 });

    // Send raw request and get back both raw XML and parsed
    const result = await client.sendRawRequest(xml);

    return NextResponse.json({
      success: true,
      requestXml: xml,
      responseXml: result.rawXml,
      parsedResponse: result.parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
