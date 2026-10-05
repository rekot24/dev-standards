# SPEC.md — [PROJECT NAME]

> The current milestone only, in detail. The AI executor builds from this file.
> At close-out: log the result in `ROADMAP.md`, move anything unfinished to "Issues to be addressed",
> then reset this file to the empty template below.

**Milestone:** [name — matches the "Now" item in ROADMAP.md]
**Status:** not started | in progress | blocked | done
**Last updated:** [YYYY-MM-DD]

---

## Goal
[One paragraph: what exists when this milestone is done that does not exist now, and why it matters.]

## Out of scope (not now)
- [Thing that will tempt scope creep — and where it is parked in ROADMAP "Not now"]

## Design notes
[Only what an implementer needs: data shapes, key interfaces, constraints, relevant standards layers.
Link to files instead of repeating them.]

- **Data model:** [tables/types added or changed — flag "migration required" if any]
- **Interfaces:** [function/hook/endpoint signatures: inputs → outputs]
- **Standards touched:** [e.g. Layer 2 feature flag `xyz`, Layer 17 RLS policy for `table`]

## Tasks
*Each task has a "done when" check that can be verified, not just believed.*

1. [ ] **[Task]**
   - Done when: [observable check]
2. [ ] **[Task]**
   - Done when: [observable check]
3. [ ] **Tests** — [what logic gets a test; regression test for any bug found]
   - Done when: CI is green
4. [ ] **Close-out** — update ROADMAP (Done, Log, Issues, Not now), record decisions, update CLAUDE.md, reset this file
   - Done when: the close-out commit is reviewed

## Risk and rollback
*Required for anything that can lose data or take the site/app down.*
- **Backup before:** [command or step]
- **Rollback:** [exact steps to return to the previous working state]

## Verification checklist (run after deploy — "deployed" means verified, not merged)
- [ ] [Observable check on the live system]
- [ ] [Observable check]
- [ ] Error tracker shows no new errors; logs show expected INFO entries

## Open questions
- [Question only the owner can answer] — [default if no answer]

---

<!--
EMPTY TEMPLATE FOR RESET (copy back over this file at close-out)
# SPEC.md — [PROJECT NAME]
**Milestone:** none   **Status:** idle   **Last updated:** [date]
No active milestone. Plan the next one in chat, then write it here.

WHAT THIS TEMPLATE SHOULD CONTAIN
- One milestone, never two
- Goal + explicit out-of-scope list
- Design notes limited to what the builder needs
- Tasks with verifiable "done when" lines
- Rollback written BEFORE the risky step
- A post-deploy verification list
-->
