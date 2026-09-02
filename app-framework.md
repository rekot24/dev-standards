# My App Framework — Personal Development Standard

> This document is a living reference. Every app I build starts here.
> When I run into a pattern I had to bolt on later, I add it here so the next app gets it from day one.

---

## The core problem this solves

Every app I've built has eventually needed the same things: a way to see what it's doing, a way to turn pieces on and off without restarting, a way to debug individual features, and code organized so pieces can be reused. This document locks those in as defaults — not afterthoughts.

---

## Layer 1 — Settings store (the config layer)

### What it is
A single source of truth for every on/off switch and configurable value in the app. Every feature reads from it. The UI writes to it. Nothing else talks directly to anything else.

### Why it matters
If settings are read once at startup, you have to restart to change behavior. If settings are scattered across files, you can never find them. The settings store fixes both — one place, always live.

### The rule
> Every feature checks its own enabled flag on every run, not once at startup.

### What it contains
- Feature flags (enabled/disabled per feature)
- Per-device or per-instance overrides
- Timer values, thresholds, intervals
- Debug flags (see Layer 3)

### How it behaves
- Loads from disk on startup
- Saves to disk automatically when changed
- Lives in memory as a live object
- UI checkbox changes → store updates → feature changes behavior on next cycle
- No restart required. No "apply" button. Changes are immediate.

### The pattern (every app)
```
UI changes a setting
      ↓
Settings store updates (memory + disk)
      ↓
Feature reads store on next cycle
      ↓
Behavior changes immediately
```

### File convention
```
config/
  settings.json       ← persisted values
  settings_schema.py  ← what fields exist, their types, defaults
  settings_store.py   ← the live object the app reads from
```

---

## Layer 2 — Feature flags (visibility and control)

### What it is
Every feature the app can perform has an explicit on/off switch, visible in the UI, readable in the settings store, and checked by the feature itself before it runs.

### Why it matters
Without this, there's no way to isolate what the app is doing. Can't troubleshoot. Can't test one thing without everything else running. Can't disable a broken feature without touching code.

### The rule
> No feature runs unconditionally. Every feature asks "am I enabled?" before doing anything.

### What qualifies as a feature
- Any detection behavior
- Any automated action
- Any health response (sleep on low battery, pause on high temp)
- Any timer-based behavior
- Any network or external call

### How it looks in code
```python
# At the start of every feature function:
if not self.settings.features.auto_farm_reset_enabled:
    return
```

### UI representation
Every feature flag appears as a labeled checkbox in the device or app settings panel. Grouped logically:
- Detectors
- Actions
- Health responses
- Timers

### Profiles
A profile is a named snapshot of all feature flag states for a device or context. Save current flags → profile. Load profile → restores flags. Profiles live in the settings store.

---

## Layer 3 — Debug layer

### What it is
A dedicated debug system that is always present in every app, controlled by its own settings flags. Debug output flows through one central function — never scattered print statements.

### Why it matters
Debugging scattered across code is impossible to turn off cleanly. A debug layer means: one toggle turns all debug output on or off. Additional toggles control specific debug categories so you can isolate exactly what you're watching.

### The rule
> No raw print statements for debugging. All debug output goes through the debug logger. In production, the flag is off and nothing leaks.

### Debug settings structure
```
debug:
  enabled: true/false          ← master switch, turns all debug output on/off
  log_state_changes: true      ← log when a device changes state
  log_detections: false        ← log every detector result
  log_actions: true            ← log every action taken
  log_health: false            ← log every health check result
  log_config_reads: false      ← log when settings are read (deep debugging)
  screenshot_on_event: false   ← save screenshot when specific events occur
  screenshot_dir: "./debug"
```

### How it looks in code
```python
# Never do this:
print(f"state changed to {state}")

# Always do this:
self._debug("state_changes", f"state changed to {state}")

# The debug function checks the flag before outputting:
def _debug(self, category: str, msg: str):
    if not self.settings.debug.enabled:
        return
    if not getattr(self.settings.debug, f"log_{category}", False):
        return
    self._log(f"[DEBUG:{category}] {msg}")
```

### UI representation
Debug section in settings panel, collapsed by default:
- Master debug toggle
- Per-category checkboxes underneath it
- Screenshot directory path

---

## Layer 4 — Modularity standard

### What it is
Every piece of the app has one job. Files are organized by what they are responsible for, not by when they were written.

### Why it matters
Modular code can be understood one piece at a time. It can be reused in other apps. It can be tested in isolation. A bug in one module doesn't require reading the whole codebase to find.

### The rule
> If a file does more than one thing, it should be two files.

### Standard folder structure
```
project/
  main.py               ← entry point only, wires pieces together
  config/               ← settings store, schema, loader
  core/                 ← the main logic (workers, managers)
  detection/            ← screen reading, template matching
  actions/              ← things the app does (clicks, launches)
  ui/                   ← display only, never writes to workers directly
  tools/                ← reusable utilities (ADB, timers, file helpers)
  assets/               ← images, templates, static files
  profiles/             ← saved named configurations
```

### Reusability checklist
Before writing a utility function, ask:
- Could this be useful in another app?
- Is it tied to this specific app's logic, or is it general?

If it's general → it goes in `tools/` and gets written cleanly enough to copy to another project.

### The UI rule
The UI never writes to workers directly. The UI never calls feature functions directly. The UI only reads status and writes to the settings store. This is non-negotiable.

```
UI → Settings store → Worker reads → Worker acts
UI reads ← Worker writes status
```

---

## Layer 5 — Status and visibility

### What it is
Every running component surfaces its current state in a way the UI can display without interrupting the component's work.

### Why it matters
If you can't see what the app is doing, you're flying blind. Status should always be visible — not just when something goes wrong.

### The rule
> Health stats and state are always visible, regardless of what features are enabled or disabled.

### What is always shown (regardless of feature flags)
- Connection status (ADB, network, whatever applies)
- Health metrics (battery, temperature, uptime)
- Current state of each worker/device
- Last action taken and when
- How many features are enabled vs total available

### What is conditionally shown
- Debug output (behind debug flag)
- Detailed detection results (behind debug flag)
- Timing breakdowns (behind debug flag)

---

## Pushback standard

### The rule
If I ask for something that works but isn't the best approach, say so before building it. Explain what the better approach is and why. Give me the choice.

### Why
I learn by building. If I build the wrong pattern, I bolt on the right one later and resent it. Better to know the options upfront and choose intentionally.

### What this looks like
> "That will work, but the standard approach for this is X because Y. Want me to do it that way instead?"

Not: just build what was asked and let me figure it out later.

---

## Terminology reference (plain English)

These are the terms used in professional settings that map to what I already understand intuitively:

| Term | What it actually means |
|---|---|
| Settings store | The one place all on/off switches and values live |
| Feature flag | An on/off switch for a specific behavior |
| Single source of truth | One place holds the real value — nothing caches its own copy |
| Reactive / live settings | Behavior changes immediately when a setting changes, no restart |
| Modular | Each file/function has one job; pieces can be used independently |
| Separation of concerns | UI does UI. Logic does logic. Config does config. They don't cross. |
| Debug layer | A dedicated system for debug output with its own on/off control |
| Profile | A saved named snapshot of a group of settings |
| Entry point | The one file that starts everything and wires pieces together (main.py) |
| Config schema | The definition of what settings exist, their types, and their defaults |

---

## New app checklist

Before writing any feature code, these must exist:

- [ ] Settings store with schema and defaults
- [ ] Debug layer wired to settings store
- [ ] Folder structure following the standard above
- [ ] UI reads status, writes to store only — never calls workers directly
- [ ] Every feature has an enabled flag in the settings store
- [ ] README describing what the app does and what each folder is responsible for

---

*Last updated: September 2026*
*This document grows as new patterns are identified.*

---

## Layer 6 — Error handling

### What it is
A deliberate, designed response to everything that can go wrong. Not an afterthought. Not a patch. Built in from the start, at every level of the app.

### Why it matters
An app without error handling either crashes silently or crashes loudly at the worst moment. An app with error handling fails gracefully — it tells you what went wrong, recovers where it can, and never leaves things in a broken in-between state.

### The rule
> Every function that can fail must decide: can I recover from this, or do I need to tell someone?

### Two modes — by design
**Development mode:** fail loudly. Raise the error. Surface it. Don't hide it. You need to see it to fix it.

**Production mode:** fail gracefully. Log the error with full detail. Take the safest fallback action. Keep running where possible.

This is controlled by the debug/settings layer — not hardcoded.

### Error handling levels
```
Function level   → handle expected failures locally, log unexpected ones
Module level     → catch errors that escape functions, log and recover
App level        → catch anything that reaches the top, log and shut down cleanly
```

### What good error handling looks like
```python
def capture_frame(self):
    try:
        frame = self._backend.get_frame()
        if frame is None:
            self._log_error("capture", "Frame returned None — skipping iteration")
            return None
        return frame
    except ConnectionError as e:
        self._log_error("capture", f"ADB connection lost: {e}")
        self._set_state(STATE_ADB_LOST)
        return None
    except Exception as e:
        self._log_error("capture", f"Unexpected error: {type(e).__name__}: {e}")
        raise  # unexpected errors bubble up — don't silently swallow them
```

### What to never do
- Never use a bare `except:` that swallows everything silently
- Never let an error fail with no record of what happened
- Never crash without cleaning up (closing connections, saving state)

### VBA parallel
This is the same mindset as `On Error GoTo` in VBA — but Python gives you much more control over which errors you catch, what you do with them, and whether you recover or escalate.

---

## Layer 7 — Logging (separate from debugging)

### The distinction
**Debug output** is for right now, while you're watching. It answers: what is the app doing this second?

**Logging** is a persistent record of what the app did over time. It answers: what happened, when, and in what order — after the fact, even if you weren't watching.

### Why both matter
Debug output disappears when the session ends. A log file doesn't. When something goes wrong at 3am while the farm is running unattended, the log tells you what happened. Debug output is already gone.

### Log levels — in plain English
```
DEBUG    → fine detail, only useful while actively developing (controlled by debug flag)
INFO     → normal operation milestones ("worker started", "state changed", "profile loaded")
WARNING  → something unexpected but recoverable ("frame capture returned None, retrying")
ERROR    → something failed that shouldn't have ("ADB disconnected unexpectedly")
CRITICAL → app cannot continue ("config file missing or corrupt")
```

### The rule
> Log levels are not decoration. Use them correctly so you can filter later.
> In production, DEBUG is off. INFO and above always runs.

### Log file structure
```
logs/
  app.log          ← current session, rotating (doesn't grow forever)
  app.log.1        ← previous session
  errors.log       ← errors and criticals only, always on
```

### How it connects to settings
```
logging:
  enabled: true
  level: INFO              ← minimum level to write (DEBUG/INFO/WARNING/ERROR)
  log_to_file: true
  log_to_console: true
  max_file_size_mb: 10
  backup_count: 3          ← how many old log files to keep
```

### The unified log function pattern
One function handles all output. Debug, logging, and UI display all flow through it.
```python
def _log(self, msg: str, level: str = "INFO"):
    # Write to log file
    # Write to UI queue
    # Write to console if enabled
    # Debug detail goes through _debug(), which calls _log() at DEBUG level
```

---

## Layer 8 — Code commenting standard

### Why comments matter
Code tells you what is happening. Comments tell you why. Six months from now, the what is readable. The why is gone unless you wrote it down.

### The rule
> Write comments for the person who reads this next — including yourself in six months.
> If you had to think about a decision for more than thirty seconds, comment it.

### What gets a comment
- Every function: one line describing what it does and what it returns
- Every non-obvious decision: why this approach, not another
- Every workaround or hack: what the real problem is and why this is the temporary fix
- Every magic number or threshold: where it came from and what it means

### What does not get a comment
- Things that are obvious from the code itself
- Restating what the code does in English (`x = x + 1  # add 1 to x`)

### Comment types
```python
# --- Section headers use dashes to visually separate major blocks ---

def capture_frame(self) -> Optional[np.ndarray]:
    """
    Capture one screenshot from the device via the active backend.
    Returns None if capture fails — caller must handle None gracefully.
    """

# Samsung devices ignore ADB screen timeout commands due to Knox.
# Keep-alive tap is the workaround. See device_notes.md for full context.
if self.cfg.requires_keepalive_tap:
    self._send_keepalive_tap()

# 2147483647 = max int32 — effectively "never timeout"
screen_timeout = 2147483647
```

### Docstrings (function-level comments)
Every function gets one. Format:
```python
def resolve_state(results: dict, profile: str) -> str:
    """
    Evaluate detection results against the profile's rule set.
    Returns the highest-priority matching state, or STATE_UNKNOWN if nothing matches.

    Args:
        results : detector_name -> DetectResult from current scan
        profile : profile name — selects which rule set to evaluate

    Returns:
        State string constant from bot.states
    """
```

---

## Layer 9 — Data model first

### What it is
Before writing any feature, define the shape of the data it works with. What does it accept? What does it produce? What does it store?

### Why it matters
Fuzzy data models cause constant refactoring. When you know exactly what shape your data is, the code that handles it becomes obvious. When you don't, you end up patching mismatches between what one function produces and what another expects.

### The rule
> Define data shapes before writing logic. The logic follows naturally from clear data.

### What this looks like
```python
# Define the shape first — what does a detection result look like?
@dataclass
class DetectResult:
    detector_name: str
    found: bool
    score: float
    location: Optional[tuple]   # (x, y) center of match, or None
    click_target: Optional[tuple]

# Now write the logic that produces it — the shape is already locked in
```

### Connection to brainstorming
This is the programming version of exploring every facet before committing. Defining data shapes is committing to what the app knows and passes around. Do it before writing features, not after.

---

## Layer 10 — Interface before implementation

### What it is
Before writing how a function works, write what it promises — what it accepts and what it returns. This is the contract. The implementation fulfills the contract.

### Why it matters
It forces clear thinking about module boundaries before getting lost in details. It also means other parts of the app can be written against the promise before the inside exists.

### What this looks like
```python
# Write this first — the contract:
def run_detectors(
    frame: np.ndarray,
    enabled_detectors: list[str],
    threshold: float,
) -> dict[str, DetectResult]:
    """Run only the enabled detectors against the frame. Return all results."""
    ...  # implementation comes after the contract is clear

# Then write the implementation to fulfill it.
```

### The habit
For every new module or function: name it, define its inputs, define its outputs, write the docstring. Then implement. Never the other way around.

---

## Layer 11 — Defensive programming

### What it is
Writing code that handles what goes wrong, not just what goes right. Every assumption you make about input, connection state, or external behavior is a potential failure point. Defensive programming names those assumptions and handles them explicitly.

### Why it matters
The happy path is easy. Real apps live on the edges — bad input, dropped connections, unexpected state, files that don't exist. Defensive programming is what separates an app that works in testing from one that works in production.

### The rule
> Never assume. Verify. Handle the failure case before writing the success case.

### Defensive checks to always make
- Config file exists and is valid before using it
- Connection is live before sending commands
- Function inputs are the expected type and range
- External calls can fail — always handle the failure
- State transitions are valid — log and recover if they're not

### The paralysis connection
Defensive programming is the productive form of thinking through every scenario. The difference: in code, you don't have to solve every edge case perfectly upfront. You name it, handle it safely, log it, and move on. The app keeps running. You fix the edge case properly later when you have more information.

```python
# Defensive: check before assuming
def load_profile(self, name: str) -> Optional[Profile]:
    path = self.profiles_dir / f"{name}.json"
    if not path.exists():
        self._log_warning(f"Profile '{name}' not found at {path}")
        return None
    try:
        return Profile.from_file(path)
    except Exception as e:
        self._log_error(f"Profile '{name}' failed to load: {e}")
        return None
```

---

## Layer 12 — Git as a thinking tool

### What it is
Git is not just a save button. It's a way to think and experiment safely.

### The branching habit
- `main` branch is always working. Never commit broken code to main.
- Every new feature or experiment gets its own branch.
- Try things on the branch. If it works, merge. If it doesn't, delete and nothing is lost.

### Commit message standard
Bad: `fixed stuff`
Good: `fix: ADB reconnect no longer blocks the main loop`

The message explains why the change was made, not just what changed. Future you will thank present you.

### Refactoring and Git
Refactoring is changing how code is written without changing what it does. Git makes it safe:
1. Branch off main
2. Refactor
3. Verify the app still works the same way
4. Merge back

If the refactor goes wrong, delete the branch. Nothing lost. This is the cure for the fear of touching working code.

### Commit often
Small, focused commits are better than large ones. One commit = one logical change. If you have to use "and" in the commit message, it should probably be two commits.

---

## Updated new app checklist

Before writing any feature code, these must exist:

- [ ] Data models defined (what shape is the data?)
- [ ] Settings store with schema and defaults
- [ ] Debug layer wired to settings store
- [ ] Logging layer with levels and file output
- [ ] Error handling strategy decided (what fails loudly vs gracefully?)
- [ ] Folder structure following the standard above
- [ ] Interface signatures written for major modules (inputs and outputs defined)
- [ ] UI reads status and writes to store only — never calls workers directly
- [ ] Every feature has an enabled flag in the settings store
- [ ] Git repo initialized, main branch protected, first commit made
- [ ] README describing what the app does and what each folder is responsible for

---

## On testing (future layer)

Testing is writing small automated checks that verify individual pieces of your code work correctly. When you change something, tests tell you immediately if you broke something else.

This is not yet part of my standard workflow. It belongs here as a future layer to learn and incorporate. The payoff is the ability to refactor confidently — change code without fear that something invisible broke.

*To be expanded when this becomes part of the workflow.*

---

*Last updated: September 2026*
*This document grows as new patterns are identified and learned.*

---

## Layer 13 — No magic numbers (or magic strings)

### What it is
No raw values sitting in logic code with no explanation of what they are or where they came from. If a number or string means something, it gets a name.

### Why it matters
A raw number in the middle of code is unreadable to anyone — including yourself six months later. A named constant is self-documenting and changeable in one place instead of hunting through every file.

### The rule
> Every meaningful value gets a name. Every name gets a comment if the value isn't obvious.

### What it looks like
```python
# Bad — what is 2147483647? Why that number?
screen_timeout = 2147483647

# Good — named, explained
MAX_INT32 = 2147483647   # max 32-bit integer — used as "never timeout"
screen_timeout = MAX_INT32
```

### Applies to strings too
```python
# Bad
if state == "IN_RUN":

# Good
STATE_IN_RUN = "IN_RUN"
if state == STATE_IN_RUN:
```

### Where constants live
All named constants go in a dedicated file — not scattered across modules.
```
config/
  constants.py    ← all named values, grouped and commented
```

---

## Layer 14 — Repo hygiene

### What it is
Every file in the repo has a reason to be there. The root stays clean. Working files that are done either move to `docs/` or get deleted.

### Why it matters
A cluttered repo is hard to navigate and hard to hand off to Claude Code or another developer. A clean repo communicates professionalism and makes the structure obvious at a glance.

### The rule
> The root of the repo only contains files that are actively useful right now.

### Standard root — nothing else
```
README.md         ← always — what this app is and how to run it
CLAUDE.md         ← always — context file for Claude Code sessions
ROADMAP.md        ← always — living document, future work and known issues
.gitignore        ← always
main.py           ← entry point (or index.js, etc.)
requirements.txt  ← dependencies
```

### Working files lifecycle
- `AUDIT.md` — created during an audit pass; once all items are resolved, summarize completion in ROADMAP.md and delete or move to `docs/`
- Implementation notes — go in CLAUDE.md session log, not loose files
- Experiment files — on a branch, never committed to main

### The `docs/` folder
Historical reference, architecture decisions, completed audits. Stuff worth keeping but not actively needed day to day.
```
docs/
  audit-2026-09.md       ← completed audits, archived for reference
  decisions.md           ← major architectural decisions and why
```

### ROADMAP.md is permanent and living
Not just for audit items. Anything worth tracking goes here:
- Future features
- Known issues
- Ideas to revisit
- Technical debt notes
- Completed milestones (checked off, not deleted — history matters)

---

## Layer 15 — Claude Code context (CLAUDE.md)

### What it is
A file named `CLAUDE.md` in the root of every repo. Claude Code reads this automatically at the start of every session. It is the briefing — everything Claude Code needs to know to work in this project without rediscovering it from scratch.

### Why it matters
Claude Code has no memory between sessions. Without CLAUDE.md, every session starts cold — it rediscovers the structure, re-asks questions that were already answered, and risks repeating decisions that were already made and rejected. CLAUDE.md is the continuity layer between sessions.

### The rule
> The last thing you do in every Claude Code session is tell it to update CLAUDE.md with what was done, what was decided, and what the current state is.

This does not need to be in the prompt every time — it is in CLAUDE.md itself as a standing instruction. Claude Code reads it at the start, follows it at the end.

### What CLAUDE.md contains

**Project summary** — what the app does in 2-3 sentences.

**Standards pointer** — direct link to dev-standards repo. Claude Code reads the rules before touching anything.

**Architecture map** — key files and what each one is responsible for. How they connect. So it doesn't have to rediscover structure every session.

**Key decisions** — choices made intentionally with the reason why. Prevents relitigating the same decisions next session.

**Tried and rejected** — what was attempted and abandoned, and why. Just as important as what was kept. Prevents going back to approaches that already failed.

**Current state** — what's working, what's in progress, what's known broken.

**Session log** — dated list of what each session did. Meaningful changes and decisions only — not every line changed.

**Standing instructions** — rules Claude Code follows every session without being told. Including the rule to update this file before closing.

### CLAUDE.md template
```markdown
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
[Key files and what each one does — one line each]
- main.py — entry point only, wires everything together
- config/settings_store.py — live settings object, single source of truth
- [add files as the project grows]

## Key decisions
[Date and reason for each intentional architectural choice]
- [YYYY-MM-DD] Chose X over Y because Z

## Tried and rejected
[What was attempted and why it was abandoned — do not revisit these]
- [YYYY-MM-DD] Attempted X — abandoned because Y

## Current state
- Working: []
- In progress: []
- Known broken: []

## Session log
[Most recent first. Date, what changed, what was decided.]
### [YYYY-MM-DD]
- 

---

## Standing instructions
These apply every session without being included in the prompt:

1. Read this file fully before touching any code.
2. Read app-framework.md from the dev-standards repo before any architectural work.
3. Before building anything, explain what you are going to do and why. Wait for confirmation.
4. Flag anything that conflicts with dev-standards before proceeding.
5. No magic numbers or magic strings — all values go in constants.py with a comment.
6. No raw print statements — all output through the logger.
7. Every function gets a docstring before implementation.
8. At the end of every session, update this file:
   - Add a dated entry to the session log
   - Update current state (working / in progress / known broken)
   - Add any new decisions to key decisions
   - Add anything tried and abandoned to tried and rejected
   - Commit the updated CLAUDE.md as the final commit of the session
```

### Where it lives
Root of every repo, always. It is the first file created when a repo is initialized, after README.md.

### What it is not
- Not a substitute for code comments — those still explain the why inside the code
- Not a place for implementation details — those live in the code and docstrings
- Not optional — a repo without CLAUDE.md starts every session blind

---

## Updated new app checklist

Before writing any feature code, these must exist:

- [ ] CLAUDE.md created with standards pointer and standing instructions
- [ ] README.md describing what the app does and how to run it
- [ ] ROADMAP.md initialized (even if mostly empty)
- [ ] .gitignore configured
- [ ] Git repo initialized, first commit made
- [ ] Data models defined (what shape is the data?)
- [ ] constants.py created (even if empty — establishes the pattern)
- [ ] Settings store with schema and defaults
- [ ] Debug layer wired to settings store
- [ ] Logging layer with levels and file output
- [ ] Error handling strategy decided (what fails loudly vs gracefully?)
- [ ] Folder structure following the standard above
- [ ] Interface signatures written for major modules (inputs and outputs defined)
- [ ] UI reads status and writes to store only — never calls workers directly
- [ ] Every feature has an enabled flag in the settings store

---

*Last updated: September 2026*
*This document grows as new patterns are identified and learned.*
