# CLAUDE.md

> This file is read automatically at the start of every Claude Code session.
> Follow all standing instructions below without being prompted.

---

## Project summary
[What this app does in 2-3 sentences. Who uses it. What problem it solves.]

## Standards
This project follows https://github.com/Rekot24/dev-standards
Read app-framework.md before making any architectural decisions.
If asked to do something that conflicts with those standards, flag it before proceeding.

## Known deviations
*Places this project does NOT follow dev-standards. Settled deviations are not re-raised each session;
only a NEW conflict is. Every row names what fixes it. Write "None yet" if empty.*

| Deviation | Why | What fixes it (milestone) |
|---|---|---|
| [e.g. UI calls a worker directly] | [reason] | [milestone] |

## Working docs
- `ROADMAP.md` — the path: goal, milestones, "not now" list, issues, log
- `SPEC.md` — the **current milestone only**. Follow it. Build only what it lists.
- This file — how to work here and where things are

## Toolchain
Python [version] · uv · ruff · pytest · pre-commit  (see app-framework.md "Toolchain")

## Architecture
[Key files and what each one does — one line each. Update as the project grows.]
- main.py — entry point only, wires everything together
- config/settings_store.py — live settings object, single source of truth
- config/constants.py — all named constants, no magic numbers anywhere else

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
[Most recent first. Date, what changed, what was decided. Not every line — meaningful changes only.]

### [YYYY-MM-DD]
- Initial project setup

---

## Standing instructions

These apply every session without being included in the prompt:

1. Read this file fully before touching any code.
2. Read app-framework.md from https://github.com/Rekot24/dev-standards before any architectural work.
3. Follow `SPEC.md` for the current milestone. New ideas go on the "Not now" list in `ROADMAP.md`, not into the build.
4. Start in plan mode: explain what you will do and why, and wait for confirmation. One milestone per session.
5. Flag anything that conflicts with dev-standards before proceeding — unless it is already in **Known deviations**. Do not comply silently.
6. No magic numbers or magic strings — all named values go in config/constants.py with a comment explaining what they mean and where they came from.
7. No raw print statements — all output goes through the logger (ruff enforces this).
8. Every function gets a docstring before implementation is written.
9. All error handling follows the two-mode pattern: fail loudly in development, fail gracefully in production. Never a bare `except:`.
10. No feature runs unconditionally — every feature checks its enabled flag in the settings store before doing anything.
11. Pure logic gets pytest tests; every bug fix starts with a failing test. Run `ruff` and `pytest` before committing.
12. Never commit secrets. Names of required variables go in `.env.example`. Never ask for passwords or tokens in chat.
13. Flag when planning runs long without building. If two sessions in a row end with no commit or merge, say so.
14. At the end of every session, before closing:
    - Add a dated entry to the session log above summarizing what was done and decided
    - Update current state (working / in progress / known broken)
    - Add any new architectural choices to key decisions
    - Add anything tried and abandoned to tried and rejected
    - Commit the updated CLAUDE.md as the final commit of the session with message: "docs: update CLAUDE.md session log [YYYY-MM-DD]"
