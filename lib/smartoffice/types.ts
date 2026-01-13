/**
 * SmartOffice Integration Types
 * Types for SmartOffice CRM API data and sync operations
 */

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Raw SmartOffice Agent from API
 * Example ID: "Agent.90807498.180"
 */
export interface SmartOfficeAgentResponse {
  _type: 'obj';
  id: string;
  Status?: string; // "1" for active
  Contact?: SmartOfficeContactResponse;
}

/**
 * Raw SmartOffice Contact from API
 * Example ID: "Contact.90807498.180"
 */
export interface SmartOfficeContactResponse {
  _type: 'obj';
  id: string;
  LastName?: string;
  FirstName?: string;
  ClientType?: string; // "7" for advisor
  TaxID?: string;
  WebAddresses?: {
    WebAddress?: SmartOfficeWebAddressResponse | SmartOfficeWebAddressResponse[];
  };
  Phones?: {
    Phone?: SmartOfficePhoneResponse | SmartOfficePhoneResponse[];
  };
}

export interface SmartOfficeWebAddressResponse {
  _type: 'obj';
  id: string;
  Address?: string;
  WebAddressType?: string; // "1" for email
}

export interface SmartOfficePhoneResponse {
  _type: 'obj';
  id: string;
  AreaCode?: string;
  Number?: string;
  PhoneType?: string;
}

/**
 * Raw SmartOffice Policy from API
 * Example ID: "Policy.90807498.109252919"
 */
export interface SmartOfficePolicyResponse {
  _type: 'obj';
  id: string;
  PolicyNumber?: string;
  CarrierName?: string;
  HoldingType?: string; // "1" = Life, "3" = other
  AnnualPremium?: string;
  PrimaryAdvisor?: {
    _type: 'obj';
    id: string; // Contact ID reference
  };
}

/**
 * Raw SmartOffice Commission Payable from API
 * Example ID: "CommPayable.1.11"
 */
export interface SmartOfficeCommissionResponse {
  _type: 'obj';
  id: string;
  CurrentRole?: string;
  PolicyNo?: string;
  Receivable?: string;
  PayableDueDate?: string;
  PaidAmt?: string;
  Status?: string;
  CommType?: string;
  ComponentPrem?: string;
  ReceivablePerc?: string;
  ReceivablePercOf?: string;
}

// ============================================
// NORMALIZED TYPES (After Parsing)
// ============================================

/**
 * Normalized SmartOffice Agent
 */
export interface SmartOfficeAgent {
  id: string; // SmartOffice Agent ID
  contactId: string; // SmartOffice Contact ID
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  clientType: number; // 7 = advisor
  status: number; // 1 = active
  hierarchyId: string | null; // Parent agent ID (TBD from API Dictionary)
  rawData: SmartOfficeAgentResponse;
}

/**
 * Normalized SmartOffice Policy
 */
export interface SmartOfficePolicy {
  id: string; // SmartOffice Policy ID
  policyNumber: string;
  carrierName: string;
  holdingType: number;
  holdingTypeName: string;
  annualPremium: number;
  primaryAdvisorContactId: string | null;
  rawData: SmartOfficePolicyResponse;
}

/**
 * Normalized SmartOffice Commission
 */
export interface SmartOfficeCommission {
  id: string; // SmartOffice CommPayable ID
  policyNumber: string;
  currentRole: string;
  receivable: number;
  payableDueDate: string | null;
  paidAmount: number;
  status: string;
  commType: string;
  componentPremium: number;
  receivablePercent: number;
  receivablePercentOf: string;
  rawData: SmartOfficeCommissionResponse;
}

// ============================================
// DATABASE TYPES (Supabase Tables)
// ============================================

/**
 * SmartOffice Sync Config (DB Row)
 */
export interface SmartOfficeSyncConfig {
  id: string;
  api_url: string;
  sitename: string;
  username: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  sync_frequency_hours: number;
  last_sync_at: string | null;
  next_sync_at: string | null;
  webhook_secret: string | null;
  webhook_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SmartOfficeSyncConfigInsert {
  api_url?: string;
  sitename: string;
  username: string;
  api_key: string;
  api_secret: string;
  is_active?: boolean;
  sync_frequency_hours?: number;
  webhook_secret?: string | null;
  webhook_enabled?: boolean;
}

export type SmartOfficeSyncConfigUpdate = Partial<SmartOfficeSyncConfigInsert>;

/**
 * SmartOffice Agent (DB Row)
 */
export interface SmartOfficeAgentRow {
  id: string;
  smartoffice_id: string;
  contact_id: string | null;
  apex_agent_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  client_type: number | null;
  status: number | null;
  hierarchy_id: string | null;
  raw_data: SmartOfficeAgentResponse | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SmartOfficeAgentRowInsert {
  smartoffice_id: string;
  contact_id?: string | null;
  apex_agent_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  tax_id?: string | null;
  client_type?: number | null;
  status?: number | null;
  hierarchy_id?: string | null;
  raw_data?: SmartOfficeAgentResponse | null;
}

export type SmartOfficeAgentRowUpdate = Partial<SmartOfficeAgentRowInsert>;

/**
 * SmartOffice Commission (DB Row)
 */
export interface SmartOfficeCommissionRow {
  id: string;
  smartoffice_id: string;
  smartoffice_agent_id: string;
  apex_commission_id: string | null;
  policy_number: string;
  current_role: string | null;
  receivable: number;
  payable_due_date: string | null;
  paid_amount: number;
  status: string | null;
  comm_type: string | null;
  component_premium: number | null;
  receivable_percent: number | null;
  receivable_percent_of: string | null;
  raw_data: SmartOfficeCommissionResponse | null;
  synced_at: string;
  created_at: string;
}

export interface SmartOfficeCommissionRowInsert {
  smartoffice_id: string;
  smartoffice_agent_id: string;
  apex_commission_id?: string | null;
  policy_number: string;
  current_role?: string | null;
  receivable?: number;
  payable_due_date?: string | null;
  paid_amount?: number;
  status?: string | null;
  comm_type?: string | null;
  component_premium?: number | null;
  receivable_percent?: number | null;
  receivable_percent_of?: string | null;
  raw_data?: SmartOfficeCommissionResponse | null;
}

/**
 * SmartOffice Policy (DB Row)
 */
export interface SmartOfficePolicyRow {
  id: string;
  smartoffice_id: string;
  smartoffice_agent_id: string | null;
  primary_advisor_contact_id: string | null;
  policy_number: string;
  carrier_name: string | null;
  holding_type: number | null;
  holding_type_name: string | null;
  annual_premium: number | null;
  raw_data: SmartOfficePolicyResponse | null;
  synced_at: string;
  created_at: string;
}

export interface SmartOfficePolicyRowInsert {
  smartoffice_id: string;
  smartoffice_agent_id?: string | null;
  primary_advisor_contact_id?: string | null;
  policy_number: string;
  carrier_name?: string | null;
  holding_type?: number | null;
  holding_type_name?: string | null;
  annual_premium?: number | null;
  raw_data?: SmartOfficePolicyResponse | null;
}

/**
 * SmartOffice Sync Log (DB Row)
 */
export type SmartOfficeSyncType = 'full' | 'incremental' | 'webhook' | 'manual';
export type SmartOfficeSyncStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SmartOfficeSyncLog {
  id: string;
  sync_type: SmartOfficeSyncType;
  status: SmartOfficeSyncStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  agents_synced: number;
  agents_created: number;
  agents_updated: number;
  commissions_synced: number;
  commissions_created: number;
  policies_synced: number;
  policies_created: number;
  errors: SyncError[];
  error_count: number;
  triggered_by: string | null;
  triggered_by_user_id: string | null;
}

export interface SmartOfficeSyncLogInsert {
  sync_type: SmartOfficeSyncType;
  status?: SmartOfficeSyncStatus;
  triggered_by?: string | null;
  triggered_by_user_id?: string | null;
}

export interface SyncError {
  type: string;
  message: string;
  entity?: string;
  entityId?: string;
  timestamp: string;
}

// ============================================
// SYNC OPERATION TYPES
// ============================================

export interface SyncResult {
  agents: {
    synced: number;
    created: number;
    updated: number;
    errors: SyncError[];
  };
  commissions: {
    synced: number;
    created: number;
    errors: SyncError[];
  };
  policies: {
    synced: number;
    created: number;
    errors: SyncError[];
  };
  duration_ms: number;
  log_id: string;
}

export interface AgentMappingResult {
  mapped: number;
  unmatched: string[];
  errors: SyncError[];
}

// ============================================
// API CLIENT TYPES
// ============================================

export interface SmartOfficeClientConfig {
  apiUrl: string;
  sitename: string;
  username: string;
  apiKey: string;
  apiSecret: string;
}

export interface SearchCondition {
  property: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'starts' | 'contains' | 'in';
  value: string | number | string[];
}

export interface SearchOptions {
  pageSize?: number;
  page?: number;
  keepSession?: boolean;
  searchId?: string;
}

export interface SmartOfficeSearchResult<T> {
  items: T[];
  total: number;
  more: boolean;
  searchId?: string;
  page?: number;
}

export interface SmartOfficeAPIError {
  code: string;
  message: string;
}

export interface SmartOfficeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: SmartOfficeAPIError;
  status: string;
  systime: string;
}

// ============================================
// HOLDING TYPE MAPPINGS
// ============================================

export const HOLDING_TYPE_NAMES: Record<number, string> = {
  1: 'Life Insurance',
  2: 'Annuity',
  3: 'Health Insurance',
  4: 'Disability Insurance',
  5: 'Long Term Care',
  6: 'Investment',
};

export function getHoldingTypeName(holdingType: number): string {
  return HOLDING_TYPE_NAMES[holdingType] || 'Unknown';
}
