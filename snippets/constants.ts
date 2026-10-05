/**
 * snippets/constants.ts
 *
 * Named-constants pattern for Next.js + TypeScript projects.
 * Web equivalent of config/constants.py.
 *
 * Copy into src/constants/index.ts. Split into flags.ts / plans.ts / statuses.ts as it grows.
 * Replace the EXAMPLE blocks with your project's real values — keep the pattern.
 *
 * Rule: every meaningful value gets a name.
 *       Every name gets a comment if the value is not self-explanatory.
 *       Never hardcode these values in components.
 */

// ---------------------------------------------------------------------------
// Timing defaults — tenants can override the ones that exist in tenant_settings
// ---------------------------------------------------------------------------

/** Hours before the first automatic follow-up fires (tenant_settings.followup_hours overrides) */
export const DEFAULT_FOLLOWUP_HOURS = 24

/** Debounce for search inputs, in milliseconds */
export const SEARCH_DEBOUNCE_MS = 250

// ---------------------------------------------------------------------------
// Upload limits
// ---------------------------------------------------------------------------

/** Maximum upload size in bytes (10 MB) */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Accepted image MIME types for upload validation */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

// ---------------------------------------------------------------------------
// EXAMPLE state machine — replace with your domain's statuses.
// Every record moves through these in order; every transition is logged.
// `as const` makes the values literal types, so typos fail at compile time.
// ---------------------------------------------------------------------------

export const RECORD_STATUS = {
  DRAFT:     'draft',
  SUBMITTED: 'submitted',    // example: automatic follow-up timer starts here
  APPROVED:  'approved',
  DECLINED:  'declined',
  COMPLETE:  'complete',
} as const
export type RecordStatus = (typeof RECORD_STATUS)[keyof typeof RECORD_STATUS]

/** Human-readable labels. Always use these for display — never show raw status strings. */
export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  draft:     'Draft',
  submitted: 'Submitted',
  approved:  'Approved',
  declined:  'Declined',
  complete:  'Complete',
}

/**
 * Allowed transitions. The state machine lives in ONE place so UI, server code,
 * and tests all agree on what is legal. Unit-test this map (Layer 16).
 */
export const RECORD_STATUS_TRANSITIONS: Record<RecordStatus, readonly RecordStatus[]> = {
  draft:     ['submitted'],
  submitted: ['approved', 'declined'],
  approved:  ['complete'],
  declined:  ['draft'],
  complete:  [],
}

// ---------------------------------------------------------------------------
// Feature flag registry — the ONLY list of valid flags and their defaults.
// Flags are stored in tenant_settings.flags (jsonb); adding one needs no migration.
// ---------------------------------------------------------------------------

export const FLAGS = {
  uploads:     { default: true  },
  smsFollowup: { default: false },   // example: paid feature — also enforce server-side
} as const
export type FlagKey = keyof typeof FLAGS

// ---------------------------------------------------------------------------
// Plan tiers — entitlements come from tenant_plans (server-owned), never from the client
// ---------------------------------------------------------------------------

export const PLAN_TIERS = { FREE: 'free', PRO: 'pro', TEAM: 'team' } as const
export type PlanTier = (typeof PLAN_TIERS)[keyof typeof PLAN_TIERS]

/** Higher number = more access. A 'team' tenant passes a 'pro' check. */
export const PLAN_RANK: Record<PlanTier, number> = { free: 1, pro: 2, team: 3 }

// ---------------------------------------------------------------------------
// Log categories — consistent names make filtering app_logs reliable
// ---------------------------------------------------------------------------

export const LOG_CATEGORY = {
  AUTH: 'auth', DATA: 'data', PAYMENTS: 'payments', MESSAGING: 'messaging',
  SETTINGS: 'settings', SYNC: 'sync', UI: 'ui',
} as const
export type LogCategory = (typeof LOG_CATEGORY)[keyof typeof LOG_CATEGORY]
