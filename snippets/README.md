# Snippets

Reusable code patterns. Copy into a new project and adapt. Each file is self-contained and documented at the top.
Real projects that use these are listed in the root README under **Reference implementations**.

## Python

| File | What it is | Copy to |
|---|---|---|
| `settings_store.py` | Live settings store — single source of truth, persists to disk, thread-safe | `config/settings_store.py` |
| `logger.py` | Unified debug + logging layer — all output through one function, level-controlled | `tools/logger.py` |

## Web (Next.js + TypeScript + Supabase)

| File | What it is | Copy to |
|---|---|---|
| `env.ts` | zod-validated environment variables; public vs server-only split | `src/lib/env.ts` |
| `supabase-client.ts` | The one browser Supabase client | `src/lib/supabase/client.ts` |
| `constants.ts` | Named constants, example state machine, flag registry, plan tiers, log categories | `src/constants/index.ts` |
| `logger.ts` | Debug + persistent logging with secret redaction; no window globals | `src/lib/logger.ts` |
| `useSettings.tsx` | Settings provider: preferences + flags + read-only plan, optimistic updates (TanStack Query) | `src/context/SettingsContext.tsx` |
| `useFeatureFlags.ts` | `isEnabled` / `isPlan` / `canAccess` (UI checks only — enforce server-side too) | `src/hooks/useFeatureFlags.ts` |
| `useQueryExample.ts` | The data-fetching pattern: schema → api → TanStack hook → component | `src/features/<name>/` |
| `money.ts` | Integer-cent money helpers | `src/lib/money.ts` |
| `rls-tenant.sql` | Multi-tenant RLS template: membership helper, policies, plan-gated policy, isolation-test outline | `supabase/migrations/` |

## How to use

1. Copy the file, rename entities (`things`, `tenant_*`) to your domain.
2. Keep the **pattern** (contract, error behavior, comments) even when you change the names.
3. If a snippet needs improving, improve it here first, then copy — so the next project gets the fix.

*Snippets get added here as patterns are proven across projects.*
