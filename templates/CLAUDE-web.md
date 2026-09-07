# CLAUDE.md

> This file is read automatically at the start of every Claude session in this project.
> Follow all standing instructions below without being prompted.

---

## Project summary
[What this app does in 2-3 sentences. Who uses it. What problem it solves.]

## Standards
This project follows https://github.com/Rekot24/dev-standards
Read **web-app-framework.md** before making any architectural decisions.
If asked to do something that conflicts with those standards, flag it before proceeding.

## Tech stack
- Database: Supabase (PostgreSQL) — [project name, region]
- Auth: Supabase Auth
- Frontend: React + Vite
- Hosting: Vercel
- [Add other services as they are added — include cost for any paid service]

## Architecture
[Key files and what each one does — one line each. Update as the project grows.]
- `src/lib/supabase.js` — single Supabase client instance, imported everywhere
- `src/lib/logger.js` — unified logging layer; never use console.log directly
- `src/constants/index.js` — all named values; no magic numbers in components
- `src/hooks/useSettings.js` — operator settings store, read/write from any component
- `src/hooks/useFeatureFlags.js` — feature flag and plan tier checks
- [Add files as the project grows]

## Key decisions
[Intentional architectural choices with date and reason. Prevents relitigating settled decisions.]
- [YYYY-MM-DD] Chose X over Y because Z

## Tried and rejected
[What was attempted, why it failed, and why not to go back to it.]
- [YYYY-MM-DD] Attempted X — abandoned because Y — do not revisit

## Current state
- Working: []
- In progress: []
- Known broken: []

## Session log
[Most recent first. Date, what changed, what was decided. Meaningful changes only — not every line.]

### [YYYY-MM-DD]
- Initial project setup

---

## Standing instructions

These apply every session without being included in the prompt:

1. Read this file fully before touching any code.
2. Read **web-app-framework.md** from https://github.com/Rekot24/dev-standards before any architectural work.
3. When a new technical decision arises, present the professional options with tradeoffs before recommending. The goal is the right long-term choice, not just what works today.
4. Before building anything, explain what you are going to do and why. Wait for confirmation.
5. Flag anything that conflicts with dev-standards before proceeding — do not comply silently.
6. No magic numbers or magic strings — all named values go in `src/constants/index.js` with a comment.
7. No raw `console.log` for debugging — all output goes through `src/lib/logger.js`.
8. Every function and hook gets a JSDoc comment before implementation is written.
9. All async functions follow the standard try/catch/finally pattern from web-app-framework.md Layer 6.
10. Every feature checks its flag in operator_settings before rendering — no feature runs unconditionally.
11. Loading, error, and empty states are built for every data-fetching component — never skipped.
12. No hardcoded values in components — all from `src/constants/` or operator settings.
13. Any schema change must be discussed before implementation — always flag as a migration required.
14. Any paid API or service must have its cost stated before it is integrated.
15. At the end of every session, before closing:
    - Add a dated entry to the session log summarizing what was done and decided
    - Update current state (working / in progress / known broken)
    - Add any new architectural choices to key decisions
    - Add anything tried and abandoned to tried and rejected
    - Commit the updated CLAUDE.md as the final commit: `docs: update CLAUDE.md session log [YYYY-MM-DD]`
