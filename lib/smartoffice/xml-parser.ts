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
    // These elements should always be arrays when they appear at the search result level
    // Note: Contact is NOT an array - it's a nested single object within Agent
    // Policy and Agent can have multiple results, so they need to be arrays
    return ['Agent', 'Policy', 'CommPayable', 'WebAddress', 'Phone'].includes(name);
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
 * Get ID from object - handles both _id (from XML attributes) and id
 * The XML parser uses attributeNamePrefix: '_', so XML attributes become _attr
 */
function getId(obj: Record<string, unknown> | undefined): string {
  if (!obj) return '';
  // Check _id first (XML attribute), then id (in case it's an element)
  return (obj._id as string) || (obj.id as string) || '';
}

/**
 * Normalize agent response to standard format
 */
function normalizeAgent(agent: SmartOfficeAgentResponse): SmartOfficeAgent {
  // Contact is a single nested object within Agent
  const contact: SmartOfficeContactResponse = agent.Contact || ({} as SmartOfficeContactResponse);

  const agentObj = agent as unknown as Record<string, unknown>;
  const contactObj = contact as unknown as Record<string, unknown>;

  // Extract email from WebAddresses (WebAddressType = 1 is email)
  // WebAddresses may contain WebAddress array
  const webAddressesContainer = contact.WebAddresses;
  const webAddresses = webAddressesContainer
    ? normalizeArray(webAddressesContainer.WebAddress)
    : [];

  const emailAddress = webAddresses.find((wa: SmartOfficeWebAddressResponse) => {
    const waObj = wa as unknown as Record<string, unknown>;
    // Check various possible attribute names
    const waType = waObj.WebAddressType || waObj._WebAddressType || waObj['@_WebAddressType'];
    return waType === '1' || waType === 1;
  });

  // Also check if Address is nested or direct
  let email: string | null = null;
  if (emailAddress) {
    const addrObj = emailAddress as unknown as Record<string, unknown>;
    email = (addrObj.Address as string) || (addrObj._text as string) || null;
  }

  // Extract phone from Phones
  const phonesContainer = contact.Phones;
  const phones = phonesContainer ? normalizeArray(phonesContainer.Phone) : [];
  const primaryPhone = phones[0] as SmartOfficePhoneResponse | undefined;

  let phone: string | null = null;
  if (primaryPhone) {
    const areaCode = primaryPhone.AreaCode || '';
    const number = primaryPhone.Number || '';
    phone = `${areaCode}${number}`;
  }

  // Get direct properties or check for nested text
  const firstName = getTextValue(contact.FirstName) || '';
  const lastName = getTextValue(contact.LastName) || '';
  const taxId = getTextValue(contact.TaxID) || null;
  const clientType = getTextValue(contact.ClientType) || '0';
  const status = getTextValue(agent.Status) || '0';

  return {
    id: getId(agentObj),
    contactId: getId(contactObj),
    firstName,
    lastName,
    email,
    phone: phone && phone.length > 3 ? phone : null,
    taxId,
    clientType: parseInt(clientType, 10),
    status: parseInt(status, 10),
    hierarchyId: null, // TBD - needs to be discovered from API Dictionary
    rawData: agent,
  };
}

/**
 * Get text value from XML element (handles both direct string and {_text: string})
 */
function getTextValue(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    // Check for _text (fast-xml-parser text node)
    if (obj._text !== undefined) return String(obj._text);
    // Check for #text
    if (obj['#text'] !== undefined) return String(obj['#text']);
  }
  return null;
}

/**
 * Normalize policy response to standard format
 */
function normalizePolicy(policy: SmartOfficePolicyResponse): SmartOfficePolicy {
  const holdingType = parseInt(policy.HoldingType || '0', 10);
  const policyObj = policy as unknown as Record<string, unknown>;
  const primaryAdvisorObj = policy.PrimaryAdvisor as unknown as Record<string, unknown> | undefined;
  const writingAgentObj = policy.WritingAgent as unknown as Record<string, unknown> | undefined;
  const carrierObj = policy.Carrier as unknown as Record<string, unknown> | undefined;
  const productObj = policy.Product as unknown as Record<string, unknown> | undefined;

  // Get carrier name - from nested Carrier.Name or direct CarrierName
  let carrierName = policy.CarrierName || '';
  if (!carrierName && carrierObj) {
    carrierName = getTextValue(carrierObj.Name) || '';
  }

  // Get product name - from nested Product.Name or direct ProductName
  let productName = policy.ProductName || '';
  if (!productName && productObj) {
    productName = getTextValue(productObj.Name) || '';
  }

  return {
    id: getId(policyObj),
    policyNumber: getTextValue(policy.PolicyNumber) || '',
    carrierName,
    productName,
    holdingType,
    holdingTypeName: getHoldingTypeName(holdingType),
    annualPremium: parseFloat(getTextValue(policy.AnnualPremium) || '0'),
    status: getTextValue(policy.Status) || '',
    issueDate: getTextValue(policy.IssueDate) || null,
    effectiveDate: getTextValue(policy.EffectiveDate) || null,
    primaryAdvisorContactId: getId(primaryAdvisorObj) || null,
    writingAgentId: getId(writingAgentObj) || null,
    rawData: policy,
  };
}

/**
 * Normalize commission response to standard format
 */
function normalizeCommission(commission: SmartOfficeCommissionResponse): SmartOfficeCommission {
  const commissionObj = commission as unknown as Record<string, unknown>;

  return {
    id: getId(commissionObj),
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
