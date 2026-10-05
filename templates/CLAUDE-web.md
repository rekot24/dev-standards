# CLAUDE.md

> This file is read automatically at the start of every Claude session in this project.
> Follow all standing instructions below without being prompted.

---

## Project summary
[What this app does in 2-3 sentences. Who uses it. What problem it solves.]

## Standards
This project follows https://github.com/Rekot24/dev-standards
Read **web-app-framework.md** (and **web-frontend-design.md** before writing any CSS) before making architectural decisions.
If asked to do something that conflicts with those standards, flag it before proceeding.

## Known deviations
*Places this project does NOT follow dev-standards. Settled deviations are not re-raised each session;
only a NEW conflict is. Every row names what fixes it. Write "None yet" if empty.*

| Deviation | Why | What fixes it (milestone) |
|---|---|---|
| [e.g. Vite SPA instead of Next.js] | [reason] | [milestone, or "approved variant — permanent"] |

## Working docs
- `ROADMAP.md` — the path: goal, milestones, "not now" list, issues, log
- `SPEC.md` — the **current milestone only**. Follow it. Build only what it lists.
- This file — how to work here and where things are

## Tech stack
- Framework: Next.js (App Router) + TypeScript (strict)  *(or: Vite SPA — record under Known deviations)*
- Database / Auth: Supabase — [project name, region]
- Server state: TanStack Query · Validation: zod
- Hosting: Vercel
- [Add other services as they are added — include the cost of any paid service]

## Architecture
[Key files and what each one does — one line each. Update as the project grows.]
- `src/lib/supabase/client.ts` — the one browser Supabase client
- `src/lib/env.ts` — zod-validated environment variables
- `src/lib/logger.ts` — unified logging layer; never use `console.*` directly
- `src/constants/` — all named values and the feature-flag registry
- `src/context/SettingsContext.tsx` — settings store (preferences, flags, read-only plan)
- `src/hooks/useFeatureFlags.ts` — flag and plan checks (UI only; server enforces)
- `supabase/migrations/` — the schema, in order
- [Add files as the project grows]

## Design theme
[One sentence on mood and audience, then color roles in plain language — no hex values here.
See web-frontend-design.md "Design theme documentation".]

## Key decisions
- [YYYY-MM-DD] Chose X over Y because Z

## Tried and rejected
- [YYYY-MM-DD] Attempted X — abandoned because Y — do not revisit

## Current state
- Working: []
- In progress: []
- Known broken: []

## Session log
*Most recent first. Meaningful changes and decisions only.*

### [YYYY-MM-DD]
- Initial project setup

---

## Standing instructions

These apply every session without being included in the prompt:

1. Read this file fully before touching any code.
2. Read **web-app-framework.md** from https://github.com/Rekot24/dev-standards before architectural work.
3. Follow `SPEC.md` for the current milestone. New ideas go on the "Not now" list in `ROADMAP.md`, not into the build.
4. When a new technical decision arises, present the professional options with tradeoffs before recommending. The goal is the right long-term choice, not just what works today.
5. Start in plan mode: explain what you will do and why, and wait for confirmation. One milestone per session.
6. Flag anything that conflicts with dev-standards before proceeding — unless it is already in **Known deviations**. Do not comply silently.
7. No magic numbers or strings — named values go in `src/constants/` with a comment.
8. No `console.*` — all output goes through `src/lib/logger.ts` (lint rule enforces this).
9. Every exported function and hook gets a TSDoc comment before implementation is written.
10. Data fetching: component → hook (TanStack Query) → `api.ts` → Supabase. Components never call Supabase directly. `api.ts` functions throw on failure.
11. Every feature checks its flag from the registry. Paid or sensitive features are ALSO enforced server-side (RLS / route handler).
12. Loading, error, and empty states are built for every data-fetching component.
13. Validate all external input (forms, request bodies, webhooks, env) with zod.
14. Any schema change goes in a migration file, is flagged "migration required," and is discussed before implementation. Regenerate types afterward.
15. RLS is enabled on every table in the same migration that creates it. No blanket `anon` grants. Never expose a secret via `NEXT_PUBLIC_*`.
16. Money is integer cents. Timestamps are UTC.
17. Any paid API or service must have its cost stated before it is integrated.
18. Tests: pure business logic gets unit tests; every bug fix starts with a failing test. CI must pass before merging.
19. Never ask for passwords or tokens in chat; never commit `.env.local`.
20. Flag when planning runs long without building. If two sessions in a row end with no commit or merge, say so.
21. At the end of every session, before closing:
    - Add a dated entry to the session log
    - Update current state (working / in progress / known broken)
    - Add new architectural choices to key decisions; abandoned approaches to tried and rejected
    - Commit the updated CLAUDE.md as the final commit: `docs: update CLAUDE.md session log [YYYY-MM-DD]`
