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
3. Before building anything, explain what you are going to do and why. Wait for confirmation before proceeding.
4. Flag anything that conflicts with dev-standards before proceeding — do not just comply silently.
5. No magic numbers or magic strings — all named values go in config/constants.py with a comment explaining what they mean and where they came from.
6. No raw print statements — all output goes through the logger.
7. Every function gets a docstring before implementation is written.
8. All error handling follows the two-mode pattern: fail loudly in development, fail gracefully in production.
9. No feature runs unconditionally — every feature checks its enabled flag in the settings store before doing anything.
10. At the end of every session, before closing:
    - Add a dated entry to the session log above summarizing what was done and decided
    - Update current state (working / in progress / known broken)
    - Add any new architectural choices to key decisions
    - Add anything tried and abandoned to tried and rejected
    - Commit the updated CLAUDE.md as the final commit of the session with message: "docs: update CLAUDE.md session log [YYYY-MM-DD]"
