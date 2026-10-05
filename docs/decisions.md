# Decisions

Architectural decisions for dev-standards itself, with dates and reasons. Newest first.
*Format: decision · why · what would change our mind.*

## 2026-10-04 — Detailed commit messages (summary line + body)
**Decision:** Every commit has a short summary line (`type: description`) and a body with Why, What changed, Verified, and Notes. Assistants hand over the full message and exact commands whenever a commit is needed.
**Why:** The commit log is the step-by-step history and the way back to a known-good point; one-line messages lose the reasoning. Handing over a ready-to-paste message removes the friction that makes people write "update".
**Revisit if:** the body becomes boilerplate nobody reads — then trim the sections to the ones that earn their place.

## 2026-10-04 — Standards are project-agnostic
**Decision:** Framework docs describe patterns generically. Real projects appear only as *examples* (README "Reference implementations", and the "Example implementation" line in `web-patterns.md`).
**Why:** The repo should apply to any project, past or future; project-specific names in the rules made them look like requirements.
**Revisit if:** examples start drifting from the standards — then fix the example or record it as a Known deviation.

## 2026-10-04 — Next.js + TypeScript is the web default
**Decision:** Next.js (App Router) + TypeScript strict. React + Vite SPA remains an approved variant, recorded under Known deviations.
**Why:** One default removes a decision per project; TypeScript plus generated database types removes a class of bugs and replaces hand-written JSDoc typedefs; an existing Next.js project already established the pattern.
**Revisit if:** a project is a pure internal SPA where server rendering adds nothing — use the variant.

## 2026-10-04 — TanStack Query for server state
**Decision:** Server data goes through TanStack Query hooks. The rule "Component → Hook → api.ts → Supabase" is unchanged.
**Why:** Removes hand-rolled loading/error/refetch state from every hook and adds caching, retries, and cache invalidation.
**Revisit if:** a project has almost no server data (static site) — skip it.

## 2026-10-04 — Settings: typed columns + JSONB flags + server-owned plans
**Decision:** Preferences are typed columns; feature flags are one JSONB column validated by a code registry; plan tier lives in a separate table only the server can write.
**Why:** New flag = no migration; tenants cannot grant themselves paid features.
**Revisit if:** flags need per-flag audit history, rollout rules, or heavy SQL joins — move to a `feature_flags` rows table.

## 2026-10-04 — Python toolchain baseline
**Decision:** `pyproject.toml` + uv + ruff + pytest + pre-commit (pyright when type hints exist).
**Why:** Each tool enforces a layer automatically (no stray prints, no bare excepts, tests exist, checks run before commit).
**Revisit if:** a project is a single throwaway script — pytest/ruff still recommended, the rest optional.

## 2026-10-04 — Testing and security promoted to layers 16 and 17
**Decision:** The framework grew from 15 to 17 layers. Monitoring was folded into Layer 7 (logging); CI into Layers 12 and 16; accessibility became Layer 7 of the design system.
**Why:** Testing was a "future layer" and security was spread across notes; both are needed from day one on anything handling money, personal data, or unattended operation.
