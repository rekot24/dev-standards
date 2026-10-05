# ROADMAP.md — dev-standards

> The path for this repo itself. Completed items are checked off, never deleted.

Last updated: 2026-10-04

## Goal
A project-agnostic, always-current set of standards, templates, and snippets that any new project can start from,
with real projects serving as working examples.

## Status right now
Full audit completed 2026-10-04: frameworks rewritten generically, testing and security layers added, TypeScript/Next.js
default, accessibility added to design standards, templates and CI added. Snippets are written but not yet compiled
inside a real project.

## Done
- [x] 2026-10-04 Audit and modernization pass (see `docs/decisions.md`)

## Now
- [ ] Prove the web snippets in one real project — compile them, fix what breaks, update the snippet files

## Next
1. [ ] Add each existing project's **Known deviations** table (what it does not yet follow, and what fixes it)
2. [ ] Verify current Supabase guidance (API key names, default table grants, Next.js server client helper) and update `Layer 17`, `snippets/supabase-client.ts`, and `snippets/rls-tenant.sql` if needed
3. [ ] Add `tests/` examples: a Vitest file for `money.ts` and the status transition map; a pytest file for the settings store
4. [ ] Third framework doc: **services / homelab** (Docker Compose conventions, bind-mount rule, backups, n8n workflow standards, central LLM-call wrapper with cost tracking, batch API use, overnight jobs). Write it when the first real project in that area settles its patterns.

## Later
- [ ] A pre-commit / lint config bundle that can be copied in one step
- [ ] Skill version of these standards so every Claude session loads them automatically

## Not now
- 2026-10-04 Style Dictionary adoption — web-only projects don't need it (pattern #13 explains when to revisit)
- 2026-10-04 Per-flag rows table — JSONB is enough until audit history or rollout rules are needed

## Issues to be addressed
- [ ] TS snippets are untested in a real build (see Now)
- [ ] `useSettings.tsx` assumes a `SettingsGate` that supplies `tenantId`; add that snippet when AuthContext is standardized
- [ ] `web-patterns.md` example implementations have no repo links — add them to the README table

## Decisions worth keeping
- See `docs/decisions.md`

## Log
- 2026-10-04 Audit pass: 17-layer frameworks, project-agnostic rewrite, accessibility layer, TS snippets, ROADMAP/SPEC/CI templates.
