# dev-standards

Personal development standards, architecture frameworks, and reusable patterns for **any** project.

---

## What this is

Every app I build follows the patterns in this repo. It is not a tutorial — it is a living reference built from
what worked, what I had to bolt on later and wished I hadn't, and the principles I arrived at by building real things.

**These standards are project-agnostic.** They describe how to build, not what was built. Real projects appear in one
place — the *Reference implementations* table below — as working examples that follow the standards, so code can be
copied instead of reinvented.

When I start a new project, this repo is the first thing I open.

---

## Two stacks, same principles

| Stack | Framework document | When to use |
|---|---|---|
| Python (desktop / automation / services) | `app-framework.md` | Local automation, device control, data pipelines, headless services |
| Next.js + TypeScript + Supabase (web) | `web-app-framework.md` | Web apps, SaaS platforms, customer-facing tools |

The principles are identical across both. The implementation details differ. Read the document that matches the project.
A third document for self-hosted services (Docker, n8n, LLM pipelines) is planned — see `ROADMAP.md`.

---

## Contents

| File / folder | What it is |
|---|---|
| `app-framework.md` | Python framework — 17 layers, toolchain, new-app checklist, terminology |
| `web-app-framework.md` | Web framework — the same 17 layers for Next.js + Supabase, security and testing included |
| `web-frontend-design.md` | CSS token system, typography, color, components, and accessibility (7 design layers) |
| `web-patterns.md` | Decision guide — which pattern to use when, with example implementations |
| `templates/` | Starter files for new projects |
| `snippets/` | Reusable code, ready to copy |
| `docs/decisions.md` | Why the standards are the way they are, with dates |
| `ROADMAP.md` | What is planned for this repo |

### Templates

| File | Use for |
|---|---|
| `templates/PROJECT-INSTRUCTIONS.md` | Baseline for a Claude project's instructions: working loop, safety, quick-start |
| `templates/CLAUDE.md` | Repo context file — Python projects |
| `templates/CLAUDE-web.md` | Repo context file — Next.js + Supabase projects |
| `templates/ROADMAP.md` | The path: goal, milestones, "not now" list, issues, log |
| `templates/SPEC.md` | The current step only, with "done when" checks and rollback |
| `templates/project-structure.md` | Python folder layout + `pyproject.toml`, ruff, pre-commit starters |
| `templates/web-project-structure.md` | Web folder layout, env handling, scripts, provider wiring |
| `templates/ci/web-ci.yml` | GitHub Actions for web projects |
| `templates/ci/python-ci.yml` | GitHub Actions for Python projects |

### Snippets

**Python:** `settings_store.py`, `logger.py`
**Web (TypeScript):** `env.ts`, `supabase-client.ts`, `constants.ts`, `logger.ts`, `useSettings.tsx`,
`useFeatureFlags.ts`, `useQueryExample.ts`, `money.ts`, `rls-tenant.sql`
Full table with copy destinations: `snippets/README.md`.

---

## The 17 layers

Every app I build includes these from day one, regardless of stack:

1. **Settings store** — single source of truth, always live
2. **Feature flags** — every behavior has an on/off switch (paid features enforced server-side)
3. **Debug layer** — all debug output through one central function, controlled by settings
4. **Modularity** — every file has one job; folder structure is consistent across projects
5. **Status and visibility** — health and state always shown
6. **Error handling** — designed in, not patched on; fail loudly in dev, gracefully in production
7. **Logging** — persistent record separate from debug output (plus crash and uptime monitoring for web)
8. **Code commenting** — comments explain why, not what
9. **Data model first** — define data shapes before writing logic
10. **Interface before implementation** — define inputs and outputs before the inside
11. **Defensive programming** — never assume; verify, handle, log, move on
12. **Git as a thinking tool** — main is always working; CI enforces it
13. **No magic numbers** — all named values in constants with comments
14. **Repo hygiene** — root stays clean; every file has a reason to be there
15. **CLAUDE.md context** — session continuity file, always present, always updated
16. **Testing** — automated checks on the logic that must not break
17. **Security and secrets** — least privilege, no secrets in code or the browser, validate all input

---

## Reference implementations

Working projects that follow these standards. Copy code from them; if one drifts from the standards, either fix it
or record the deviation in that project's `CLAUDE.md` under **Known deviations**.

| Project | Stack | Good example of | Repo |
|---|---|---|---|
| befish.cc | Next.js (web) | Design tokens, `globals.css` system, filter drawer, client-side search (`web-patterns.md` #1–#13) | [add link] |
| fish-farm-mgr-v2 | Python | Settings store, feature flags, per-worker modularity; headless migration (Layer 4 "headless-ready") | [Rekot24/fish-farm-mgr-v2](https://github.com/Rekot24/fish-farm-mgr-v2) |
| A Supabase-backed SaaS (in progress) | Next.js/React + Supabase | Settings/flags/plan split, RLS, TanStack hooks — *will become the example for web layers 1–2, 9, 16, 17 once built* | [add link when it exists] |

*Add a row when a project cleanly demonstrates a layer. Remove it if it stops following the standards.*

---

## How to use this in a new project

**Python project**
1. Read `app-framework.md`.
2. Create the repo from `templates/project-structure.md` (includes `pyproject.toml`, ruff, pre-commit).
3. Copy `templates/CLAUDE.md`, `ROADMAP.md`, `SPEC.md` into the root and fill them in.
4. Copy `templates/ci/python-ci.yml` to `.github/workflows/ci.yml`.
5. Copy the snippets you need into `config/` and `tools/`.

**Web project**
1. Read `web-app-framework.md`, and `web-frontend-design.md` before writing any CSS.
2. Create the repo from `templates/web-project-structure.md`.
3. Copy `templates/CLAUDE-web.md`, `ROADMAP.md`, `SPEC.md` into the root and fill them in.
4. Copy `templates/ci/web-ci.yml` to `.github/workflows/ci.yml` and require it on `main`.
5. Copy the snippets you need; run the checklist at the end of `web-app-framework.md`.

**Both**
- For a Claude project, paste the baseline from `templates/PROJECT-INSTRUCTIONS.md` into the project instructions.
- Add this line to the project's README:
  > This project follows the standards in [Rekot24/dev-standards](https://github.com/Rekot24/dev-standards)
- Anything the project does not follow goes in `CLAUDE.md` → **Known deviations**, with the reason and what fixes it.

---

*This repo grows as new patterns are identified. Last updated: October 2026.*
