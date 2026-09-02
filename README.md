# dev-standards

Personal development standards, architecture framework, and reusable patterns for all projects.

---

## What this is

Every app I build follows the patterns in this repo. This is not a tutorial — it's a living reference built from real experience: what worked, what I had to bolt on later and wished I hadn't, and the principles I've arrived at through building actual things.

When I start a new project, this repo is the first thing I reference.

---

## Contents

| File / Folder | What it is |
|---|---|
| `app-framework.md` | The core framework — all 12 layers, the new app checklist, and terminology reference |
| `templates/` | Starter folder structures and config schemas for new projects |
| `snippets/` | Reusable code patterns ready to drop into any project |

---

## The 12 layers

Every app I build includes these from day one:

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

---

## How to use this in a new project

1. Read `app-framework.md` before writing any code
2. Run through the new app checklist at the bottom of that file
3. Copy the relevant starter structure from `templates/`
4. Add this line to your project's README:
   > This project follows the standards in [Rekot24/dev-standards](https://github.com/Rekot24/dev-standards)

---

*This document grows as new patterns are identified. Last updated: September 2026.*
