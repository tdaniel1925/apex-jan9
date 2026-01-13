/**
 * SmartOffice XML Request Builder
 * Builds XML request bodies for SmartOffice API
 */

import type { SearchCondition, SearchOptions } from './types';

/**
 * Build the standard XML header
 */
function buildHeader(keepSession = false): string {
  return `
    <header>
      <office/>
      <user/>
      <password/>
      ${keepSession ? '<keepsession>true</keepsession>' : ''}
    </header>
  `;
}

/**
 * Build a search condition expression
 */
function buildConditionExpr(condition: SearchCondition): string {
  const { property, operator, value } = condition;

  if (operator === 'in' && Array.isArray(value)) {
    // IN operator: multiple values
    const values = value.map((v) => `<v>${escapeXml(String(v))}</v>`).join('\n');
    return `
      <expr prop="${property}" op="in">
        ${values}
      </expr>
    `;
  }

  return `
    <expr prop="${property}" op="${operator}">
      <v>${escapeXml(String(value))}</v>
    </expr>
  `;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a search request XML
 */
export function buildSearchRequest(params: {
  object: string;
  properties: string[];
  nestedProperties?: Record<string, string[]>;
  condition: SearchCondition;
  options?: SearchOptions;
}): string {
  const { object, properties, nestedProperties, condition, options } = params;

  // Build property elements
  let propertiesXml = properties.map((p) => `<${p}/>`).join('\n            ');

  // Build nested property elements (e.g., Contact > WebAddresses)
  if (nestedProperties) {
    for (const [parent, children] of Object.entries(nestedProperties)) {
      const childrenXml = children.map((c) => `<${c}/>`).join('\n              ');
      propertiesXml += `
            <${parent}>
              ${childrenXml}
            </${parent}>`;
    }
  }

  // Build search attributes
  const searchAttrs: string[] = [];
  if (options?.pageSize) {
    searchAttrs.push(`pagesize="${options.pageSize}"`);
  }
  if (options?.searchId) {
    searchAttrs.push(`searchid="${options.searchId}"`);
  }
  if (options?.page !== undefined) {
    searchAttrs.push(`page="${options.page}"`);
  }

  const searchAttrStr = searchAttrs.length > 0 ? ' ' + searchAttrs.join(' ') : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  ${buildHeader(options?.keepSession)}
  <search${searchAttrStr}>
    <object>
      <${object}>
        ${propertiesXml}
      </${object}>
    </object>
    <condition>
      ${buildConditionExpr(condition)}
    </condition>
  </search>
</request>`;
}

/**
 * Build a get request XML (fetch single object by ID)
 */
export function buildGetRequest(params: {
  object: string;
  id: string;
  properties: string[];
  nestedProperties?: Record<string, string[]>;
}): string {
  const { object, id, properties, nestedProperties } = params;

  // Build property elements
  let propertiesXml = properties.map((p) => `<${p}/>`).join('\n        ');

  // Build nested property elements
  if (nestedProperties) {
    for (const [parent, children] of Object.entries(nestedProperties)) {
      const childrenXml = children.map((c) => `<${c}/>`).join('\n          ');
      propertiesXml += `
        <${parent}>
          ${childrenXml}
        </${parent}>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  ${buildHeader()}
  <get>
    <${object} id="${id}">
      ${propertiesXml}
    </${object}>
  </get>
</request>`;
}

/**
 * Build a method request XML (call SmartOffice method)
 */
export function buildMethodRequest(params: {
  method: string;
  parameters: Record<string, string | number>;
}): string {
  const { method, parameters } = params;

  const paramsXml = Object.entries(parameters)
    .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
    .join('\n        ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  ${buildHeader()}
  <method>
    <${method}>
      ${paramsXml}
    </${method}>
  </method>
</request>`;
}

/**
 * Build an update request XML
 */
export function buildUpdateRequest(params: {
  object: string;
  id: string;
  properties: Record<string, string | number | null>;
  nestedObjects?: Record<string, Record<string, string | number | null>>;
}): string {
  const { object, id, properties, nestedObjects } = params;

  // Build property elements (only non-null values)
  const propertiesXml = Object.entries(properties)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
    .join('\n        ');

  // Build nested object elements
  let nestedXml = '';
  if (nestedObjects) {
    for (const [parent, children] of Object.entries(nestedObjects)) {
      const childrenXml = Object.entries(children)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
        .join('\n          ');
      nestedXml += `
        <${parent}>
          ${childrenXml}
        </${parent}>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  ${buildHeader()}
  <transaction>
    <update>
      <${object} id="${id}">
        ${propertiesXml}
        ${nestedXml}
      </${object}>
    </update>
  </transaction>
</request>`;
}

/**
 * Build an insert request XML
 */
export function buildInsertRequest(params: {
  object: string;
  properties: Record<string, string | number | null>;
  nestedObjects?: Record<string, Record<string, string | number | null>>;
}): string {
  const { object, properties, nestedObjects } = params;

  // Build property elements (only non-null values)
  const propertiesXml = Object.entries(properties)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
    .join('\n        ');

  // Build nested object elements
  let nestedXml = '';
  if (nestedObjects) {
    for (const [parent, children] of Object.entries(nestedObjects)) {
      const childrenXml = Object.entries(children)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
        .join('\n          ');
      nestedXml += `
        <${parent}>
          ${childrenXml}
        </${parent}>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<request version="1.0">
  ${buildHeader()}
  <transaction>
    <insert>
      <${object}>
        ${propertiesXml}
        ${nestedXml}
      </${object}>
    </insert>
  </transaction>
</request>`;
}

// ============================================
// PRE-BUILT REQUESTS FOR COMMON OPERATIONS
// ============================================

/**
 * Build search request for agents (ClientType = 7)
 */
export function buildSearchAgentsRequest(options?: SearchOptions): string {
  return buildSearchRequest({
    object: 'Agent',
    properties: ['Status'],
    nestedProperties: {
      Contact: [
        'LastName',
        'FirstName',
        'ClientType',
        'TaxID',
      ],
      'Contact/WebAddresses/WebAddress': ['Address', 'WebAddressType'],
      'Contact/Phones/Phone': ['AreaCode', 'Number', 'PhoneType'],
    },
    condition: { property: 'Contact.ClientType', operator: 'eq', value: '7' },
    options,
  });
}

/**
 * Build get request for a single agent
 */
export function buildGetAgentRequest(agentId: string): string {
  return buildGetRequest({
    object: 'Agent',
    id: agentId,
    properties: ['Status'],
    nestedProperties: {
      Contact: [
        'LastName',
        'FirstName',
        'ClientType',
        'TaxID',
      ],
      'Contact/WebAddresses/WebAddress': ['Address', 'WebAddressType'],
      'Contact/Phones/Phone': ['AreaCode', 'Number', 'PhoneType'],
    },
  });
}

/**
 * Build search request for policies
 */
export function buildSearchPoliciesRequest(options?: SearchOptions): string {
  return buildSearchRequest({
    object: 'Policy',
    properties: ['PolicyNumber', 'CarrierName', 'HoldingType', 'AnnualPremium', 'PrimaryAdvisor'],
    condition: { property: 'PolicyNumber', operator: 'ne', value: '' },
    options,
  });
}

/**
 * Build GetAdvisorCommission method request
 */
export function buildGetAdvisorCommissionRequest(userId: string): string {
  return buildMethodRequest({
    method: 'GetAdvisorCommission',
    parameters: { UserID: userId },
  });
}
