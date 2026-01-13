/**
 * SmartOffice API Explorer
 * POST - Execute a raw XML request against SmartOffice API
 *
 * This is a developer tool for testing and understanding the SmartOffice API.
 * Only accessible by admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, forbiddenResponse, badRequestResponse, serverErrorResponse } from '@/lib/auth/admin-auth';
import { getSmartOfficeClient } from '@/lib/smartoffice';

// Request schema
const explorerSchema = z.object({
  xml: z.string().min(1, 'XML request body is required'),
});

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return forbiddenResponse();

  try {
    const body = await request.json();
    const parseResult = explorerSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Invalid request', parseResult.error.flatten());
    }

    const { xml } = parseResult.data;
    const startTime = Date.now();

    // Get the SmartOffice client
    const client = await getSmartOfficeClient();

    // Send the raw XML request
    const response = await client.sendRawRequest(xml);

    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      requestXml: xml,
      responseXml: response.rawXml,
      parsedResponse: response.parsed,
      executionTime: endTime - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SmartOffice Explorer error:', error);
    return serverErrorResponse(error instanceof Error ? error.message : 'API request failed');
  }
}
