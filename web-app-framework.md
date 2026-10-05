# Web App Framework — Next.js + TypeScript + Supabase

> Mirrors `app-framework.md` in structure and principle. The stack is different; the thinking is identical.
> This document is **project-agnostic**. Real projects appear only as *examples* in the README's
> "Reference implementations" table and in `snippets/` — never as requirements.

---

## Default stack and approved variants

| Concern | Default | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Decided 2026-10-04. TypeScript strict mode on. |
| Database / Auth / Storage | **Supabase** (Postgres) | RLS on every table, always. |
| Hosting | **Vercel** | Preview deploy per PR; production deploys from `main`. |
| Server state | **TanStack Query** | See Layer 4 and `web-patterns.md` #14. |
| Validation | **zod** | At every boundary: forms, route handlers, webhooks, env vars. |
| Tests | **Vitest** (unit) + **Playwright** (e2e) | See Layer 16. |

**Approved variant:** React + Vite SPA (internal tools, PWAs, projects that predate this decision).
Everything below still applies except the Next.js-specific parts (`app/` routing, `error.tsx`, server actions).
Record the variant — and any other departure — in the project's `CLAUDE.md` under **Known deviations**.

---

## The 17 layers (web edition)

Every web app built to this standard includes all 17 layers from day one.

1. **Settings store** — preferences, flags, and plan entitlements, each with the right owner
2. **Feature flags** — every feature has a switch; paid features are enforced server-side
3. **Debug layer** — one function, controlled by settings
4. **Modularity** — one job per file; UI → hook → data layer
5. **Status and visibility** — loading, error, and empty states designed up front
6. **Error handling** — designed in, not patched on
7. **Logging and monitoring** — persistent logs, crash reporting, uptime checks
8. **Code commenting** — why, not what; TSDoc on every exported function
9. **Data model first** — schema in migrations, types generated, shapes validated
10. **Interface before implementation** — contract first, body second
11. **Defensive programming** — never assume; validate every boundary
12. **Git as a thinking tool** — `main` always deployable, enforced by CI
13. **No magic numbers** — named constants with comments
14. **Repo hygiene** — clean root, documented env vars
15. **CLAUDE.md context** — session continuity file
16. **Testing** — automated checks on the logic that must not break
17. **Security and secrets** — RLS, least privilege, no secrets in the browser

---

## Layer 1 — Settings store

### The rule
> Every configurable value lives in the settings store. Nothing meaningful is hardcoded in a component.

### Three kinds of settings — three different owners

| Kind | Examples | Stored as | Who can change it |
|---|---|---|---|
| **Preferences** | timezone, default rate, follow-up hours, templates | Typed columns on `tenant_settings` | The tenant |
| **Flags** | which optional modules are on | One `flags` JSONB column on `tenant_settings` | The tenant |
| **Plan entitlements** | `plan_tier` | Separate `tenant_plans` table | **Server only** (billing webhook / admin) |

Why plans are separate: if a tenant can write their own row, they can switch on paid features.
Entitlements must live in a table the tenant can read but never write.

### Why a `tenant`
`tenant_id` is the owning account. For a single-user app it can simply equal the user's id.
For a team app, add a `tenant_members` table. Using `tenant_id` from day one means going multi-user later
is a policy change, not a rewrite.

### Tables
```sql
create table tenant_settings (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null unique references tenants(id) on delete cascade,

  -- Preferences: stable, typed, validated by the database
  display_name       text,
  timezone           text    not null default 'UTC',
  default_rate_cents integer not null default 0  check (default_rate_cents >= 0),
  followup_hours     integer not null default 24 check (followup_hours > 0),

  -- Flags: tenant-controlled toggles. Valid keys and defaults live in code
  -- (src/constants/flags.ts), so adding a flag needs NO migration.
  flags              jsonb not null default '{}'::jsonb,

  -- Debug
  debug_enabled      boolean not null default false,
  debug_categories   text[]  not null default '{}',   -- e.g. {'state_changes','api_calls'}

  updated_at         timestamptz not null default now()
);

create table tenant_plans (
  tenant_id   uuid primary key references tenants(id) on delete cascade,
  plan_tier   text not null default 'free' check (plan_tier in ('free','pro','team')),
  updated_at  timestamptz not null default now()
);
-- RLS: tenant may SELECT tenant_plans; INSERT/UPDATE only via the service role.
```

### Decision record: JSONB flags vs a flags table
Chosen: **JSONB column + a flag registry in code.**
- *For:* a new flag is a code change only; one row read loads everything; simple.
- *Against:* the database can't type-check individual flags — so the registry (with zod validation) is mandatory.
- *Switch to a `feature_flags` rows table when* you need per-flag audit history, per-flag rollout rules,
  or to join on flags constantly in SQL.

### The pattern (every component)
```ts
// Never: hardcoded value buried in a component
const followUpHours = 24

// Always: read from the settings store
const { settings } = useSettings()
const followUpHours = settings.followup_hours
```
See `snippets/useSettings.tsx`.

---

## Layer 2 — Feature flags

### The rule
> No feature renders or runs unconditionally. Every feature checks its flag first.
> **A flag or plan check in the UI is for user experience only. Anything paid or sensitive is also enforced
> on the server** (RLS policy, route handler, or edge function). A hidden button is not a lock.

### What qualifies as a feature
Any module with its own UI section, any background behavior, any paid third-party integration,
and anything that differs by plan.

### Flag registry (single source of valid flags)
```ts
// src/constants/flags.ts
export const FLAGS = {
  photos:        { key: 'photos',        default: true  },
  smsFollowup:   { key: 'smsFollowup',   default: false },
} as const
export type FlagKey = keyof typeof FLAGS
```

### In code
```tsx
const { isEnabled, canAccess } = useFeatureFlags()
if (!isEnabled('photos')) return null
if (!canAccess('smsFollowup', 'pro', 'team')) return <UpgradePrompt feature="SMS follow-up" />
```
Server-side enforcement example: `snippets/rls-tenant.sql` (plan-gated policy).

---

## Layer 3 — Debug layer

### The rule
> No raw `console.log`. All debug output goes through `logger.debug(category, msg)`.
> In production the flag is off and nothing leaks to the browser console.

```ts
logger.debug('state_changes', `status changed to ${next}`)   // zero cost when disabled
```
Enforce with an ESLint rule (`no-console`) so the standard checks itself. See `snippets/logger.ts`.

---

## Layer 4 — Modularity

### The rule
> If a file does more than one thing, it should be two files.

### Standard structure (Next.js App Router)
```
src/
  app/                      ← routes, layouts, loading.tsx, error.tsx (thin: compose, don't implement)
  features/<feature>/
    components/             ← UI for this feature
    hooks/                  ← useThing() — TanStack Query wrappers
    api.ts                  ← the ONLY place that talks to Supabase for this feature
    schemas.ts              ← zod schemas + inferred types
  components/shared/        ← Button, Modal, LoadingState, ErrorState, EmptyState
  context/                  ← AuthProvider, SettingsProvider, QueryProvider
  constants/                ← index.ts, flags.ts, plans.ts, statuses.ts
  lib/                      ← supabase clients, logger, money, formatters, validators (pure)
  types/database.ts         ← GENERATED by `supabase gen types typescript` — never hand-edited
```

### The UI rule
> Components never call the data layer directly. Components call hooks. Hooks call `api.ts`. `api.ts` calls Supabase.

```
Component → Hook (TanStack Query) → api.ts → Supabase
```

### Server state with TanStack Query (decision record, 2026-10-04)
**What it is:** a library that manages data fetched from a server — caching, loading/error flags,
refetching when stale, retries, and mutations that refresh the right data afterward.
**Why:** without it, every hook re-implements `useState` + `try/catch/finally` + loading flags by hand
(Layer 6's old pattern), and still lacks caching, de-duplication, and retry.
**What it does not change:** the UI rule above. Hooks still exist — they wrap `useQuery`/`useMutation`.
**Cost:** one dependency and one concept to learn. See `web-patterns.md` #14 and `snippets/useQueryExample.ts`.

---

## Layer 5 — Status and visibility

### The rule
> Loading, error, and empty states are designed for every data-fetching component — not added later.

```tsx
const { data, isPending, isError, error, refetch } = useThings()

if (isPending) return <LoadingState label="Loading…" />
if (isError)   return <ErrorState error={error} onRetry={refetch} />
if (!data.length) return <EmptyState message="Nothing here yet" action="Add the first one" />
return <ThingList items={data} />
```
Three states. Always. Next.js route-level equivalents: `loading.tsx` and `error.tsx`.

---

## Layer 6 — Error handling

### The rule
> Every async function that can fail must decide: recover, or tell the user?

### Two modes
- **Development:** fail loudly — full error, raw message.
- **Production:** fail gracefully — log it, show a human message, keep the rest of the app running.

Mode comes from the `debug_enabled` setting, not hardcoded.

### Standard pattern
`api.ts` functions **throw**; TanStack Query catches and exposes `isError`; the logger records it once.
```ts
// features/things/api.ts
export async function listThings(): Promise<Thing[]> {
  const { data, error } = await supabase.from('things').select('*').order('created_at', { ascending: false })
  if (error) throw error            // never return null data as if it were success
  return data
}
```
### Never
- `.catch(() => {})` that swallows errors
- Leaving the UI in a broken in-between state
- Showing raw database messages to end users in production
- Assuming a call succeeded without checking `error`

Add `app/error.tsx` and `app/global-error.tsx` so a render crash never shows a blank page.

---

## Layer 7 — Logging and monitoring

### Three tools, three jobs
| Tool | Answers | Where |
|---|---|---|
| Debug output | What is the app doing *right now*? | Browser console, flag-controlled |
| Persistent logs | What happened, in order, after the fact? | `app_logs` table |
| Crash/uptime monitoring | Is it broken, and did anyone notice? | Error tracker (e.g. Sentry) + uptime checker |

Why monitoring is separate: a crashed app can't write to its own log table. Use an external error tracker
for client and server exceptions, and an uptime check on the production URL.

### Log table
```sql
create table app_logs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references tenants(id) on delete cascade,
  level      text not null check (level in ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
  category   text not null,
  message    text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index idx_app_logs_tenant on app_logs (tenant_id, created_at desc);
create index idx_app_logs_level  on app_logs (level, created_at desc);
```
RLS: authenticated users may **INSERT their own tenant's rows only** — no SELECT/UPDATE/DELETE from the client.
Read logs from the dashboard or SQL editor.

### Rules
- INFO and above always runs. DEBUG only when `debug_enabled`.
- **Never log secrets, tokens, full card/phone numbers, or other personal data.** Log ids, not content.
- Set a **retention policy** (e.g. scheduled delete of rows older than 90 days) so the table can't grow forever.
- Use the category constants (`LOG_CATEGORY`) so filtering is reliable.

---

## Layer 8 — Code commenting

> Write comments for the next reader — including yourself in six months.
> If a decision took more than thirty seconds, comment it.

TSDoc on every exported function and hook:
```ts
/**
 * Sum line items and apply a markup.
 * All money is integer cents — never floats (see Layer 17).
 *
 * @param lines   Line items with unitPriceCents and quantity
 * @param markup  Decimal markup (0.20 = 20%)
 * @returns       subtotalCents, markupCents, totalCents
 */
```
Inline comments explain *why*: price locked at creation time, null normalization, workarounds.

---

## Layer 9 — Data model first

### The rule
> Define data shapes before writing logic. Never build a component against data you have not modeled.

1. Write the **migration** (table, constraints, RLS) — schema lives in `supabase/migrations/`, never only in the SQL editor.
2. Regenerate types: `supabase gen types typescript` → `src/types/database.ts`.
3. Write the **zod schema** for the shape the UI needs (`features/<x>/schemas.ts`).
4. Write the **mapper** from database row to UI shape.
5. Then the hook, then the component.

### Migration discipline
- One migration per logical change; filenames sorted by timestamp; never edit a migration that has shipped.
- Any change that can lose data is flagged **migration required** and gets a backup first.
- A local seed file (`supabase/seed.sql`) with fake data lets anyone rebuild a dev database.

---

## Layer 10 — Interface before implementation

> Name the function, define inputs and outputs, write the TSDoc — then implement.

```ts
/** Fetch records for the current tenant, optionally filtered by status. */
export function useThings(opts?: { status?: ThingStatus }): UseQueryResult<ThingSummary[], Error> {
  // implementation after the contract is agreed
}
```

---

## Layer 11 — Defensive programming

> Never assume. Verify. Handle the failure case before the success case.

- **Validate all external input with zod** — form data, route-handler bodies, webhook payloads, `process.env` (parse once at startup).
- Joined relations may be `null` — normalize with `??`.
- Check the session before protected actions (middleware + server-side check; never trust the client alone).
- A **0-row result may mean RLS blocked it**, not that the table is empty.
- Network calls fail: always handle the error branch.

---

## Layer 12 — Git as a thinking tool

- `main` is always deployable. This is **enforced**, not hoped for: branch protection + required CI checks (Layer 16).
- Every change is a branch → PR → Vercel preview → merge.
- Commit summary line: `type: description` (optionally `type(scope): description`) — `feat`, `fix`, `refactor`, `docs`, `schema`, `test`, `chore`. Imperative, about 72 characters.
- One logical change per commit. If the summary line needs "and", it's two commits.
- **Every commit gets a detailed message** — a short summary line plus a body. The commit log is the project's step-by-step
  history and the way back to a known-good point, so write it for the person reading it in six months. Body sections
  (omit one only if it is empty):
  - **Why** — the problem or the decision behind the change
  - **What changed** — files and behavior, in plain words
  - **Verified** — how it was checked (tests run, manual steps) and the result
  - **Notes** — migration number, how to revert, follow-ups, any Known deviation touched
  End AI-assisted commits with the `Co-Authored-By` trailer the tool specifies.
- When an assistant asks you to commit, it hands over the ready-to-paste message and the exact commands (which terminal,
  which folder), not just "commit this". Multi-line messages: `git commit -F message.txt`, or in PowerShell
  `@'...'@ | git commit -F -`.

Example:

```
fix(sync): stop deleted lessons coming back after a stale device syncs

Why:
A device with an old copy overwrote newer data (last write wins).

What changed:
- Writes now send only the rows that changed; removals are explicit.
- Writes about deleted lessons are skipped and reported, never recreated.

Verified:
- api tests: 16 passed, including the stale-device replay.
- Manual: deleted a lesson on one device; it stayed deleted on the other.

Notes:
- No schema change. Revert this commit to return to whole-snapshot sync.
```
- Dependabot (or equivalent) on for dependency updates.

---

## Layer 13 — No magic numbers or strings

Named constants in `src/constants/`, each with a comment. Statuses, categories, limits, and plan tiers are all constants.
See `snippets/constants.ts`.

---

## Layer 14 — Repo hygiene

### Standard root
```
README.md  CLAUDE.md  ROADMAP.md  SPEC.md  .gitignore  .env.example
package.json  tsconfig.json  next.config.ts  eslint.config.mjs  vitest.config.ts
src/  supabase/  tests/  docs/  .github/workflows/
```
### Environment variables
- Real values only in `.env.local` (gitignored). **`.env.example` with empty values is committed** and documents every variable.
- **Prefix rule:** anything starting with `NEXT_PUBLIC_` is shipped to every visitor's browser. Only publishable values (Supabase URL, publishable/anon key, Stripe publishable key) may carry it. **Secrets never do.**
- Parse env with zod at startup so a missing variable fails immediately, not at 2 a.m.

### ROADMAP.md is permanent and living
Future features, known issues, tech debt, ideas, and completed milestones (checked off, not deleted).

---

## Layer 15 — CLAUDE.md context

Same rule as the Python standard. See `templates/CLAUDE-web.md`.
> The last thing done in every session is updating CLAUDE.md and committing it.

---

## Layer 16 — Testing

### The rule
> Test the logic that costs money or trust when it breaks. Coverage percentage is not a goal.

### What to test, in priority order
1. **Pure business logic** — money math, totals, state-machine transitions, scheduling rules. Fast Vitest unit tests; no mocks needed because the logic is pure (that's why Layer 4 keeps it in `lib/`).
2. **Row Level Security** — a test that logs in as tenant A and proves tenant B's rows are invisible and unwritable. This is the highest-value test in a multi-tenant app.
3. **Critical user flows** — 1 to 3 Playwright end-to-end tests (sign in, the main create flow, payment/checkout if present).
4. **Webhook handlers** — signature rejected when invalid; replaying the same event does nothing twice.

### What not to test
Library internals, trivial getters, styling, and anything where the test would just mock the code it claims to test.

### Habit
A bug fix starts with a failing test that reproduces the bug. Then the fix. Then the test stays.

### CI (GitHub Actions) — runs on every PR
`npm ci` → lint → typecheck → unit tests → build. Template: `templates/ci/web-ci.yml`.
Required status checks block merging, which is what makes "main is always deployable" real.

---

## Layer 17 — Security and secrets

### Database
- **RLS on every table**, enabled in the same migration that creates the table. No policy = no access, which is the safe default.
- Prefer **least privilege**: grant `authenticated` only what the policies need; grant `anon` nothing unless a table is intentionally public. Do **not** run blanket `GRANT ALL ... TO anon` as a fix for permission errors — fix the policy instead.
- Policy template: `snippets/rls-tenant.sql`. Use `(select auth.uid())` (wrapped) so Postgres evaluates it once per query.
- Run the Supabase security advisor after schema changes.
- Verify against current Supabase docs when starting a project — key formats and default grants have been changing.

### Secrets
- The **service-role key and all third-party secrets are server-only** (route handlers, server actions, edge functions). Never in client code, never in `NEXT_PUBLIC_*`.
- A secret ever pasted in chat or committed is considered leaked: rotate it.
- Enable GitHub secret scanning; add a pre-commit check.

### Money
- Store and compute money as **integer cents** (or a decimal library). Never JavaScript floats.
- Timestamps are `timestamptz`, stored in UTC; format for display in the tenant's timezone.

### Webhooks and external calls
- **Verify signatures** on every inbound webhook (payments, messaging).
- Make handlers **idempotent**: store the event id; if seen, return success and do nothing.
- Set timeouts and retries on outbound calls. State the cost of any paid API before integrating it.

### Outbound messaging (SMS / email)
- Obtain and record consent; honor opt-out (e.g. STOP) automatically.
- US SMS requires carrier registration for application-to-person traffic — start it early, it takes time.
- Include required identification and unsubscribe links in marketing email.

### Plans and entitlements
Enforced server-side (Layer 2). The client check only decides what to *show*.

---

## New web app checklist

Before writing any feature code:

**Project setup**
- [ ] Repo created from `templates/web-project-structure.md`; first commit made
- [ ] `CLAUDE.md` (from `templates/CLAUDE-web.md`), `README.md`, `ROADMAP.md`, `SPEC.md` created
- [ ] `.gitignore` configured; `.env.example` committed; real values only in `.env.local`
- [ ] Known deviations table filled in (even if "none")

**Data and security**
- [ ] Supabase project created, region chosen
- [ ] `supabase/migrations/` initialized; schema created via migrations, not only the SQL editor
- [ ] RLS enabled with policies on every table; no blanket `anon` grants
- [ ] `tenants`, `tenant_settings`, `tenant_plans`, `app_logs` tables created
- [ ] Types generated into `src/types/database.ts`
- [ ] Service-role key confirmed server-only; no secret has a `NEXT_PUBLIC_` prefix

**Code foundations**
- [ ] `src/lib/supabase` clients (browser + server) — one definition each
- [ ] `src/constants/` with `index.ts`, `flags.ts`, `plans.ts`
- [ ] `SettingsProvider`, `useSettings`, `useFeatureFlags`, `QueryProvider` wired at the root
- [ ] `logger.ts` wired to settings + `app_logs`; `no-console` lint rule on
- [ ] `error.tsx` / `global-error.tsx` in place
- [ ] Loading, error, and empty states planned for every data-fetching component
- [ ] Every feature has a registered flag before it is built

**Quality and operations**
- [ ] Vitest installed; first test written (even a trivial one — establishes the pattern)
- [ ] RLS isolation test written once there are two tenants' worth of data
- [ ] CI workflow (`templates/ci/web-ci.yml`) running; branch protection requires it
- [ ] Error tracker and uptime check configured before first real user
- [ ] Backup plan written down before the first migration that touches real data

---

## Stack reference

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript strict | Vite SPA is an approved variant |
| Database | Supabase (Postgres) | Schema via migrations; RLS always |
| Auth | Supabase Auth | Never roll your own |
| Server state | TanStack Query | Wrapped in feature hooks |
| Global client state | React Context | Settings, auth only |
| Local state | `useState` / `useReducer` | Component-level only |
| Validation | zod | Boundaries and env |
| Styling | CSS variables (tokens) / Tailwind | See `web-frontend-design.md` |
| Tests | Vitest, Playwright | CI-enforced |
| Monitoring | Sentry (or equivalent), uptime checker | Layer 7 |
| Hosting | Vercel | Preview per PR |
| SMS | Twilio (server-side only) | Consent + opt-out required |
| Payments | Stripe | Webhooks → Supabase, idempotent |
| File storage | Cloudflare R2 or Supabase Storage | Store URLs in the database |
| Email | SendGrid or equivalent | Server-side only |

---

*Mirrors `app-framework.md` in structure and intent.*
*Last updated: October 2026.*
*When a new pattern is established in a web project, add it here.*
