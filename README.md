# dev-standards

Personal development standards, architecture framework, and reusable patterns for all projects.

---

## What this is

Every app I build follows the patterns in this repo. This is not a tutorial — it's a living
reference built from real experience: what worked, what I had to bolt on later and wished I
hadn't, and the principles I've arrived at through building actual things.

When I start a new project, this repo is the first thing I reference.

---

## Two stacks, same principles

This repo covers two different technology stacks. The principles are identical across both.
The implementation details differ. Read the document that matches your project.

| Stack | Framework document | When to use |
|---|---|---|
| Python (desktop / automation) | `app-framework.md` | Local automation apps, device control, data pipelines |
| React + Supabase (web) | `web-app-framework.md` | Web apps, SaaS platforms, customer-facing tools |

---

## Contents

| File / Folder | What it is |
|---|---|
| `app-framework.md` | Python framework — all 15 layers, new app checklist, terminology |
| `web-app-framework.md` | React + Supabase framework — same 15 layers, web implementation |
| `templates/` | Starter files for new projects |
| `snippets/` | Reusable code patterns ready to drop into any project |

### Templates

| File | Use for |
|---|---|
| `templates/CLAUDE.md` | Claude session context file for Python projects |
| `templates/CLAUDE-web.md` | Claude session context file for React + Supabase projects |
| `templates/project-structure.md` | Folder layout for Python projects |
| `templates/web-project-structure.md` | Folder layout for React + Vite + Supabase projects |

### Snippets

| File | What it is |
|---|---|
| `snippets/settings_store.py` | Python settings store — copy into config/settings_store.py |
| `snippets/logger.py` | Python logging layer — copy into tools/logger.py |
| `snippets/useSettings.js` | React settings store hook — copy into src/hooks/useSettings.js |
| `snippets/useFeatureFlags.js` | React feature flag hook — copy into src/hooks/useFeatureFlags.js |
| `snippets/logger.js` | React logging layer — copy into src/lib/logger.js |
| `snippets/constants.js` | Named constants pattern — copy into src/constants/index.js |

---

## The 15 layers

Every app I build includes these from day one, regardless of stack:

1. **Settings store** — single source of truth, always live, never cached at startup
2. **Feature flags** — every behavior has an on/off switch visible in the UI
3. **Debug layer** — all debug output through one central function, controlled by settings
4. **Modularity** — every file has one job, folder structure is consistent across projects
5. **Status and visibility** — health and state always shown regardless of what's enabled
6. **Error handling** — designed in, not patched on; fail loudly in dev, gracefully in production
7. **Logging** — persistent record separate from debug output, with log levels used correctly
8. **Code commenting** — comments explain why, not what; every function has a docstring
9. **Data model first** — define data shapes before writing logic
10. **Interface before implementation** — define inputs and outputs before writing the inside
11. **Defensive programming** — never assume; verify, handle, log, and move on
12. **Git as a thinking tool** — main is always working; branches are for experiments
13. **No magic numbers** — all named values in constants files with comments
14. **Repo hygiene** — root stays clean; every file has a reason to be there
15. **CLAUDE.md context** — session continuity file, always present, always updated

---

## How to use this in a new project

**Python project:**
1. Read `app-framework.md` before writing any code
1b. Read `web-frontend-design.md` before writing any CSS
2. Copy `templates/CLAUDE.md` into the project root and fill it in
3. Copy `templates/project-structure.md` and use it as the folder layout
4. Copy relevant snippets from `snippets/`
5. Add this line to your project's README:
   > This project follows the standards in [Rekot24/dev-standards](https://github.com/Rekot24/dev-standards)

**React + Supabase project:**
1. Read `web-app-framework.md` before writing any code
2. Copy `templates/CLAUDE-web.md` into the project root and fill it in
3. Copy `templates/web-project-structure.md` and use it as the folder layout
4. Copy relevant snippets from `snippets/` into your `src/` folder
5. Add this line to your project's README:
   > This project follows the standards in [Rekot24/dev-standards](https://github.com/Rekot24/dev-standards)

---

*This document grows as new patterns are identified. Last updated: September 2026.*
