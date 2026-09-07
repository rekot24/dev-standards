# Web App Framework — React + Supabase Standard

> This document mirrors app-framework.md exactly in structure and principle.
> The stack is different. The thinking is identical.
> When building a React + Supabase + Vercel project, this is the reference.

---

## Why a separate document

app-framework.md was built for Python desktop apps — local file system, threading, ADB connections.
Web apps run differently: the database is the persistence layer, the browser is the runtime, and
multiple users share one system. Every principle from the Python framework applies. The
implementation is different enough to deserve its own reference.

---

## The 15 layers (web edition)

Every web app built to this standard includes all 15 layers from day one.

1. **Settings store** — operator settings live in the database, read via React Context
2. **Feature flags** — every feature has a database-driven on/off switch
3. **Debug layer** — all debug output through one function, controlled by a settings flag
4. **Modularity** — one file per concern, consistent folder structure across projects
5. **Status and visibility** — health and state always surfaced, always visible
6. **Error handling** — designed in from the start; fail loudly in dev, gracefully in production
7. **Logging** — persistent record in Supabase, separate from debug output, with correct log levels
8. **Code commenting** — comments explain why, not what; every function has a JSDoc comment
9. **Data model first** — define data shapes before writing logic
10. **Interface before implementation** — define inputs and outputs before writing the inside
11. **Defensive programming** — never assume; verify, handle, log, and move on
12. **Git as a thinking tool** — main is always working; branches are for experiments
13. **No magic numbers** — all named values in constants files with comments
14. **Repo hygiene** — root stays clean; every file has a reason to be there
15. **CLAUDE.md context** — session continuity file, always present, always updated

---

## Layer 1 — Settings store (the config layer)

### What it is
A single source of truth for every configurable value in the app. In a web app,
this lives in the database — not a local file. The UI writes to it. Every component
reads from it via React Context. Nothing meaningful is hardcoded.

### Why it matters
Hardcoded values require a code deploy to change. Settings in the database change
instantly, per operator, without touching code. At scale, each operator has their
own settings row. The app reads the right one automatically.

### The rule
> Every configurable value lives in the settings store. Nothing meaningful is hardcoded in a component.

### Three tiers of settings

**Tier 1 — Operator preferences**
Values the operator controls from the settings UI:
- Default markup percentage
- Labor rate
- Quote follow-up timing (24hr default)
- SMS message templates
- Business name, logo, contact info
- Invoice number format
- Timezone

**Tier 2 — Feature flags**
Entire features toggled on or off:
- `photos_enabled` — photo documentation module
- `hd_sync_enabled` — Home Depot purchase sync
- `parts_tracking_enabled` — parts ordering + SMS tracking
- `sms_followup_enabled` — automated quote follow-up
- `bank_link_enabled` — Stripe Financial Connections
- `accounting_enabled` — double-entry accounting module

**Tier 3 — Plan tier config** (SaaS phase)
What each subscription plan unlocks:
- `plan_tier`: 'solo' | 'pro' | 'crew' | 'franchise'
- Plan tier is checked before rendering any gated feature
- Changing a plan tier in the database instantly changes what the operator sees

### Database table
```sql
CREATE TABLE operator_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID REFERENCES operators(id) ON DELETE CASCADE,

  -- Tier 1: Preferences
  business_name         TEXT,
  labor_rate_default    NUMERIC(10,2) DEFAULT 75.00,
  markup_default        NUMERIC(5,4)  DEFAULT 0.20,
  quote_followup_hrs    INTEGER       DEFAULT 24,
  quote_alert_hrs       INTEGER       DEFAULT 48,
  invoice_prefix        TEXT          DEFAULT 'NXW',
  timezone              TEXT          DEFAULT 'America/Denver',
  sms_template_quote    TEXT,
  sms_template_followup TEXT,
  sms_template_reminder TEXT,

  -- Tier 2: Feature flags
  photos_enabled          BOOLEAN DEFAULT true,
  hd_sync_enabled         BOOLEAN DEFAULT false,
  parts_tracking_enabled  BOOLEAN DEFAULT false,
  sms_followup_enabled    BOOLEAN DEFAULT true,
  bank_link_enabled       BOOLEAN DEFAULT false,
  accounting_enabled      BOOLEAN DEFAULT true,
  debug_enabled           BOOLEAN DEFAULT false,

  -- Debug sub-flags (only active when debug_enabled is true)
  debug_log_state_changes  BOOLEAN DEFAULT true,
  debug_log_api_calls      BOOLEAN DEFAULT false,
  debug_log_settings_reads BOOLEAN DEFAULT false,
  debug_log_render_cycles  BOOLEAN DEFAULT false,

  -- Tier 3: Plan config
  plan_tier     TEXT DEFAULT 'solo',  -- solo | pro | crew | franchise

  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### How it works in React

Settings are loaded once when the app starts, held in React Context, and available
to every component without prop drilling. When a setting changes, the context updates
and every component that reads it re-renders automatically.

```
App starts
  → useSettings() hook fetches operator_settings from Supabase
  → Settings stored in SettingsContext
  → Every component reads from context
  → User changes a setting in the UI
  → Hook updates Supabase + updates context
  → All components re-render with new value immediately
  → No page reload. No restart.
```

See `snippets/useSettings.js` for the full implementation pattern.

### The pattern (every component)
```javascript
// Never do this — hardcoded value buried in a component:
const followUpHours = 24

// Always do this — read from the settings store:
const { settings } = useSettings()
const followUpHours = settings.quote_followup_hrs
```

---

## Layer 2 — Feature flags (visibility and control)

### What it is
Every feature the app can perform has an explicit on/off switch in the database,
readable from the settings store, and checked by the feature before it renders or runs.

### Why it matters
Without feature flags, you cannot ship partial features safely, you cannot give
different operators different capabilities, and you cannot debug one feature without
everything else running. Feature flags fix all three.

### The rule
> No feature renders or runs unconditionally. Every feature checks its flag before doing anything.

### What qualifies as a feature
- Any module with its own UI section (photos, HD sync, parts tracking)
- Any automated background behavior (SMS follow-up, sync jobs)
- Any integration with a paid third-party service (Twilio, Stripe, RapidAPI)
- Any behavior that differs by plan tier

### How it looks in code
```javascript
// At the top of any feature component:
const { isEnabled } = useFeatureFlags()

if (!isEnabled('photos_enabled')) {
  return null  // feature is off — render nothing
}
```

### Plan tier gating (SaaS phase)
Plan tier is a setting like any other. The `useFeatureFlags` hook handles
both the boolean flag AND the plan tier check:

```javascript
// Feature available on Pro and above:
if (!isEnabled('hd_sync_enabled') || !isPlan('pro', 'crew', 'franchise')) {
  return <UpgradePrompt feature="Home Depot Sync" requiredPlan="Pro" />
}
```

See `snippets/useFeatureFlags.js` for the full implementation.

---

## Layer 3 — Debug layer

### What it is
A dedicated debug system controlled by the `debug_enabled` flag in the settings store.
All debug output flows through one function — never scattered `console.log` statements.

### The rule
> No raw `console.log` for debugging. All debug output goes through the debug logger.
> In production, the flag is off and nothing leaks to the browser console.

### How it looks in code
```javascript
// Never do this:
console.log('state changed:', newState)

// Always do this:
logger.debug('state_changes', `state changed to ${newState}`)

// The logger checks the flag before outputting — zero cost when disabled.
```

See `snippets/logger.js` for the full implementation.

---

## Layer 4 — Modularity standard

### What it is
Every file has one job. Files are organized by what they are responsible for.
Components, hooks, utilities, and constants are separate concerns in separate folders.

### The rule
> If a file does more than one thing, it should be two files.

### Standard folder structure
```
src/
  main.jsx                  ← entry point only; mounts the app
  App.jsx                   ← root component; wires routing and context providers

  constants/
    index.js                ← all named values; no magic numbers anywhere else
    jobStatuses.js          ← job status state machine constants
    planTiers.js            ← plan tier definitions and hierarchy

  context/
    SettingsContext.jsx     ← React Context for operator settings
    AuthContext.jsx         ← React Context for Supabase auth state

  hooks/
    useSettings.js          ← settings store read/write
    useFeatureFlags.js      ← feature flag + plan tier checks
    useJobs.js              ← job data fetching and mutations
    useCustomers.js         ← customer data
    useLogger.js            ← logging interface

  components/
    jobs/                   ← job list, job detail, status badge
    quotes/                 ← quote builder, template selector, line items
    customers/              ← customer profile, address list, communication log
    photos/                 ← photo capture, gallery, upload progress
    settings/               ← settings UI, feature flag toggles, plan info
    shared/                 ← buttons, inputs, modals, loading states

  lib/
    supabase.js             ← Supabase client (one instance, imported everywhere)
    logger.js               ← unified debug + logging layer
    formatters.js           ← currency, dates, phone numbers — pure functions
    validators.js           ← input validation — pure functions

  styles/
    globals.css             ← reset, CSS variables, typography
    tokens.css              ← design tokens: colors, spacing, radius
```

### The UI rule
> UI components never call API functions directly. They call hooks. Hooks call the API.

```
Component → Hook → Supabase
Component reads ← Hook returns data
```

This means components stay simple and testable. The data logic lives in one place.

---

## Layer 5 — Status and visibility

### What it is
Every feature that can be in a loading, error, or empty state surfaces that state visibly.
The operator always knows what the app is doing.

### The rule
> Loading, error, and empty states are designed for every feature — not added later.

### Standard state pattern for every data-fetching component
```javascript
const { data, loading, error } = useJobs()

if (loading) return <LoadingSpinner label="Loading jobs..." />
if (error)   return <ErrorMessage error={error} retry={refetch} />
if (!data.length) return <EmptyState message="No jobs yet" action="Add your first job" />

return <JobList jobs={data} />
```

Three states. Always. Never assume data exists.

---

## Layer 6 — Error handling

### What it is
A deliberate, designed response to everything that can go wrong. Supabase calls fail.
Twilio calls fail. The user has no internet. The session expires. All of these are
designed for — not patched on.

### The rule
> Every async function that can fail must decide: can I recover from this, or do I need to tell the user?

### Two modes — by design
**Development mode:** fail loudly. Log the full error. Surface the raw message to help debug.

**Production mode:** fail gracefully. Log the error to Supabase. Show the user a
human-readable message. Keep the rest of the app running.

Mode is controlled by the `debug_enabled` settings flag — not hardcoded.

### Standard async pattern (every Supabase call)
```javascript
// Every hook follows this exact pattern — no exceptions:
const fetchJobs = async () => {
  setLoading(true)
  setError(null)
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setJobs(data)
  } catch (err) {
    setError(err.message)
    logger.error('jobs', 'fetch failed', { message: err.message })
  } finally {
    setLoading(false)
  }
}
```

### What to never do
- Never use `.catch(() => {})` that swallows errors silently
- Never let a failed API call leave the UI in a broken in-between state
- Never show a raw Supabase error message to an end user in production
- Never assume a Supabase call succeeded without checking the `error` field

---

## Layer 7 — Logging (separate from debugging)

### The distinction
Debug output is for right now, while you are watching the browser console.
Logging is a persistent record of what the app did — written to Supabase,
queryable after the fact, available even when you were not watching.

### Why the database is the right log destination for a web app
Log files do not exist in a serverless web app. The browser console disappears
when the tab closes. Supabase is already the persistence layer — logging there
means every event is stored, queryable, and available for reporting and debugging.

### Database table
```sql
CREATE TABLE app_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id  UUID REFERENCES operators(id),
  job_id       UUID REFERENCES jobs(id),        -- optional context
  level        TEXT NOT NULL,                   -- DEBUG INFO WARNING ERROR CRITICAL
  category     TEXT NOT NULL,                   -- jobs, quotes, sms, photos, sync, auth
  message      TEXT NOT NULL,
  metadata     JSONB,                           -- any extra context as key/value
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_app_logs_operator ON app_logs(operator_id, created_at DESC);
CREATE INDEX idx_app_logs_level    ON app_logs(level, created_at DESC);
```

### Log levels — in plain English
```
DEBUG    → fine detail; only written when debug_enabled is true
INFO     → normal milestones (job created, quote sent, payment received)
WARNING  → unexpected but recoverable (SMS failed and will retry; SKU not found)
ERROR    → something failed that should not have (Stripe webhook missed, sync crashed)
CRITICAL → app cannot continue for this operator (auth broken, database unreachable)
```

### The rule
> INFO and above always runs. DEBUG only runs when debug_enabled is true.
> Use log levels correctly so you can filter after the fact.

See `snippets/logger.js` for the full implementation.

---

## Layer 8 — Code commenting standard

### The rule
> Write comments for the person who reads this next — including yourself in six months.
> If you had to think about a decision for more than thirty seconds, comment it.

### JSDoc for every function
```javascript
/**
 * Build a quote total from template materials and labor lines.
 * Applies the operator's default markup unless overridden per line.
 *
 * @param {Array} materials - Array of job_materials rows with unit_price and quantity
 * @param {Array} labor - Array of job_labor rows with hours and rate
 * @param {number} markupRate - Decimal markup rate (0.20 = 20%)
 * @returns {{ subtotal: number, markup: number, total: number }}
 */
export const buildQuoteTotal = (materials, labor, markupRate) => {
  // implementation
}
```

### Inline comments for non-obvious decisions
```javascript
// Lock price at quote time — never recalculate from current catalog price.
// Past quotes must reflect what the customer was charged, not today's price.
const unitPrice = catalogItem.current_price

// Supabase returns null for empty relations, not an empty array.
// Normalize here so the rest of the app can always assume an array.
const materials = job.job_materials ?? []
```

---

## Layer 9 — Data model first

### The rule
> Define data shapes before writing logic. Never build a component against data you have not modeled.

### What this looks like in a React + Supabase project
1. Define or confirm the database table first
2. Define the JavaScript shape the component expects
3. Write the hook that transforms database rows into that shape
4. Then write the component

```javascript
// Define the shape first — what does a job card need?
/**
 * @typedef {Object} JobSummary
 * @property {string} id
 * @property {string} status
 * @property {string} customer_name
 * @property {string} address_line
 * @property {string|null} quote_total
 * @property {string} created_at
 */

// Write the transform that produces it:
const toJobSummary = (row) => ({
  id:            row.id,
  status:        row.status,
  customer_name: row.customers?.full_name ?? 'Unknown',
  address_line:  row.addresses?.line1 ?? '',
  quote_total:   row.invoices?.[0]?.total ?? null,
  created_at:    row.created_at,
})

// Now the component can be written — the shape is locked in.
```

---

## Layer 10 — Interface before implementation

### The rule
> Name a function, define its inputs and outputs, write the JSDoc. Then implement.
> Never the other way around.

### What this looks like for hooks
```javascript
/**
 * useJobs — fetch and manage job records for the current operator.
 *
 * @param {Object} [options]
 * @param {string} [options.status] - filter by job status
 * @param {string} [options.customerId] - filter by customer
 *
 * @returns {{
 *   jobs: JobSummary[],
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void,
 *   updateStatus: (jobId: string, newStatus: string) => Promise<void>
 * }}
 */
export const useJobs = (options = {}) => {
  // implementation after the contract is defined
}
```

---

## Layer 11 — Defensive programming

### The rule
> Never assume. Verify. Handle the failure case before writing the success case.

### Defensive checks that always apply in a web app
- Supabase row may not exist — check before accessing properties
- Related data (joins) may be null — always provide fallbacks with `??`
- User may not be authenticated — check before any protected operation
- Network calls can fail at any time — always handle the error case
- RLS may silently block a query — a 0-row result is not always an empty table

```javascript
// Defensive: normalize nulls from Supabase joins
const customerName = job?.customers?.full_name ?? 'Unknown customer'
const address      = job?.addresses?.line1 ?? 'No address on file'
const materials    = job?.job_materials ?? []

// Defensive: check auth before a protected action
const { user } = useAuth()
if (!user) {
  logger.warning('auth', 'Attempted protected action without session')
  return redirect('/login')
}

// Defensive: always check both outcomes from a Supabase call
const { data, error } = await supabase.from('jobs').select()
if (error) {
  logger.error('jobs', 'fetch failed', { message: error.message })
  return  // stop here — never proceed with null data
}
```

---

## Layer 12 — Git as a thinking tool

Same rule as the Python standard. This does not change with the stack.

- `main` is always deployable. Vercel deploys on every push to main — broken code = broken production.
- Every feature or experiment gets its own branch.
- Commit message format: `type: description`
  - `feat: add photo upload to job detail`
  - `fix: quote total not recalculating when markup changes`
  - `refactor: extract quote builder logic into useQuote hook`
  - `docs: update CLAUDE.md with Phase 2 session log`
  - `schema: add job_photos table`
- One logical change per commit. If you need "and" in the message, it's two commits.

---

## Layer 13 — No magic numbers (or magic strings)

### Where constants live in a React project
```
src/
  constants/
    index.js        ← all named values: timing defaults, limits, formats
    jobStatuses.js  ← all job status strings in one place
    planTiers.js    ← plan tier names and hierarchy
```

See `snippets/constants.js` for the full starter file ready to copy in.

---

## Layer 14 — Repo hygiene

### Standard root — nothing else
```
README.md         ← always
CLAUDE.md         ← always
ROADMAP.md        ← always (living document)
.gitignore        ← always
package.json      ← dependencies
vite.config.js    ← build config
index.html        ← Vite entry point
```

### .gitignore minimums
```
node_modules/
dist/
.env
.env.local
.env.*.local
.DS_Store
```

### Environment variables
All secrets in `.env.local` — never committed.
Always document required variables in README.md so any new session knows what is needed.

### ROADMAP.md is permanent and living
- Future features
- Known issues and tech debt
- Ideas to revisit
- Completed milestones (checked off, not deleted — history matters)

---

## Layer 15 — CLAUDE.md context

Same rule as the Python standard. See `templates/CLAUDE-web.md` for the web project template.

The standing instruction that never changes:
> The last thing done in every session is updating CLAUDE.md and committing it.

---

## New web app checklist

Before writing any feature code, these must exist:

- [ ] CLAUDE.md created (from templates/CLAUDE-web.md) with standards pointer
- [ ] README.md with project description and required environment variables listed
- [ ] ROADMAP.md initialized
- [ ] .gitignore configured (node_modules, dist, .env files)
- [ ] Git repo initialized, first commit made
- [ ] Supabase project created, region selected, RLS enabled
- [ ] `src/lib/supabase.js` — single Supabase client instance created
- [ ] Run `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon; GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;` in SQL Editor — required when tables are created via SQL (not the Supabase UI); without this, all queries return permission denied regardless of RLS setting
- [ ] `src/constants/` folder created with index.js and jobStatuses.js
- [ ] `operator_settings` table created with all three tiers (preferences, flags, plan)
- [ ] `app_logs` table created
- [ ] `SettingsContext` and `useSettings` hook wired at app root
- [ ] `useFeatureFlags` hook created
- [ ] `logger.js` wired to settings store and Supabase
- [ ] React Error Boundary component at app root
- [ ] Loading, error, and empty states planned for every data-fetching component
- [ ] Every feature has a flag in operator_settings before it is built
- [ ] Every async function follows the standard try/catch/finally pattern
- [ ] No hardcoded values in components — all from constants or settings store

---

## Stack reference

| Layer | Tool | Notes |
|-------|------|-------|
| Database | Supabase (PostgreSQL) | Single source of truth; RLS always enabled; always run GRANT ALL ON ALL TABLES to anon + authenticated after creating tables via SQL |
| Auth | Supabase Auth | Built in; never roll your own |
| Frontend | React + Vite | Vite for fast dev and builds |
| Hosting | Vercel | Deploys on every push to main |
| Global state | React Context | Settings, auth state |
| Local state | useState / useReducer | Component-level only |
| Data fetching | Custom hooks | One hook per data domain |
| Styling | CSS variables / Tailwind | Tokens in CSS variables |
| SMS | Twilio | Via Supabase Edge Functions |
| Payments | Stripe | Webhooks → Supabase |
| File storage | Cloudflare R2 | Zero egress fees; URLs stored in Supabase |
| Email | SendGrid | Free tier |

---

*This document mirrors app-framework.md in structure and intent.*
*Last updated: September 2026*
*When a new pattern is established in a web project, add it here.*
