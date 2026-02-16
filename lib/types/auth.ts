// SPEC: SPEC-DATA-MODEL > admin_users table
// TypeScript types for Auth domain

import type { AdminUser as DbAdminUser } from "@/lib/db/schema";

export type AdminUser = DbAdminUser;

export type UserRole = "super_admin" | "admin" | "viewer";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
} | null;

export type DistributorSession = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  isFounder?: boolean;
  founderInfo?: {
    founderId: string;
    founderName: string;
    founderEmail: string;
  };
} | null;
