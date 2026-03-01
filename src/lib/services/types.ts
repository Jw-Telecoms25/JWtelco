export type UserRole = "user" | "agent" | "admin" | "super_admin";
export type UserStatus = "active" | "blocked" | "suspended";
export type WalletType = "main" | "bonus" | "commission";
export type TransactionType =
  | "funding"
  | "airtime"
  | "data"
  | "electricity"
  | "cable"
  | "exam_pin"
  | "transfer"
  | "reversal";
export type TransactionStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "reversed";
export type LedgerDirection = "debit" | "credit";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  type: WalletType;
  balance: number; // in kobo
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // in kobo
  profit: number; // in kobo
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  wallet_id: string;
  direction: LedgerDirection;
  amount: number; // in kobo
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  type: TransactionType;
  description: string;
  provider: string;
  provider_config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  service_id: string;
  plan_name: string;
  plan_code: string;
  network?: string;
  user_price: number; // kobo
  agent_price: number; // kobo
  vendor_price: number; // kobo
  cost_price: number; // kobo
  validity?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  subject: string;
  message: string;
  target: "all" | "user" | "agents" | "admins";
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}
