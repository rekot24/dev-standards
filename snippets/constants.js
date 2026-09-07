/**
 * snippets/constants.js
 *
 * Named constants pattern for React + Supabase projects.
 * Web equivalent of config/constants.py.
 *
 * Copy into src/constants/index.js in any new project.
 * Add or remove project-specific constants as needed.
 *
 * Rule: every meaningful value gets a name.
 *       Every name gets a comment if the value is not self-explanatory.
 *       Never hardcode these values in components.
 */

// ---------------------------------------------------------------------------
// Quote flow timing
// System defaults — operator can override these in their settings.
// ---------------------------------------------------------------------------

/** Hours after quote is sent before the first automatic follow-up SMS fires */
export const DEFAULT_QUOTE_FOLLOWUP_HRS = 24

/** Hours after quote is sent before operator gets an alert to call the customer */
export const DEFAULT_QUOTE_ALERT_HRS = 48

/** Hours a job can sit in quote_in_progress status before a stall alert fires */
export const QUOTE_STALL_ALERT_HRS = 2

// ---------------------------------------------------------------------------
// Financial defaults
// Operator overrides these in settings. Never reference these directly in
// quote logic — always read from operator settings at runtime.
// ---------------------------------------------------------------------------

/** Default material markup as a decimal (0.20 = 20%) */
export const DEFAULT_MARKUP_RATE = 0.20

/** Default labor rate in USD per hour */
export const DEFAULT_LABOR_RATE = 75.00

// ---------------------------------------------------------------------------
// Invoice formatting
// ---------------------------------------------------------------------------

/** Prefix for all invoice numbers — format: PREFIX-YEAR-SEQUENCE */
export const INVOICE_PREFIX = 'NXW'

// ---------------------------------------------------------------------------
// Photo limits
// ---------------------------------------------------------------------------

/** Maximum photo file size in bytes (10MB) */
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024

/** Maximum number of photos per job */
export const MAX_PHOTOS_PER_JOB = 100

/** Accepted image MIME types for upload validation */
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// ---------------------------------------------------------------------------
// Photo categories — tied to job status at time of capture
// Stored in job_photos.category column.
// ---------------------------------------------------------------------------

export const PHOTO_CATEGORY = {
  ASSESSMENT:  'assessment',    // taken at or after assessment_complete status
  IN_PROGRESS: 'in_progress',  // taken during job_in_progress status
  COMPLETION:  'completion',   // taken when marking job_complete
  DAMAGE:      'damage',       // damage found outside original scope — triggers upsell flow
  DOCUMENT:    'document',     // permits, receipts, product documentation
}

// ---------------------------------------------------------------------------
// Job status state machine
// Every job moves through these states in order.
// Every transition is logged in job_status_history.
// ---------------------------------------------------------------------------

export const JOB_STATUS = {
  INQUIRY_RECEIVED:     'inquiry_received',
  ASSESSMENT_SCHEDULED: 'assessment_scheduled',
  ASSESSMENT_COMPLETE:  'assessment_complete',
  QUOTE_IN_PROGRESS:    'quote_in_progress',   // timer starts here
  QUOTE_SENT:           'quote_sent',           // auto follow-up SMS starts here
  QUOTE_APPROVED:       'quote_approved',
  QUOTE_DECLINED:       'quote_declined',
  JOB_SCHEDULED:        'job_scheduled',
  JOB_IN_PROGRESS:      'job_in_progress',
  JOB_COMPLETE:         'job_complete',
  INVOICE_SENT:         'invoice_sent',
  INVOICE_PAID:         'invoice_paid',         // loop closed
}

/**
 * Human-readable labels for job statuses.
 * Always use these for display — never show raw status strings to operators.
 */
export const JOB_STATUS_LABELS = {
  [JOB_STATUS.INQUIRY_RECEIVED]:     'New Inquiry',
  [JOB_STATUS.ASSESSMENT_SCHEDULED]: 'Assessment Scheduled',
  [JOB_STATUS.ASSESSMENT_COMPLETE]:  'Assessment Done',
  [JOB_STATUS.QUOTE_IN_PROGRESS]:    'Building Quote',
  [JOB_STATUS.QUOTE_SENT]:           'Quote Sent',
  [JOB_STATUS.QUOTE_APPROVED]:       'Quote Approved',
  [JOB_STATUS.QUOTE_DECLINED]:       'Quote Declined',
  [JOB_STATUS.JOB_SCHEDULED]:        'Job Scheduled',
  [JOB_STATUS.JOB_IN_PROGRESS]:      'In Progress',
  [JOB_STATUS.JOB_COMPLETE]:         'Complete',
  [JOB_STATUS.INVOICE_SENT]:         'Invoice Sent',
  [JOB_STATUS.INVOICE_PAID]:         'Paid ✓',
}

// ---------------------------------------------------------------------------
// Plan tiers
// ---------------------------------------------------------------------------

/** Named plan tier constants — never hardcode the string 'pro' in a component */
export const PLAN_TIERS = {
  SOLO:      'solo',
  PRO:       'pro',
  CREW:      'crew',
  FRANCHISE: 'franchise',
}

/**
 * Numeric hierarchy for plan tier comparisons.
 * Higher number = more access.
 * Used by useFeatureFlags isPlan() — a crew operator passes a pro check.
 */
export const PLAN_HIERARCHY = {
  [PLAN_TIERS.SOLO]:      1,
  [PLAN_TIERS.PRO]:       2,
  [PLAN_TIERS.CREW]:      3,
  [PLAN_TIERS.FRANCHISE]: 4,
}

// ---------------------------------------------------------------------------
// Log categories — used with the logger
// Keeping these consistent makes filtering app_logs reliable.
// ---------------------------------------------------------------------------

export const LOG_CATEGORY = {
  AUTH:     'auth',
  JOBS:     'jobs',
  QUOTES:   'quotes',
  INVOICES: 'invoices',
  SMS:      'sms',
  EMAIL:    'email',
  PHOTOS:   'photos',
  HD_SYNC:  'hd_sync',
  PAYMENTS: 'payments',
  SETTINGS: 'settings',
  SYNC:     'sync',
}
