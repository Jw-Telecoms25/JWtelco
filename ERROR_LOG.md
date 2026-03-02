# JWTelecoms — Error Log

Mistakes and anti-patterns to NEVER repeat. Reference this before every implementation.

---

## Session 1 — 2026-03-01

### E001: Mock Provider as Production Fallback
**What happened:** VTPass integration used mockProvider as fallback. In production, this would generate fake electricity tokens — user pays real money, gets a fake token.
**Rule:** NEVER fall back to mock outside of local development. If primary provider fails, either try a real fallback or return error to user.
**Files affected:** electricity/buy, cable/subscribe, electricity/verify, cable/verify

### E002: Math.random() for Financial References
**What happened:** Transaction references and VTPass request IDs used Math.random() which is predictable and not cryptographically secure.
**Rule:** ALWAYS use crypto.randomBytes() or crypto.randomUUID() for any security-sensitive or financial identifiers.
**Files affected:** src/lib/utils/reference.ts, src/lib/providers/vtpass.ts

### E003: Free Money Endpoint
**What happened:** /api/wallet/fund allows any authenticated user to credit their wallet with arbitrary amounts. No payment verification.
**Rule:** NEVER create endpoints that modify financial state without verification from an external payment gateway or admin approval.
**Files affected:** src/app/api/wallet/fund/route.ts

### E004: Pending Treated as Failed
**What happened:** VTPass pending transactions were treated as failures, triggering automatic refunds. If VTPass later delivers the service, the platform loses money (refunded + delivered).
**Rule:** NEVER auto-reverse a pending provider transaction. Mark as 'processing', requery later.
**Files affected:** src/lib/providers/vtpass.ts

### E005: Phone Enumeration via HTTP Status Codes
**What happened:** login-by-phone returned 200 for registered phones (with email) and 404 for unregistered. Comment said "avoid enumeration" but the implementation defeated it.
**Rule:** ALWAYS return the same HTTP status code and response shape regardless of whether a user exists. Use timing-safe responses.
**Files affected:** src/app/api/auth/login-by-phone/route.ts

### E006: Cascading Deletes on Financial Records
**What happened:** ON DELETE CASCADE on profiles would delete all transactions, wallets, and ledger entries if a profile is deleted. Financial records must be retained permanently.
**Rule:** NEVER use ON DELETE CASCADE on financial tables. Use ON DELETE RESTRICT. Implement soft deletes for user-facing records.
**Files affected:** supabase-schema.sql

### E007: No Fetch Timeouts on External API Calls
**What happened:** All VTPass fetch() calls had no timeout. If VTPass hangs, the server request hangs indefinitely while the wallet is already debited.
**Rule:** ALWAYS use AbortController with a 30-second timeout on external API calls. Handle the abort error explicitly.
**Files affected:** src/lib/providers/vtpass.ts

### E008: Client-Supplied Amount Without Server Validation
**What happened:** Electricity buy route accepted amount directly from client without validating against server-side pricing. Airtime route did the same.
**Rule:** NEVER trust client-supplied financial amounts. Always look up pricing server-side from the database.
**Files affected:** src/app/api/services/electricity/buy/route.ts, src/app/api/services/airtime/route.ts

---

## Session 2 — 2026-03-02

### E009: Missing search_path on SECURITY DEFINER Functions
**What happened:** `handle_new_user()` trigger function was created without `SET search_path = public`. When executed from the `auth` schema context (triggered by auth.users INSERT), it couldn't find `profiles` and `wallets` tables in the `public` schema. Registration failed with "Database error saving new user" for ALL users.
**Root cause:** PostgreSQL SECURITY DEFINER functions inherit the search_path of the calling context, not the definer's default. When `auth.users` triggers fire, the search_path is `auth`, not `public`.
**Rule:** ALWAYS add `SET search_path = public` to any SECURITY DEFINER function that accesses public schema tables, especially trigger functions on auth.users.
**Files affected:** supabase/migrations/20260302000000_repair_functions_triggers_rls.sql, handle_new_user(), process_wallet_transaction()

### E010: Non-deterministic Wallet Funding References (Double-Credit Vulnerability)
**What happened:** `fund/verify/route.ts` and webhook routes generated a new random `fundRef` on every call via `generateReference("FUND")`. Two concurrent verify requests for the same payment would both pass the status check and credit the wallet twice with different references.
**Rule:** ALWAYS use deterministic references derived from the payment gateway reference (e.g. `FUND-PSK-{paystack_ref}`) so the DB unique constraint on transactions.reference prevents double-credit.
**Files affected:** fund/verify/route.ts, webhooks/paystack/route.ts, webhooks/aspfiy/route.ts

### E011: walletError instanceof Error — Always False
**What happened:** Supabase `.rpc()` returns `PostgrestError` objects, not `Error` instances. `walletError instanceof Error` is always false, causing all error details to be logged as "Unknown".
**Rule:** Supabase errors are plain objects with a `.message` property. Use `walletError.message` directly, never `instanceof Error` for Supabase client errors.
**Files affected:** fund/verify/route.ts, webhooks/paystack/route.ts, webhooks/aspfiy/route.ts

### E012: Receipt API — No Authentication
**What happened:** `/api/receipts/[reference]` had zero auth checks. Anyone who guessed a transaction reference could access the full transaction details including electricity tokens.
**Rule:** ALWAYS add auth + user_id scoping on endpoints that return user-specific data. Even "shareable" resources need access control.
**Files affected:** src/app/api/receipts/[reference]/route.ts

### E013: Webhook Without Signature Verification
**What happened:** Aspfiy webhook accepted any POST request without verifying the caller's identity. An attacker could craft fake webhook payloads to credit arbitrary wallets.
**Rule:** EVERY webhook endpoint MUST verify the request signature/secret before processing. If the provider doesn't offer signing, use a shared secret in a header.
**Files affected:** src/app/api/webhooks/aspfiy/route.ts

### E014: Internal Error Messages Leaked to Client
**What happened:** Fund and virtual account routes returned `err.message` directly to the browser. If Paystack returns "Your secret key is invalid", that's now visible to users.
**Rule:** ALWAYS return generic error messages to clients. Log the real error server-side.
**Files affected:** wallet/fund/route.ts, wallet/account/route.ts
