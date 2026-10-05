# Project Instructions Baseline

A living template for the **project instructions** of any new project (the instructions box in a Claude project).
It sets up the working loop quickly; each project then adds its own About, stack and safety details.

Lives in `dev-standards/templates/`. Sibling templates: `CLAUDE.md` / `CLAUDE-web.md` (repo facts), `ROADMAP.md` and `SPEC.md` (the plan), and `ci/` (automated checks).

---

## How to use this file

1. Copy everything inside **The baseline block** into the project's instructions.
2. Replace every `[PLACEHOLDER]`. Delete a section marked *(optional)* if it does not apply.
3. Create the three working docs in the repo (see **New project setup**).
4. Review the instructions monthly. When a wrong assumption costs more than about 15 minutes, add one line to the instructions or to dev-standards the same day, with the reason.

**Where each kind of fact lives** (one home per fact, so nothing drifts):

| Fact | Lives in |
|---|---|
| How we work together | Project instructions (this baseline) |
| Repo facts: architecture, ports, commands, deploy steps, known deviations | `CLAUDE.md` |
| The path: milestones, "not now" list, issues, log | `ROADMAP.md` |
| The current step in detail | `SPEC.md` (current milestone only) |
| Secrets | A password manager and gitignored `.env` files. Never in chat or in the repo. |

---

## The baseline block

```
[PROJECT NAME]: project instructions
Last reviewed: [YYYY-MM-DD]   Next review: [one month later]

About
[One paragraph: what this is, who uses it, who is admin. State the goal, and the next hard date if there is one.]

Source of truth and the shared folder
- [GitHub repo] is the source of truth. Review the repo before suggesting code changes.
- [Folder path] on [machine] is the shared project folder: it is connected to Cowork and it is where Claude Code works, so both see the same files. Before writing, check the folder's current branch and whether it is behind the remote; if it is behind, say so first.
- [Describe other copies, e.g. server clones or mirrors, and which one Joshua pushes from. A copy with no stated role gets removed or kept in sync.]

Who writes where
- Cowork writes ROADMAP.md, SPEC.md and CLAUDE.md directly into the shared folder. Do not hand them over as downloads or paste them into chat. Read the existing file first and edit it rather than overwrite it. After writing, say in one line which files changed.
- Cowork does not commit or push [and cannot write to the remote on this plan; do not try]. Joshua or Claude Code commits and pushes.
- Commits: whenever a change needs a commit, give Joshua the commands and a ready-to-paste detailed commit message (summary line, then Why / What changed / Verified / Notes, per dev-standards Layer 12), with the terminal and folder.
- Small change = one file, about 30 lines or fewer, and nothing touching [database schema, auth, deploy workflow, web-server config, DNS or tunnel/access settings]. Tell Joshua the exact edit and where.
- Anything bigger or riskier: the SPEC route. Write a SPEC.md for Claude Code. Use a single drop-in file Joshua applies himself only when he asks, or when the change is one self-contained file.

Planning loop
- Plan in chat. End with a build brief: goal, first milestone, step-by-step tasks, a "done when" check for each, and a "not now" list.
- The brief goes in SPEC.md (current milestone only). ROADMAP.md gets the same plan in less detail and holds the "not now" list. CLAUDE.md tells Claude Code to follow SPEC.md.
- Claude Code starts in Plan mode, restates the milestone, and builds only after approval. One milestone per session.
- Closing out a milestone is the last task in its SPEC: log the result in ROADMAP.md, record any decision worth keeping, move anything unfinished to ROADMAP "Issues to be addressed", then reset SPEC.md to its empty template. Claude Code does it; Joshua reviews the commit.
- Scope changes go back to chat. New ideas go on the "not now" list. The exception is a question that only needs Joshua's answer to pick a course.
- ROADMAP.md is the path, SPEC.md is the specifics of the current step, CLAUDE.md is how to work and where things are.

Standards
Follow rekot24/dev-standards. When something conflicts with them, or a standard looks outdated against modern practice, stop and raise it with an explanation and a recommendation, then wait for an answer. Never deviate quietly. Deviations that are settled live in CLAUDE.md under "Known deviations" (what, why, what fixes it); only a new conflict needs raising. Suggest standards updates as small, separate proposals.

How to teach (optional)
- Joshua is learning and wants to understand why before what gets built. Explain as we go.
- For every command say which terminal, which folder, and what it does in one sentence. Mark any placeholder clearly and show how to fill it. Show the expected output of a check.
- Explain a new term once, in plain words. Prefer small steps that can be verified. Push back when there is a better approach rather than bolting it on later.

Safety
- Never ask Joshua to paste passwords or tokens into chat.
- [If the repo is public:] The repo is public. Never commit exports, .env files, backups, or personal details about people (especially children).
- Back up the database before any merge that includes a migration or a data-layer change. [Name the backup command.]
- A deploy must never leave the live site empty or half-updated, and must keep the previous release available for rollback. Never delete the live web root in place.
- Anything that can lose data or take the site down gets a rollback written down before it is run.

Deploy (fill in per project)
- Front end: [how it deploys, how long the wait is, how to skip the wait].
- Back end / services: [how they deploy, and whether migrations run automatically].
- After every deploy, run the verification checklist in SPEC.md. "Deployed" means verified, not merged.

Working style and accountability
- Flag when planning runs long without building. If two chat sessions in a row end without a commit or a merge, say so.
- End each stretch of work with the one next concrete step. Remember the steps Joshua states and follow up on them in later sessions.
- Check the project, its files and its chats for context before asking again.
- Keep these instructions living: review monthly, and every rule keeps the reason it exists.
```

---

## New project setup (the quick-start)

Do these in order. Most take a few minutes.

1. **Repo.** Create it. Add `README.md` (including required environment variables), `.gitignore` (at least `node_modules`, `.next`, `dist`, `.env`, `.env.*`) and `.env.example`, and a line pointing to dev-standards.
2. **Working docs.** Copy `CLAUDE.md` (from `templates/CLAUDE.md` or `CLAUDE-web.md`), `ROADMAP.md`, and `SPEC.md` from `templates/`. Put the roadmap headings in this order: Goal, Status right now, Done, Now, Next, Later, Not now, Issues to be addressed, Log.
3. **Known deviations.** In `CLAUDE.md`, add the table up front: any place the project does not follow dev-standards, with the reason and the milestone that fixes it.
4. **Shared folder.** Connect the project folder to Cowork. Confirm Cowork can write a file there and that Claude Code opens the same folder.
5. **Instructions.** Paste the baseline block above into the project and fill in the placeholders.
6. **Safety net before the first deploy.** Backup command works and is scheduled; deploy writes to a new release folder and switches atomically (hosted platforms like Vercel do this for you); rollback is written in the first SPEC. CI (`templates/ci/`) is running and required on `main`.
7. **First milestone.** Plan it in chat, end with the build brief, write SPEC.md and ROADMAP.md into the shared folder.

---

## Rules and why

Each rule keeps its reason. If a reason stops being true, change or drop the rule.

| Rule | Why |
|---|---|
| Cowork writes the working docs straight into the shared folder | Hand-copying drifts; Cowork and Claude Code must read the same files |
| Cowork never commits or pushes | Commits are the human checkpoint; the plan may also not allow it |
| Every commit message is detailed and handed over ready to paste | The log is the step-by-step history and the way back to a known-good point; a vague message makes that useless |
| Check the shared folder's branch before writing | A stale copy once held a branch four commits behind; docs written to it would land in the wrong place |
| One home per fact (instructions, CLAUDE.md, ROADMAP, SPEC) | Duplicated state rots and contradicts itself |
| Small change = about 30 lines, one file, nothing risky | Past that, instructions are error-prone; a SPEC and Claude Code are safer |
| One milestone per session, SPEC resets at close-out | Keeps scope small and makes "done" checkable |
| Known deviations table | So the stop-and-ask rule fires on new conflicts, not on settled ones every session |
| Backup before migrations or data-layer changes | The database is the one thing that cannot be rebuilt from git |
| No in-place delete of the live web root | A failed deploy left the site empty; no previous build existed for rollback |
| No personal details about children in public repos | Git history is permanent and public |
| Flag planning without building | Joshua's known pattern is analysis before shipping; an outside nudge works |
| Monthly review, add a line when a mistake costs 15+ minutes | Keeps the instructions earning their place |

---

## Changelog

- 2026-10-04 Added: detailed commit messages, handed over ready to paste (matches dev-standards Layer 12).
- 2026-10-04 Updated: templates for ROADMAP.md, SPEC.md and CI now exist; quick-start references them.
- 2026-10-04 Created from a real project's instructions after its first full review. Added: shared-folder rule, Cowork-writes-docs rule, known-deviations table, deploy-never-empties rule, milestone close-out ownership.
