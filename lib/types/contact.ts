// SPEC: SPEC-DATA-MODEL > contact_submissions table
// TypeScript types for Contact domain

import type { ContactSubmission as DbContactSubmission } from "@/lib/db/schema";

export type ContactSubmission = DbContactSubmission;

export type NewContactSubmission = {
  distributorId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message: string;
  ipAddress?: string;
};

export type ContactStatus = "new" | "read" | "replied" | "archived";

export type ContactFormData = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};
