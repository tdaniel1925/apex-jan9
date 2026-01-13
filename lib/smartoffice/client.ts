/**
 * SmartOffice API Client
 * Lazy-loaded client for SmartOffice CRM API
 */

import type {
  SmartOfficeClientConfig,
  SmartOfficeResponse,
  SmartOfficeAgent,
  SmartOfficePolicy,
  SmartOfficeCommission,
  SmartOfficeSearchResult,
  SearchOptions,
  SmartOfficeSyncConfig,
} from './types';
import {
  buildSearchAgentsRequest,
  buildGetAgentRequest,
  buildSearchPoliciesRequest,
  buildGetAdvisorCommissionRequest,
  buildSearchRequest,
  buildGetRequest,
  buildUpdateRequest,
} from './xml-builder';
import {
  parseSmartOfficeXML,
  parseAgentSearchResult,
  parseAgentGetResult,
  parsePolicySearchResult,
  parseCommissionMethodResult,
} from './xml-parser';
import { createUntypedAdminClient } from '@/lib/db/supabase-server';

// Singleton client instance (lazy-loaded)
let clientInstance: SmartOfficeClient | null = null;

/**
 * Get or create the SmartOffice client instance
 */
export async function getSmartOfficeClient(): Promise<SmartOfficeClient> {
  if (!clientInstance) {
    const config = await getSmartOfficeConfig();
    if (!config) {
      throw new Error('SmartOffice is not configured. Please set up credentials in admin settings.');
    }
    clientInstance = new SmartOfficeClient({
      apiUrl: config.api_url,
      sitename: config.sitename,
      username: config.username,
      apiKey: config.api_key,
      apiSecret: config.api_secret,
    });
  }
  return clientInstance;
}

/**
 * Reset the client instance (e.g., after config change)
 */
export function resetSmartOfficeClient(): void {
  clientInstance = null;
}

/**
 * Get SmartOffice config from database
 */
async function getSmartOfficeConfig(): Promise<SmartOfficeSyncConfig | null> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from('smartoffice_sync_config')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SmartOfficeSyncConfig;
}

/**
 * SmartOffice API Client
 */
export class SmartOfficeClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: SmartOfficeClientConfig) {
    this.baseUrl = config.apiUrl;
    this.headers = {
      'Content-Type': 'application/xml',
      sitename: config.sitename,
      username: config.username,
      'api-key': config.apiKey,
      'api-secret': config.apiSecret,
    };
  }

  /**
   * Send raw XML request to SmartOffice
   */
  async sendRequest<T = unknown>(xml: string): Promise<SmartOfficeResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: xml,
      });

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `HTTP error: ${response.statusText}`,
          },
          status: 'error',
          systime: new Date().toISOString(),
        };
      }

      const text = await response.text();
      return parseSmartOfficeXML<T>(text);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
        status: 'error',
        systime: new Date().toISOString(),
      };
    }
  }

  /**
   * Send raw XML request and return both raw XML and parsed response
   * Used by the API Explorer tool
   */
  async sendRawRequest(xml: string): Promise<{ rawXml: string; parsed: SmartOfficeResponse }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: xml,
      });

      if (!response.ok) {
        return {
          rawXml: `HTTP Error: ${response.status} ${response.statusText}`,
          parsed: {
            success: false,
            error: {
              code: `HTTP_${response.status}`,
              message: `HTTP error: ${response.statusText}`,
            },
            status: 'error',
            systime: new Date().toISOString(),
          },
        };
      }

      const rawXml = await response.text();
      const parsed = parseSmartOfficeXML(rawXml);

      return { rawXml, parsed };
    } catch (error) {
      return {
        rawXml: `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        parsed: {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: error instanceof Error ? error.message : 'Network request failed',
          },
          status: 'error',
          systime: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Test connection to SmartOffice
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  <header>
    <office/>
    <user/>
    <password/>
  </header>
  <method>
    <GetSystemTime/>
  </method>
</request>`;

    const response = await this.sendRequest(xml);

    if (response.success) {
      return { success: true, message: `Connected. Server time: ${response.systime}` };
    }

    return {
      success: false,
      message: response.error?.message || 'Connection failed',
    };
  }

  // ============================================
  // AGENT OPERATIONS
  // ============================================

  /**
   * Search for agents (advisors with ClientType = 7)
   */
  async searchAgents(options?: SearchOptions): Promise<SmartOfficeSearchResult<SmartOfficeAgent>> {
    const xml = buildSearchAgentsRequest(options);
    const response = await this.sendRequest(xml);
    return parseAgentSearchResult(response);
  }

  /**
   * Get all agents (paginated)
   */
  async getAllAgents(pageSize = 100): Promise<SmartOfficeAgent[]> {
    const agents: SmartOfficeAgent[] = [];
    let searchId: string | undefined;
    let more = true;
    let page = 0;

    while (more) {
      const result = await this.searchAgents({
        pageSize,
        keepSession: true,
        searchId,
        page: page > 0 ? page : undefined,
      });

      agents.push(...result.items);
      more = result.more;
      searchId = result.searchId;
      page++;

      // Safety limit
      if (page > 100) {
        console.warn('SmartOffice: Hit 100 page limit for agent search');
        break;
      }
    }

    return agents;
  }

  /**
   * Get a single agent by ID
   */
  async getAgent(agentId: string): Promise<SmartOfficeAgent | null> {
    const xml = buildGetAgentRequest(agentId);
    const response = await this.sendRequest(xml);
    return parseAgentGetResult(response);
  }

  /**
   * Search agents by email
   */
  async findAgentByEmail(email: string): Promise<SmartOfficeAgent | null> {
    const xml = buildSearchRequest({
      object: 'Agent',
      properties: ['Status'],
      nestedProperties: {
        Contact: ['LastName', 'FirstName', 'ClientType', 'TaxID'],
        'Contact/WebAddresses/WebAddress': ['Address', 'WebAddressType'],
        'Contact/Phones/Phone': ['AreaCode', 'Number', 'PhoneType'],
      },
      condition: { property: 'Contact.WebAddresses.WebAddress.Address', operator: 'eq', value: email },
      options: { pageSize: 1 },
    });

    const response = await this.sendRequest(xml);
    const result = parseAgentSearchResult(response);
    return result.items[0] || null;
  }

  // ============================================
  // POLICY OPERATIONS
  // ============================================

  /**
   * Search for policies
   */
  async searchPolicies(options?: SearchOptions): Promise<SmartOfficeSearchResult<SmartOfficePolicy>> {
    const xml = buildSearchPoliciesRequest(options);
    const response = await this.sendRequest(xml);
    return parsePolicySearchResult(response);
  }

  /**
   * Get all policies (paginated)
   */
  async getAllPolicies(pageSize = 100): Promise<SmartOfficePolicy[]> {
    const policies: SmartOfficePolicy[] = [];
    let searchId: string | undefined;
    let more = true;
    let page = 0;

    while (more) {
      const result = await this.searchPolicies({
        pageSize,
        keepSession: true,
        searchId,
        page: page > 0 ? page : undefined,
      });

      policies.push(...result.items);
      more = result.more;
      searchId = result.searchId;
      page++;

      // Safety limit
      if (page > 100) {
        console.warn('SmartOffice: Hit 100 page limit for policy search');
        break;
      }
    }

    return policies;
  }

  // ============================================
  // COMMISSION OPERATIONS
  // ============================================

  /**
   * Get commissions for a user (requires User ID, not Agent ID)
   */
  async getAdvisorCommissions(userId: string): Promise<SmartOfficeCommission[]> {
    const xml = buildGetAdvisorCommissionRequest(userId);
    const response = await this.sendRequest(xml);
    return parseCommissionMethodResult(response);
  }

  // ============================================
  // UPDATE OPERATIONS (Two-way sync)
  // ============================================

  /**
   * Update an agent's contact information in SmartOffice
   */
  async updateAgentContact(
    contactId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  ): Promise<SmartOfficeResponse> {
    const properties: Record<string, string | number | null> = {};

    if (data.firstName) properties.FirstName = data.firstName;
    if (data.lastName) properties.LastName = data.lastName;

    // Phone update requires nested Phone object
    const nestedObjects: Record<string, Record<string, string | number | null>> | undefined = data.phone
      ? {
          PreferredPhone: {
            AreaCode: data.phone.substring(0, 3),
            Number: data.phone.substring(3),
          },
        }
      : undefined;

    const xml = buildUpdateRequest({
      object: 'Contact',
      id: contactId,
      properties,
      nestedObjects,
    });

    return this.sendRequest(xml);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a one-time client for testing (doesn't use singleton)
 */
export function createSmartOfficeClient(config: SmartOfficeClientConfig): SmartOfficeClient {
  return new SmartOfficeClient(config);
}

/**
 * Test SmartOffice credentials
 */
export async function testSmartOfficeCredentials(config: SmartOfficeClientConfig): Promise<{
  success: boolean;
  message: string;
}> {
  const client = createSmartOfficeClient(config);
  return client.testConnection();
}
