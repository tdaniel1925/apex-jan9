/**
 * SmartOffice XML Response Parser
 * Parses XML responses from SmartOffice API
 */

import { XMLParser } from 'fast-xml-parser';
import type {
  SmartOfficeResponse,
  SmartOfficeAPIError,
  SmartOfficeAgentResponse,
  SmartOfficeContactResponse,
  SmartOfficePolicyResponse,
  SmartOfficeCommissionResponse,
  SmartOfficeAgent,
  SmartOfficePolicy,
  SmartOfficeCommission,
  SmartOfficeSearchResult,
  SmartOfficeWebAddressResponse,
  SmartOfficePhoneResponse,
} from './types';
import { getHoldingTypeName } from './types';

// Configure XML parser
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '_',
  textNodeName: '_text',
  isArray: (name) => {
    // These elements should always be arrays
    return ['Agent', 'Contact', 'Policy', 'CommPayable', 'WebAddress', 'Phone'].includes(name);
  },
});

/**
 * Parse raw XML response from SmartOffice
 */
export function parseSmartOfficeXML<T = unknown>(xml: string): SmartOfficeResponse<T> {
  try {
    const parsed = parser.parse(xml);

    if (!parsed.response) {
      return {
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Invalid XML response: no response element' },
        status: 'error',
        systime: new Date().toISOString(),
      };
    }

    const response = parsed.response;
    const status = response._status || 'unknown';
    const systime = response._systime || new Date().toISOString();

    // Check for errors
    if (status === 'error' || response.error) {
      const error = extractError(response);
      return {
        success: false,
        error,
        status,
        systime,
      };
    }

    // Extract data based on operation type
    let data: T | undefined;

    if (response.search) {
      data = response.search as T;
    } else if (response.get) {
      data = response.get as T;
    } else if (response.method) {
      data = response.method as T;
    } else if (response.insert) {
      data = response.insert as T;
    } else if (response.update) {
      data = response.update as T;
    }

    return {
      success: true,
      data,
      status,
      systime,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: `Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      status: 'error',
      systime: new Date().toISOString(),
    };
  }
}

/**
 * Extract error from response
 */
function extractError(response: Record<string, unknown>): SmartOfficeAPIError {
  // Check for error in various locations
  const searchObj = response.search as Record<string, unknown> | undefined;
  const getObj = response.get as Record<string, unknown> | undefined;
  const methodObj = response.method as Record<string, unknown> | undefined;

  const errorLocations = [
    response.error,
    searchObj?.error,
    getObj?.error,
    methodObj?.error,
  ];

  for (const errorData of errorLocations) {
    if (errorData) {
      if (typeof errorData === 'string') {
        return { code: 'UNKNOWN', message: errorData };
      }
      if (typeof errorData === 'object') {
        const err = errorData as { _code?: string; _text?: string; '#text'?: string };
        return {
          code: err._code || 'UNKNOWN',
          message: err._text || err['#text'] || 'Unknown error',
        };
      }
    }
  }

  return { code: 'UNKNOWN', message: 'Unknown error occurred' };
}

/**
 * Parse search results for agents
 */
export function parseAgentSearchResult(response: SmartOfficeResponse): SmartOfficeSearchResult<SmartOfficeAgent> {
  if (!response.success || !response.data) {
    return { items: [], total: 0, more: false };
  }

  const searchData = response.data as {
    _total?: string;
    _more?: string;
    _searchid?: string;
    _page?: string;
    Agent?: SmartOfficeAgentResponse | SmartOfficeAgentResponse[];
  };

  const agents = normalizeArray(searchData.Agent);
  const items = agents.map(normalizeAgent);

  return {
    items,
    total: parseInt(searchData._total || '0', 10),
    more: searchData._more === 'true',
    searchId: searchData._searchid,
    page: searchData._page ? parseInt(searchData._page, 10) : undefined,
  };
}

/**
 * Parse a single agent from get response
 */
export function parseAgentGetResult(response: SmartOfficeResponse): SmartOfficeAgent | null {
  if (!response.success || !response.data) {
    return null;
  }

  const getData = response.data as {
    Agent?: SmartOfficeAgentResponse | SmartOfficeAgentResponse[];
  };

  const agents = normalizeArray(getData.Agent);
  if (agents.length === 0) {
    return null;
  }

  return normalizeAgent(agents[0]);
}

/**
 * Parse search results for policies
 */
export function parsePolicySearchResult(response: SmartOfficeResponse): SmartOfficeSearchResult<SmartOfficePolicy> {
  if (!response.success || !response.data) {
    return { items: [], total: 0, more: false };
  }

  const searchData = response.data as {
    _total?: string;
    _more?: string;
    _searchid?: string;
    Policy?: SmartOfficePolicyResponse | SmartOfficePolicyResponse[];
  };

  const policies = normalizeArray(searchData.Policy);
  const items = policies.map(normalizePolicy);

  return {
    items,
    total: parseInt(searchData._total || '0', 10),
    more: searchData._more === 'true',
    searchId: searchData._searchid,
  };
}

/**
 * Parse GetAdvisorCommission method result
 */
export function parseCommissionMethodResult(response: SmartOfficeResponse): SmartOfficeCommission[] {
  if (!response.success || !response.data) {
    return [];
  }

  const methodData = response.data as {
    GetAdvisorCommission?: {
      Contact?: {
        CommPayables?: {
          CommPayable?: SmartOfficeCommissionResponse | SmartOfficeCommissionResponse[];
        };
      };
    };
  };

  const contact = methodData.GetAdvisorCommission?.Contact;
  if (!contact?.CommPayables) {
    return [];
  }

  const commissions = normalizeArray(contact.CommPayables.CommPayable);
  return commissions.map(normalizeCommission);
}

// ============================================
// NORMALIZATION HELPERS
// ============================================

/**
 * Ensure value is always an array
 */
function normalizeArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Normalize agent response to standard format
 */
function normalizeAgent(agent: SmartOfficeAgentResponse): SmartOfficeAgent {
  const contact = agent.Contact || ({} as SmartOfficeContactResponse);

  // Extract email from WebAddresses (WebAddressType = 1)
  const webAddresses = normalizeArray(contact.WebAddresses?.WebAddress);
  const emailAddress = webAddresses.find((wa: SmartOfficeWebAddressResponse) => wa.WebAddressType === '1');
  const email = emailAddress?.Address || null;

  // Extract phone from Phones
  const phones = normalizeArray(contact.Phones?.Phone);
  const primaryPhone = phones[0] as SmartOfficePhoneResponse | undefined;
  const phone = primaryPhone ? `${primaryPhone.AreaCode || ''}${primaryPhone.Number || ''}` : null;

  return {
    id: agent.id,
    contactId: contact.id || '',
    firstName: contact.FirstName || '',
    lastName: contact.LastName || '',
    email,
    phone: phone && phone.length > 3 ? phone : null,
    taxId: contact.TaxID || null,
    clientType: parseInt(contact.ClientType || '0', 10),
    status: parseInt(agent.Status || '0', 10),
    hierarchyId: null, // TBD - needs to be discovered from API Dictionary
    rawData: agent,
  };
}

/**
 * Normalize policy response to standard format
 */
function normalizePolicy(policy: SmartOfficePolicyResponse): SmartOfficePolicy {
  const holdingType = parseInt(policy.HoldingType || '0', 10);

  return {
    id: policy.id,
    policyNumber: policy.PolicyNumber || '',
    carrierName: policy.CarrierName || '',
    holdingType,
    holdingTypeName: getHoldingTypeName(holdingType),
    annualPremium: parseFloat(policy.AnnualPremium || '0'),
    primaryAdvisorContactId: policy.PrimaryAdvisor?.id || null,
    rawData: policy,
  };
}

/**
 * Normalize commission response to standard format
 */
function normalizeCommission(commission: SmartOfficeCommissionResponse): SmartOfficeCommission {
  return {
    id: commission.id,
    policyNumber: commission.PolicyNo || '',
    currentRole: commission.CurrentRole || '',
    receivable: parseFloat(commission.Receivable || '0'),
    payableDueDate: commission.PayableDueDate || null,
    paidAmount: parseFloat(commission.PaidAmt || '0'),
    status: commission.Status || '',
    commType: commission.CommType || '',
    componentPremium: parseFloat(commission.ComponentPrem || '0'),
    receivablePercent: parseFloat(commission.ReceivablePerc || '0'),
    receivablePercentOf: commission.ReceivablePercOf || '',
    rawData: commission,
  };
}
