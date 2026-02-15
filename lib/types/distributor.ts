// SPEC: SPEC-DATA-MODEL > distributors table
// TypeScript types for Distributor domain

import type { Distributor as DbDistributor } from "@/lib/db/schema";

export type Distributor = DbDistributor;

export type NewDistributor = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  enrollerId?: string;
  bio?: string;
};

export type UpdateDistributor = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  photoCropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom?: number;
  };
};

export type DistributorStatus = "active" | "inactive" | "suspended";
export type DripStatus = "enrolled" | "paused" | "completed" | "opted_out";
