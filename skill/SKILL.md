---
name: dev-standards
description: Joshua's personal development standards (the Rekot24/dev-standards repo) - 17-layer frameworks for Python apps and Next.js + TypeScript + Supabase web apps, CSS design tokens and accessibility, UI patterns, project templates (CLAUDE.md, ROADMAP, SPEC, CI), and code snippets. Use this skill whenever starting, planning, building, reviewing, or auditing any app or repo - including settings stores, feature flags, logging, error handling, Supabase schema or RLS, React/Next.js components, data fetching, CSS or theming, project structure, CLAUDE.md or project instructions, or "does this follow my standards". Use it even if the user does not mention dev-standards by name.
---

# dev-standards

Joshua's standards are a project-agnostic rulebook: how to build, not what was built. This skill carries a copy of the repo in `references/`. The GitHub repo `Rekot24/dev-standards` is the source of truth; if the user says they updated it, tell them to rebuild the skill (see "Keeping this current").

## Step 1 - Pick the stack, read the matching reference

Read only what the task needs. Each file is long, so search for the layer or heading you need instead of loading everything.

| Task | Read |
|---|---|
| Python app, automation, headless service | `references/app-framework.md` |
| Web app (Next.js, React, Supabase) | `references/web-app-framework.md` |
| Any CSS, theming, layout, accessibility | `references/web-frontend-design.md` |
| "Which pattern should I use for X?" (filters, search, nav, tokens, data fetching, RLS, overlays, settings) | `references/web-patterns.md` |
| New project or repo setup | `references/templates/` (structure + CLAUDE + ROADMAP + SPEC + CI) |
| Writing project instructions for a Claude project | `references/templates/PROJECT-INSTRUCTIONS.md` |
| Need working code to copy | `references/snippets/` (see `snippets/README.md` for copy destinations) |
| Why a standard is the way it is | `references/decisions.md` |

Both frameworks share the same 17 layers: settings store, feature flags, debug layer, modularity, status and visibility, error handling, logging, commenting, data model first, interface before implementation, defensive programming, git, no magic numbers, repo hygiene, CLAUDE.md, testing, security. Web adds server-side plan enforcement, RLS, migrations, CI, and monitoring.

## Step 2 - Apply the standards

- Build to the layers from day one. The framework checklists ("New app checklist", "New web app checklist", "New project checklist") are the definition of ready to write feature code.
- Copy from `references/snippets/` instead of inventing a new version. Keep the pattern even when renaming entities.
- Project-specific facts never go into the standards. If you learn a new reusable pattern, propose it as a small, separate update to the repo.

## Step 3 - Push back before deviating (non-negotiable)

Joshua wants to know about better options up front, not discover them later. If a request works but conflicts with a standard, or a standard looks outdated against modern practice:

1. Stop and say so before building.
2. Explain the conflict, the better approach, and why.
3. Recommend one option and wait for his answer.

Deviations he has already accepted live in the project's `CLAUDE.md` under "Known deviations"; do not re-raise those, only new conflicts. Check that table first.

## Step 4 - Working loop

- Explain what you will build and why, then wait for confirmation. He learns by understanding before code exists.
- One milestone at a time. ROADMAP.md is the path, SPEC.md is the current step, CLAUDE.md is how to work and where things are. New ideas go on the ROADMAP "Not now" list rather than into the build.
- He has a known tendency to plan without shipping and has asked to be told. If planning runs long without anything built or committed, say so plainly and name the one next concrete step.
- For every command: which terminal, which folder, what it does, what output to expect.
- Never ask him to paste passwords or tokens into chat.

## Auditing a project against the standards

1. Read the project's `CLAUDE.md` (especially Known deviations) and the matching framework checklist.
2. Go layer by layer; mark each as met, partly met, or missing, with file evidence.
3. Output a prioritized list: security and data-loss risks first (RLS, secrets in the browser, no backups, no tests on money logic), then missing layers, then style.
4. Propose a Known deviations table for anything he chooses to leave.

## Decisions already made (do not re-litigate)

Web default is Next.js + TypeScript strict (Vite SPA is an approved variant). Server state uses TanStack Query behind feature hooks. Settings split into typed preference columns, JSONB flags with a code registry, and a server-owned plan table. Python baseline is pyproject.toml + uv + ruff + pytest + pre-commit. Money is integer cents. RLS on every table. Details and revisit conditions: `references/decisions.md`.

## Keeping this current

The reference copies are a snapshot. After changing the repo, rebuild with `python skill/build_skill.py` from the repo root, which produces a fresh `dev-standards.skill` to re-upload. If a reference looks different from what the user describes, trust the user and suggest a rebuild.
