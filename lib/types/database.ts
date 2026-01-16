/**
 * Database Types
 * Type definitions matching Supabase schema
 */

import { Rank } from '../config/ranks';
import { Carrier } from '../config/carriers';

// ============================================
// LICENSE STATUS (Commission Compliance)
// ============================================
export type LicenseStatus = 'licensed' | 'unlicensed' | 'pending' | 'expired' | 'suspended';

// ============================================
// AGENTS
// ============================================
export interface Agent {
  id: string;
  user_id: string;
  sponsor_id: string | null;
  agent_code: string;

  // Profile
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  calendar_link: string | null;

  // Rank & Status
  rank: Rank;
  status: 'pending' | 'active' | 'inactive' | 'terminated';
  licensed_date: string | null;
  is_licensed_agent: boolean; // Whether they're a licensed insurance professional

  // License Compliance (NEW - for commission roll-up)
  license_status: LicenseStatus;
  license_number: string | null;
  license_state: string | null; // Two-letter state code
  license_expiration_date: string | null;

  // Metrics (computed/cached)
  premium_90_days: number;
  persistency_rate: number;
  placement_rate: number;
  active_agents_count: number;
  personal_recruits_count: number;
  mgas_in_downline: number;

  // Bonus Volume Tracking (NEW)
  personal_bonus_volume: number; // PBV - agent's own retail sales BV (lifetime)
  organization_bonus_volume: number; // OBV - entire downline BV (lifetime)
  pbv_90_days: number; // PBV in last 90 days (for rank qualification)
  obv_90_days: number; // OBV in last 90 days (for rank qualification)

  // AI Copilot
  ai_copilot_tier: 'none' | 'basic' | 'pro' | 'agency';
  ai_copilot_subscribed_at: string | null;

  // Replicated Site
  username: string;
  replicated_site_enabled: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  fast_start_ends_at: string; // 90 days from created_at
}

// Insert type - most fields have database defaults, so only a few are required
export interface AgentInsert {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  agent_code: string;
  sponsor_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  calendar_link?: string | null;
  rank?: Rank;
  status?: 'pending' | 'active' | 'inactive' | 'terminated';
  licensed_date?: string | null;
  is_licensed_agent?: boolean;
  // License Compliance (optional on insert)
  license_status?: LicenseStatus;
  license_number?: string | null;
  license_state?: string | null;
  license_expiration_date?: string | null;
  // Metrics
  premium_90_days?: number;
  persistency_rate?: number;
  placement_rate?: number;
  active_agents_count?: number;
  personal_recruits_count?: number;
  mgas_in_downline?: number;
  ai_copilot_tier?: 'none' | 'basic' | 'pro' | 'agency';
  ai_copilot_subscribed_at?: string | null;
  replicated_site_enabled?: boolean;
  fast_start_ends_at?: string;
}

export type AgentUpdate = Partial<AgentInsert>;

// ============================================
// MATRIX POSITIONS (5x7)
// ============================================
export interface MatrixPosition {
  id: string;
  agent_id: string;
  parent_id: string | null;
  position: number; // 1-5 within parent
  level: number; // 0-6 (0 = root)
  path: string; // Materialized path for fast queries
  created_at: string;
}

// ============================================
// COMMISSIONS (Multi-Source)
// ============================================
export type CommissionSource = 'retail' | 'smart_office' | 'manual_import';

export interface Commission {
  id: string;
  agent_id: string;
  carrier: Carrier | 'retail'; // Add 'retail' as a carrier type
  policy_number: string;
  premium_amount: number;
  commission_rate: number;
  commission_amount: number;
  policy_date: string;
  status: 'pending' | 'paid' | 'reversed';

  // NEW: Multi-source fields
  source: CommissionSource;
  product_id?: string | null; // For retail commissions
  order_id?: string | null; // For retail commissions
  bonus_volume?: number; // BV for commission calculations
  external_reference?: string | null; // Smart Office policy ID

  created_at: string;
  updated_at: string;
}

export type CommissionInsert = Omit<Commission, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// OVERRIDES (6-Generation with Roll-Up Support)
// ============================================
export type RollUpReason = 'upline_unlicensed' | 'upline_license_expired' | 'upline_license_suspended' | 'company_policy';

export interface Override {
  id: string;
  commission_id: string;
  agent_id: string; // Agent receiving override
  source_agent_id: string; // Agent who made sale
  generation: number; // 1-6 for direct, can traverse up to 7 for roll-up
  override_rate: number;
  override_amount: number;
  status: 'pending' | 'paid' | 'reversed';
  // Roll-up tracking fields (NEW)
  is_rolled_up: boolean;
  roll_up_reason: RollUpReason | null;
  original_agent_id: string | null; // The unlicensed agent whose override was rolled up
  rolled_up_from_generation: number | null; // Original generation level before roll-up
  compliance_log_id: string | null; // Reference to compliance_logs entry
  notes: string | null;
  created_at: string;
}

export type OverrideInsert = Omit<Override, 'id' | 'created_at'>;
export type OverrideUpdate = Partial<OverrideInsert>;

// ============================================
// BONUSES
// ============================================
export type BonusType =
  | 'fast_start'
  | 'fast_start_sponsor'
  | 'rank_advancement'
  | 'ai_copilot_personal'
  | 'ai_copilot_referral'
  | 'ai_copilot_team'
  | 'matching'
  | 'car'
  | 'leadership_pool'
  | 'contest';

export interface Bonus {
  id: string;
  agent_id: string;
  bonus_type: BonusType;
  amount: number;
  description: string;
  reference_id: string | null; // Related entity (commission, agent, etc.)
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payout_date: string | null;
  created_at: string;
  updated_at: string;
}

export type BonusInsert = Omit<Bonus, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// WALLET
// ============================================
export interface WalletTransaction {
  id: string;
  agent_id: string;
  type: 'credit' | 'debit';
  category: 'commission' | 'override' | 'bonus' | 'withdrawal' | 'adjustment';
  amount: number;
  balance_after: number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export type WalletTransactionInsert = Omit<WalletTransaction, 'id' | 'created_at'>;

export interface Wallet {
  id: string;
  agent_id: string;
  balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  updated_at: string;
}

// ============================================
// PAYOUTS
// ============================================
export interface Payout {
  id: string;
  agent_id: string;
  amount: number;
  method: 'ach' | 'wire' | 'check';
  fee: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  processed_at: string | null;
  created_at: string;
  // Enhanced fields
  admin_id: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  tracking_number: string | null;
  wire_reference: string | null;
  ach_trace_number: string | null;
  approved_at: string | null;
  rejected_at: string | null;
}

export type PayoutInsert = Omit<Payout, 'id' | 'created_at' | 'admin_id' | 'admin_notes' | 'rejection_reason' | 'tracking_number' | 'wire_reference' | 'ach_trace_number' | 'approved_at' | 'rejected_at'>;

// ============================================
// AGENT BANKING INFO
// ============================================
export type BankAccountType = 'checking' | 'savings';
export type BankAccountStatus = 'pending' | 'verified' | 'failed';

export interface AgentBankingInfo {
  id: string;
  agent_id: string;

  // ACH Details
  bank_name: string | null;
  account_holder_name: string | null;
  account_type: BankAccountType;
  routing_number: string | null;
  account_number_last4: string | null;
  account_number_encrypted: string | null;

  // Verification
  verification_status: BankAccountStatus;
  verified_at: string | null;
  verification_attempts: number;

  // Mailing Address (for checks/wires)
  mailing_address_line1: string | null;
  mailing_address_line2: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_zip: string | null;
  mailing_country: string;

  created_at: string;
  updated_at: string;
}

export interface AgentBankingInfoInsert {
  agent_id: string;
  bank_name?: string | null;
  account_holder_name?: string | null;
  account_type?: BankAccountType;
  routing_number?: string | null;
  account_number_last4?: string | null;
  account_number_encrypted?: string | null;
  verification_status?: BankAccountStatus;
  mailing_address_line1?: string | null;
  mailing_address_line2?: string | null;
  mailing_city?: string | null;
  mailing_state?: string | null;
  mailing_zip?: string | null;
  mailing_country?: string;
}

export type AgentBankingInfoUpdate = Partial<AgentBankingInfoInsert>;

// ============================================
// WITHDRAWAL LIMITS
// ============================================
export interface WithdrawalLimits {
  id: string;
  agent_id: string | null;
  rank: string | null;
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  per_transaction_limit: number;
  min_account_age_days: number;
  first_withdrawal_hold_hours: number;
  max_withdrawals_per_day: number;
  max_withdrawals_per_week: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// WITHDRAWAL AUDIT LOG
// ============================================
export interface WithdrawalAuditLog {
  id: string;
  payout_id: string;
  agent_id: string;
  admin_id: string | null;
  action: 'requested' | 'approved' | 'rejected' | 'processed' | 'cancelled';
  previous_status: Payout['status'] | null;
  new_status: Payout['status'] | null;
  notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// CRM - CONTACTS
// ============================================
export type ContactType = 'lead' | 'customer' | 'recruit';
export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface Contact {
  id: string;
  agent_id: string;
  type: ContactType;

  // Basic Info
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;

  // Pipeline
  stage: PipelineStage;
  source: string | null;

  // Additional
  notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;

  // Lead Nurturing (Agent Recruitment System)
  lead_score: number;
  email_sequence_id: string | null;
  email_sequence_started_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_follow_up_at' | 'lead_score' | 'email_sequence_id' | 'email_sequence_started_at'> & {
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  lead_score?: number;
  email_sequence_id?: string | null;
  email_sequence_started_at?: string | null;
};
export type ContactUpdate = Partial<ContactInsert>;

// ============================================
// TRAINING
// ============================================
export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'onboarding' | 'products' | 'sales' | 'recruiting' | 'compliance';
  order: number;
  is_required: boolean;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'pdf' | 'quiz' | 'text';
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number;
  order: number;
  created_at: string;
}

export interface CourseProgress {
  id: string;
  agent_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  quiz_score: number | null;
  created_at: string;
}

// ============================================
// RANK HISTORY
// ============================================
export interface RankHistory {
  id: string;
  agent_id: string;
  previous_rank: Rank | null;
  new_rank: Rank;
  reason: string;
  created_at: string;
}

// ============================================
// PRODUCTS (Digital Products)
// ============================================
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;

  // Pricing
  price: number;
  bonus_volume: number;

  // Categorization
  category: string;
  tags: string[] | null;

  // Digital Asset
  digital_asset_url: string | null;
  download_limit: number;

  // Images
  image_url: string | null;
  thumbnail_url: string | null;

  // Status
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;

  // SEO
  meta_title: string | null;
  meta_description: string | null;

  // Stats
  total_sales: number;
  total_revenue: number;

  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'total_sales' | 'total_revenue'>;
export type ProductUpdate = Partial<ProductInsert>;

// ============================================
// ORDERS (E-Commerce)
// ============================================
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed';

export interface Order {
  id: string;
  agent_id: string; // Selling agent
  user_id: string; // Buyer user ID
  total_amount: number;
  total_bonus_volume: number;
  status: OrderStatus;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type OrderUpdate = Partial<OrderInsert>;

// ============================================
// ORDER ITEMS
// ============================================
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  bonus_volume: number;
  downloads_remaining: number; // -1 = unlimited
  created_at: string;
}

export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at'>;

// ============================================
// EMAIL SEQUENCES (Nurturing Campaigns)
// ============================================
export type EmailSequenceTrigger = 'lead_capture' | 'signup' | 'copilot_trial' | 'manual';

export interface EmailSequence {
  id: string;
  name: string;
  description: string | null;
  trigger_type: EmailSequenceTrigger;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EmailSequenceInsert = Omit<EmailSequence, 'id' | 'created_at' | 'updated_at'>;
export type EmailSequenceUpdate = Partial<EmailSequenceInsert>;

// ============================================
// EMAIL SEQUENCE STEPS
// ============================================
export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  subject: string;
  body_html: string;
  body_text: string | null;
  delay_days: number;
  delay_hours: number;
  is_active: boolean;
  created_at: string;
}

export type EmailSequenceStepInsert = Omit<EmailSequenceStep, 'id' | 'created_at'>;
export type EmailSequenceStepUpdate = Partial<EmailSequenceStepInsert>;

// ============================================
// LEAD EMAIL QUEUE (Scheduled Emails)
// ============================================
export type EmailQueueStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface LeadEmailQueue {
  id: string;
  contact_id: string;
  sequence_step_id: string;
  scheduled_for: string;
  sent_at: string | null;
  status: EmailQueueStatus;
  error_message: string | null;
  resend_message_id: string | null;
  created_at: string;
}

export type LeadEmailQueueInsert = Omit<LeadEmailQueue, 'id' | 'created_at' | 'sent_at' | 'error_message' | 'resend_message_id'>;
export type LeadEmailQueueUpdate = Partial<Omit<LeadEmailQueue, 'id' | 'created_at'>>;

// ============================================
// LEAD ACTIVITIES (Engagement Tracking)
// ============================================
export type LeadActivityType =
  | 'email_sent'
  | 'email_open'
  | 'email_click'
  | 'page_view'
  | 'form_submit'
  | 'copilot_demo'
  | 'copilot_message';

export interface LeadActivity {
  id: string;
  contact_id: string;
  activity_type: LeadActivityType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type LeadActivityInsert = Omit<LeadActivity, 'id' | 'created_at'>;

// ============================================
// COPILOT USAGE (Daily Message Limits)
// ============================================
export interface CopilotUsage {
  id: string;
  agent_id: string;
  date: string; // YYYY-MM-DD
  messages_used: number;
}

export type CopilotUsageInsert = Omit<CopilotUsage, 'id'>;
export type CopilotUsageUpdate = Pick<CopilotUsage, 'messages_used'>;

// ============================================
// COPILOT SUBSCRIPTIONS (Stripe Integration)
// ============================================
export type CopilotTier = 'basic' | 'pro' | 'agency';
export type CopilotSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';

export interface CopilotSubscription {
  id: string;
  agent_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  tier: CopilotTier;
  bonus_volume: number;
  price_cents: number;
  status: CopilotSubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type CopilotSubscriptionInsert = Omit<CopilotSubscription, 'id' | 'created_at' | 'updated_at'>;
export type CopilotSubscriptionUpdate = Partial<CopilotSubscriptionInsert>;

// ============================================
// COPILOT TIER CONFIG
// ============================================
export const COPILOT_TIERS = {
  trial: { price_cents: 0, bonus_volume: 0, messages_per_day: 5 },
  basic: { price_cents: 2900, bonus_volume: 20, messages_per_day: 50 },
  pro: { price_cents: 7900, bonus_volume: 60, messages_per_day: 200 },
  agency: { price_cents: 19900, bonus_volume: 150, messages_per_day: -1 }, // -1 = unlimited
} as const;

// ============================================
// CLAWBACKS (Commission Reversals)
// ============================================
export type ClawbackType =
  | 'refund'
  | 'chargeback'
  | 'subscription_cancelled'
  | 'order_cancelled'
  | 'compliance_violation'
  | 'fraud'
  | 'policy_lapse'
  | 'admin_adjustment';

export type ClawbackStatus = 'pending' | 'processed' | 'failed';

export interface Clawback {
  id: string;
  commission_id: string;
  clawback_type: ClawbackType;
  original_amount: number;
  clawback_amount: number;
  reason: string;
  initiated_by: string;
  status: ClawbackStatus;
  processed_at: string | null;
  created_at: string;
}

export type ClawbackInsert = Omit<Clawback, 'id' | 'created_at' | 'processed_at'>;
export type ClawbackUpdate = Partial<ClawbackInsert>;

// ============================================
// PAY PERIODS (Commission Batching)
// ============================================
export type PayPeriodType = 'weekly' | 'biweekly' | 'monthly';
export type PayPeriodStatus = 'open' | 'closed' | 'processing' | 'paid';

export interface PayPeriod {
  id: string;
  period_type: PayPeriodType;
  period_number: number;
  year: number;
  start_date: string;
  end_date: string;
  cutoff_date: string;
  payout_date: string;
  status: PayPeriodStatus;
  total_commissions: number;
  total_overrides: number;
  total_bonuses: number;
  total_amount: number;
  agent_count: number;
  created_at: string;
  updated_at: string;
}

export type PayPeriodInsert = Omit<PayPeriod, 'id' | 'created_at' | 'updated_at'>;
export type PayPeriodUpdate = Partial<PayPeriodInsert>;

// ============================================
// QUALIFICATION SNAPSHOTS (Rank Maintenance)
// ============================================
export type QualificationStatus = 'qualified' | 'grace_period' | 'not_qualified' | 'demoted';

export interface QualificationSnapshot {
  id: string;
  agent_id: string;
  period_id: string | null;
  snapshot_date: string;
  title_rank: Rank;
  paid_as_rank: Rank;
  personal_bonus_volume: number;
  organization_bonus_volume: number;
  active_legs: number;
  personal_recruits: number;
  meets_pbv: boolean;
  meets_obv: boolean;
  meets_legs: boolean;
  meets_recruits: boolean;
  qualification_status: QualificationStatus;
  grace_periods_used: number;
  notes: string | null;
  created_at: string;
}

export type QualificationSnapshotInsert = Omit<QualificationSnapshot, 'id' | 'created_at'>;
export type QualificationSnapshotUpdate = Partial<QualificationSnapshotInsert>;

// ============================================
// AGENT STATUS EVENTS (Activity Tracking)
// ============================================
export type AgentStatusType = 'active' | 'inactive' | 'at_risk' | 'terminated';
export type StatusChangeType = 'activation' | 'deactivation' | 'reactivation' | 'termination' | 'warning';

export interface AgentStatusEvent {
  id: string;
  agent_id: string;
  previous_status: AgentStatusType;
  new_status: AgentStatusType;
  change_type: StatusChangeType;
  reason: string;
  triggered_by: 'system' | 'admin' | 'agent';
  initiated_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type AgentStatusEventInsert = Omit<AgentStatusEvent, 'id' | 'created_at'>;

// ============================================
// COMPLIANCE HOLDS (Fraud Prevention)
// ============================================
export type ComplianceHoldType =
  | 'new_agent_review'
  | 'high_volume_threshold'
  | 'suspicious_activity'
  | 'documentation_required'
  | 'regulatory_review'
  | 'fraud_investigation'
  | 'family_stacking'
  | 'circular_sponsorship'
  | 'rapid_advancement';

export type ComplianceHoldStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'escalated';

export interface ComplianceHold {
  id: string;
  agent_id: string;
  hold_type: ComplianceHoldType;
  status: ComplianceHoldStatus;
  reason: string;
  affected_amount: number;
  affected_commissions: string[];
  affected_payouts: string[];
  documentation_required: string[];
  documentation_provided: string[];
  assigned_to: string | null;
  notes: string;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export type ComplianceHoldInsert = Omit<ComplianceHold, 'id' | 'created_at' | 'updated_at' | 'resolved_at' | 'resolved_by'>;
export type ComplianceHoldUpdate = Partial<ComplianceHoldInsert>;

// ============================================
// SMARTOFFICE SYNC CONFIG
// ============================================
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
  webhook_enabled: boolean;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
}

export type SmartOfficeSyncConfigInsert = Omit<SmartOfficeSyncConfig, 'id' | 'created_at' | 'updated_at' | 'last_sync_at' | 'next_sync_at'> & {
  last_sync_at?: string | null;
  next_sync_at?: string | null;
};
export type SmartOfficeSyncConfigUpdate = Partial<SmartOfficeSyncConfigInsert>;

// ============================================
// SMARTOFFICE AGENTS
// ============================================
export interface SmartOfficeAgentRow {
  id: string;
  smartoffice_id: string;
  contact_id: string | null;
  apex_agent_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  client_type: number | null;
  status: number | null;
  tax_id: string | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export type SmartOfficeAgentRowInsert = Omit<SmartOfficeAgentRow, 'id' | 'created_at' | 'updated_at' | 'synced_at'> & {
  synced_at?: string;
};
export type SmartOfficeAgentRowUpdate = Partial<SmartOfficeAgentRowInsert>;

// ============================================
// SMARTOFFICE POLICIES
// ============================================
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
  raw_data: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
}

export type SmartOfficePolicyRowInsert = Omit<SmartOfficePolicyRow, 'id' | 'created_at' | 'synced_at'> & {
  synced_at?: string;
};
export type SmartOfficePolicyRowUpdate = Partial<SmartOfficePolicyRowInsert>;

// ============================================
// SMARTOFFICE COMMISSIONS
// ============================================
export interface SmartOfficeCommissionRow {
  id: string;
  smartoffice_id: string;
  smartoffice_agent_id: string | null;
  policy_number: string | null;
  commission_role: string | null;
  receivable: number | null;
  receivable_percent: number | null;
  receivable_percent_of: string | null;
  payable_due_date: string | null;
  paid_amount: number | null;
  status: string | null;
  comm_type: string | null;
  component_premium: number | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
}

export type SmartOfficeCommissionRowInsert = Omit<SmartOfficeCommissionRow, 'id' | 'created_at' | 'synced_at'> & {
  synced_at?: string;
};
export type SmartOfficeCommissionRowUpdate = Partial<SmartOfficeCommissionRowInsert>;

// ============================================
// SMARTOFFICE SYNC LOGS
// ============================================
export type SmartOfficeSyncType = 'full' | 'incremental' | 'agents' | 'policies' | 'commissions' | 'webhook';
export type SmartOfficeSyncStatus = 'running' | 'completed' | 'failed';

export interface SmartOfficeSyncLog {
  id: string;
  sync_type: SmartOfficeSyncType;
  status: SmartOfficeSyncStatus;
  triggered_by: string;
  triggered_by_user_id: string | null;
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
  errors: Record<string, unknown>[] | null;
  error_count: number;
  created_at: string;
}

export type SmartOfficeSyncLogInsert = Omit<SmartOfficeSyncLog, 'id' | 'created_at' | 'started_at' | 'completed_at' | 'duration_ms' | 'agents_synced' | 'agents_created' | 'agents_updated' | 'commissions_synced' | 'commissions_created' | 'policies_synced' | 'policies_created' | 'errors' | 'error_count'> & {
  started_at?: string;
  agents_synced?: number;
  agents_created?: number;
  agents_updated?: number;
  commissions_synced?: number;
  commissions_created?: number;
  policies_synced?: number;
  policies_created?: number;
  errors?: Record<string, unknown>[] | null;
  error_count?: number;
};
export type SmartOfficeSyncLogUpdate = Partial<Omit<SmartOfficeSyncLog, 'id' | 'created_at'>>;

// ============================================
// LICENSE HISTORY (Audit Trail)
// ============================================
export interface LicenseHistory {
  id: string;
  agent_id: string;
  previous_status: LicenseStatus | null;
  new_status: LicenseStatus;
  license_number: string | null;
  license_state: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  change_reason: string | null;
  changed_by: string | null;
  source: 'manual' | 'smartoffice_sync' | 'expiration_check';
  created_at: string;
}

export type LicenseHistoryInsert = Omit<LicenseHistory, 'id' | 'created_at'>;

// ============================================
// COMPLIANCE LOGS (Immutable Audit Trail)
// ============================================
export type ComplianceEventType =
  | 'unlicensed_override_prevented'
  | 'commission_rolled_up'
  | 'commission_forfeited'
  | 'license_status_change'
  | 'compliance_review_required';

export interface ComplianceLog {
  id: string;
  agent_id: string;
  event_type: ComplianceEventType;
  policy_id: string | null;
  commission_id: string | null;
  override_id: string | null;
  description: string;
  action_taken: string;
  regulatory_reference: string; // Citation to applicable law (e.g., "NAIC Model Law §218")
  original_amount: number | null;
  rolled_up_to_agent_id: string | null;
  triggered_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ComplianceLogInsert = Omit<ComplianceLog, 'id' | 'created_at'>;
// NOTE: No Update type - compliance logs are IMMUTABLE

// ============================================
// COMPENSATION PLAN CONFIGURATION
// ============================================
export type UnlicensedOverrideHandling = 'roll_up_to_next_licensed' | 'company_retains';
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface CompensationPlanConfig {
  id: string;
  name: string;
  description: string | null;
  effective_date: string;
  expiration_date: string | null;
  // CRITICAL: How to handle unlicensed upline overrides
  unlicensed_override_handling: UnlicensedOverrideHandling;
  // Override configuration
  max_generation_levels: number; // Default 6 for direct overrides
  max_rollup_generations: number; // Default 7 for roll-up search depth
  // Chargeback policy
  chargeback_period_months: number;
  // Payment settings
  minimum_payout_threshold: number;
  payment_frequency: PaymentFrequency;
  // Status
  is_active: boolean;
  // Audit
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CompensationPlanConfigInsert = Omit<CompensationPlanConfig, 'id' | 'created_at' | 'updated_at'>;
export type CompensationPlanConfigUpdate = Partial<CompensationPlanConfigInsert>;

// ============================================
// DATABASE SCHEMA TYPE (for Supabase client)
// ============================================
export interface Database {
  public: {
    Tables: {
      agents: {
        Row: Agent;
        Insert: AgentInsert;
        Update: AgentUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      matrix_positions: {
        Row: MatrixPosition;
        Insert: Omit<MatrixPosition, 'id' | 'created_at'>;
        Update: Partial<Omit<MatrixPosition, 'id' | 'created_at'>>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      commissions: {
        Row: Commission;
        Insert: CommissionInsert;
        Update: Partial<CommissionInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      overrides: {
        Row: Override;
        Insert: OverrideInsert;
        Update: Partial<OverrideInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      bonuses: {
        Row: Bonus;
        Insert: BonusInsert;
        Update: Partial<BonusInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      wallet_transactions: {
        Row: WalletTransaction;
        Insert: WalletTransactionInsert;
        Update: Partial<WalletTransactionInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'updated_at'>;
        Update: Partial<Omit<Wallet, 'id' | 'updated_at'>>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      payouts: {
        Row: Payout;
        Insert: PayoutInsert;
        Update: Partial<PayoutInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      contacts: {
        Row: Contact;
        Insert: ContactInsert;
        Update: ContactUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at'>>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at'>;
        Update: Partial<Omit<Lesson, 'id' | 'created_at'>>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      course_progress: {
        Row: CourseProgress;
        Insert: Omit<CourseProgress, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseProgress, 'id' | 'created_at'>>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      rank_history: {
        Row: RankHistory;
        Insert: Omit<RankHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<RankHistory, 'id' | 'created_at'>>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: Partial<OrderItemInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      email_sequences: {
        Row: EmailSequence;
        Insert: EmailSequenceInsert;
        Update: EmailSequenceUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      email_sequence_steps: {
        Row: EmailSequenceStep;
        Insert: EmailSequenceStepInsert;
        Update: EmailSequenceStepUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      lead_email_queue: {
        Row: LeadEmailQueue;
        Insert: LeadEmailQueueInsert;
        Update: LeadEmailQueueUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      lead_activities: {
        Row: LeadActivity;
        Insert: LeadActivityInsert;
        Update: Partial<LeadActivityInsert>;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      copilot_usage: {
        Row: CopilotUsage;
        Insert: CopilotUsageInsert;
        Update: CopilotUsageUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      copilot_subscriptions: {
        Row: CopilotSubscription;
        Insert: CopilotSubscriptionInsert;
        Update: CopilotSubscriptionUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      clawbacks: {
        Row: Clawback;
        Insert: ClawbackInsert;
        Update: ClawbackUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      pay_periods: {
        Row: PayPeriod;
        Insert: PayPeriodInsert;
        Update: PayPeriodUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      compliance_holds: {
        Row: ComplianceHold;
        Insert: ComplianceHoldInsert;
        Update: ComplianceHoldUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      qualification_snapshots: {
        Row: QualificationSnapshot;
        Insert: QualificationSnapshotInsert;
        Update: QualificationSnapshotUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      smartoffice_sync_config: {
        Row: SmartOfficeSyncConfig;
        Insert: SmartOfficeSyncConfigInsert;
        Update: SmartOfficeSyncConfigUpdate;
        Relationships: [];
      };
      smartoffice_agents: {
        Row: SmartOfficeAgentRow;
        Insert: SmartOfficeAgentRowInsert;
        Update: SmartOfficeAgentRowUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      smartoffice_policies: {
        Row: SmartOfficePolicyRow;
        Insert: SmartOfficePolicyRowInsert;
        Update: SmartOfficePolicyRowUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      smartoffice_commissions: {
        Row: SmartOfficeCommissionRow;
        Insert: SmartOfficeCommissionRowInsert;
        Update: SmartOfficeCommissionRowUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      smartoffice_sync_logs: {
        Row: SmartOfficeSyncLog;
        Insert: SmartOfficeSyncLogInsert;
        Update: SmartOfficeSyncLogUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================
// DRIP CAMPAIGNS
// ============================================

export type DripCampaignType =
  | 'new_agent_licensed'
  | 'new_agent_unlicensed'
  | 'reactivation'
  | 'promotion'
  | 'custom';

export type DripCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface DripCampaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: DripCampaignType;
  status: DripCampaignStatus;
  target_criteria: Record<string, unknown>;
  total_enrolled: number;
  total_completed: number;
  total_unsubscribed: number;
  created_at: string;
  updated_at: string;
  activated_at: string | null;
  created_by: string | null;
}

export interface DripCampaignInsert {
  name: string;
  description?: string | null;
  campaign_type: DripCampaignType;
  status?: DripCampaignStatus;
  target_criteria?: Record<string, unknown>;
  created_by?: string | null;
}

export type DripCampaignUpdate = Partial<DripCampaignInsert>;

export interface DripCampaignEmail {
  id: string;
  campaign_id: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  plain_text: string | null;
  sequence_order: number;
  delay_days: number;
  delay_hours: number;
  preferred_send_hour: number | null;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
  updated_at: string;
}

export interface DripCampaignEmailInsert {
  campaign_id: string;
  subject: string;
  preview_text?: string | null;
  html_content: string;
  plain_text?: string | null;
  sequence_order: number;
  delay_days?: number;
  delay_hours?: number;
  preferred_send_hour?: number | null;
}

export type DripCampaignEmailUpdate = Partial<Omit<DripCampaignEmailInsert, 'campaign_id'>>;

export type DripEnrollmentStatus = 'active' | 'completed' | 'unsubscribed' | 'paused';

export interface DripCampaignEnrollment {
  id: string;
  campaign_id: string;
  agent_id: string;
  current_email_index: number;
  status: DripEnrollmentStatus;
  enrolled_at: string;
  next_send_at: string | null;
  completed_at: string | null;
  unsubscribed_at: string | null;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
}

export interface DripCampaignEnrollmentInsert {
  campaign_id: string;
  agent_id: string;
  current_email_index?: number;
  status?: DripEnrollmentStatus;
  next_send_at?: string | null;
}

export type DripCampaignEnrollmentUpdate = Partial<Omit<DripCampaignEnrollmentInsert, 'campaign_id' | 'agent_id'>>;

export interface DripCampaignSend {
  id: string;
  enrollment_id: string;
  email_id: string;
  agent_id: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  message_id: string | null;
  unsubscribe_token: string;
}
