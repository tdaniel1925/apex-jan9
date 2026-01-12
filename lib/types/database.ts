/**
 * Database Types
 * Type definitions matching Supabase schema
 */

import { Rank } from '../config/ranks';
import { Carrier } from '../config/carriers';

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

  // Rank & Status
  rank: Rank;
  status: 'pending' | 'active' | 'inactive' | 'terminated';
  licensed_date: string | null;

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
  rank?: Rank;
  status?: 'pending' | 'active' | 'inactive' | 'terminated';
  licensed_date?: string | null;
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
// OVERRIDES (6-Generation)
// ============================================
export interface Override {
  id: string;
  commission_id: string;
  agent_id: string; // Agent receiving override
  source_agent_id: string; // Agent who made sale
  generation: number; // 1-6
  override_rate: number;
  override_amount: number;
  status: 'pending' | 'paid' | 'reversed';
  created_at: string;
}

export type OverrideInsert = Omit<Override, 'id' | 'created_at'>;

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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at: string | null;
  created_at: string;
}

export type PayoutInsert = Omit<Payout, 'id' | 'created_at'>;

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

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_follow_up_at'> & {
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
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
