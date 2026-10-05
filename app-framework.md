# App Framework — Python (desktop / automation / services)

> A living reference. Every Python app starts here.
> When a pattern has to be bolted on later, it gets added here so the next app has it from day one.
> This document is **project-agnostic**. Real projects appear only as examples in the README's
> "Reference implementations" table and in `snippets/`.

---

## The core problem this solves

Every app eventually needs the same things: a way to see what it is doing, a way to switch pieces on and off
without restarting, a way to debug one feature at a time, code organized so pieces can be reused, and automated
checks that tell you when a change broke something. This document makes those defaults — not afterthoughts.

---

## The 17 layers

1. **Settings store** — single source of truth, always live
2. **Feature flags** — every behavior has an on/off switch
3. **Debug layer** — one central function, flag-controlled
4. **Modularity** — one job per file
5. **Status and visibility** — health and state always shown
6. **Error handling** — designed in, not patched on
7. **Logging** — persistent record, separate from debug output
8. **Code commenting** — why, not what
9. **Data model first** — shapes before logic
10. **Interface before implementation** — contract first
11. **Defensive programming** — verify, handle, log, move on
12. **Git as a thinking tool** — main always works
13. **No magic numbers** — named constants
14. **Repo hygiene** — clean root, every file has a reason
15. **CLAUDE.md context** — session continuity
16. **Testing** — automated checks on logic that must not break
17. **Security and secrets** — no secrets in code, validate all input

Plus the **Toolchain** section below (the tools that enforce the layers) and the **Pushback standard**.

---

## Toolchain (the modern Python baseline)

*Decided 2026-10-04. Each tool exists to enforce a layer automatically instead of relying on memory.*

| Tool | What it is, in plain English | Enforces |
|---|---|---|
| **`pyproject.toml`** | One config file for the project: its dependencies, Python version, and tool settings. Replaces scattering `requirements.txt`, `setup.py`, and per-tool config files. | Layer 14 |
| **uv** | A fast package and virtual-environment manager. Replaces `pip` + `venv` with one command, and writes a lockfile so every machine installs identical versions. (`pip` + `requirements.txt` still works; uv is the default for new projects.) | Reproducible installs |
| **ruff** | A linter *and* formatter in one fast tool. Catches bare `except:`, unused imports, stray `print` statements, and many real bugs the moment you save. | Layers 3, 6, 8 |
| **pytest** | The standard test runner. Tests are plain functions named `test_*`. | Layer 16 |
| **pyright** (or mypy) | A type checker. Reads your type hints and flags mismatches before you run the code. *Optional but recommended once the code has type hints.* | Layers 9, 10 |
| **pre-commit** | Runs ruff (and optionally tests) automatically before every `git commit`, so broken code can't enter the repo by accident. | Layer 12 |

Minimum for any new project: `pyproject.toml` + ruff + pytest + pre-commit. Add pyright when the codebase grows.

Starter files: `templates/project-structure.md` (layout and `pyproject.toml`) and `templates/ci/python-ci.yml`.

---

## Layer 1 — Settings store

### What it is
A single source of truth for every on/off switch and configurable value. Every feature reads from it. The UI writes to it.

### The rule
> Every feature checks its own enabled flag on every run, not once at startup.

### What it contains
- Feature flags (per feature)
- Per-instance overrides
- Timer values, thresholds, intervals
- Debug flags (Layer 3)

### How it behaves
- Loads from disk on startup; saves automatically on change
- Lives in memory as a live object
- UI checkbox change → store updates → feature changes behavior on its next cycle
- No restart. No "apply" button.

```
UI changes a setting → store updates (memory + disk) → feature reads store next cycle → behavior changes
```

### File convention
```
config/
  settings.json       ← persisted values (gitignored if machine-specific or sensitive)
  settings_schema.py  ← what fields exist, their types, defaults
  settings_store.py   ← the live object the app reads from   (snippets/settings_store.py)
```

---

## Layer 2 — Feature flags

### The rule
> No feature runs unconditionally. Every feature asks "am I enabled?" before doing anything.

### What qualifies as a feature
Any detection behavior, automated action, health response, timer-based behavior, or network/external call.

```python
# At the start of every feature function:
if not self.settings.features.auto_reset_enabled:
    return
```

### UI representation
Every flag is a labeled checkbox, grouped logically (detectors, actions, health responses, timers).

### Profiles
A profile is a named snapshot of all flag states. Save current flags → profile. Load profile → restores flags.

---

## Layer 3 — Debug layer

### The rule
> No raw `print` for debugging. All debug output goes through the debug logger.
> In production the flag is off and nothing leaks.

### Settings structure
```
debug:
  enabled: true/false        ← master switch
  log_state_changes: true
  log_detections: false
  log_actions: true
  log_config_reads: false    ← deep debugging
  screenshot_on_event: false
  screenshot_dir: "./debug"
```

### In code
```python
self._debug("state_changes", f"state changed to {state}")

def _debug(self, category: str, msg: str):
    if not self.settings.debug.enabled:
        return
    if not getattr(self.settings.debug, f"log_{category}", False):
        return
    self._log(f"[DEBUG:{category}] {msg}")
```
Ruff's `T201` rule flags stray `print()` so this layer checks itself.

---

## Layer 4 — Modularity

### The rule
> If a file does more than one thing, it should be two files.

### Standard structure
```
project/
  main.py               ← entry point only; wires pieces together
  pyproject.toml        ← dependencies and tool config
  src or package folder ← (or top-level folders below for small apps)
  config/               ← settings store, schema, constants
  core/                 ← main logic (workers, managers)
  detection/            ← input reading, pattern matching, sensors
  actions/              ← things the app does
  ui/                   ← display only; never writes to workers directly
  tools/                ← reusable utilities, general enough to copy elsewhere
  assets/  profiles/  tests/
```

### Reusability check
Before writing a utility: could another app use it? If general → `tools/`, written cleanly enough to copy.

### The UI rule
> The UI never writes to workers directly and never calls feature functions directly.
> The UI reads status and writes to the settings store. Non-negotiable.

```
UI → Settings store → Worker reads → Worker acts
UI reads ← Worker writes status
```

### Headless-ready
Keep the entry point separate from the UI (`main.py` wires; a UI is just one client). Then the same core can run
without a display — on a server, in a container, or under test.

---

## Layer 5 — Status and visibility

### The rule
> Health stats and state are always visible, regardless of which features are enabled.

**Always shown:** connection status, health metrics, current state of each worker, last action and when,
enabled-vs-total feature count.
**Conditionally shown (debug flag):** detailed detection results, timing breakdowns.

---

## Layer 6 — Error handling

### The rule
> Every function that can fail must decide: can I recover, or do I need to tell someone?

### Two modes
- **Development:** fail loudly — raise, surface, don't hide.
- **Production:** fail gracefully — log full detail, take the safest fallback, keep running.

Controlled by the settings layer, not hardcoded.

### Levels
```
Function level → handle expected failures locally, log unexpected ones
Module level   → catch what escapes functions; log and recover
App level      → catch anything that reaches the top; log and shut down cleanly
```

### Example
```python
def capture_frame(self):
    try:
        frame = self._backend.get_frame()
        if frame is None:
            self._log_error("capture", "Frame returned None — skipping iteration")
            return None
        return frame
    except ConnectionError as e:
        self._log_error("capture", f"Connection lost: {e}")
        self._set_state(STATE_CONNECTION_LOST)
        return None
    except Exception as e:
        self._log_error("capture", f"Unexpected error: {type(e).__name__}: {e}")
        raise   # unexpected errors bubble up — never silently swallowed
```

### Never
- A bare `except:` (ruff `E722` flags it)
- A failure with no record of what happened
- Crashing without cleaning up (close connections, save state)

*VBA parallel: this is `On Error GoTo` with far more control over what you catch and whether you recover.*

---

## Layer 7 — Logging (separate from debugging)

**Debug output** is for right now. **Logging** is the persistent record of what happened, in order, after the fact —
even if nobody was watching.

### Levels
```
DEBUG    → fine detail; only while developing (debug flag)
INFO     → normal milestones ("worker started", "profile loaded")
WARNING  → unexpected but recoverable
ERROR    → something failed that shouldn't have
CRITICAL → app cannot continue
```
> Use levels correctly so you can filter later. In production DEBUG is off; INFO and above always runs.

### Files and settings
```
logs/  app.log (rotating)   app.log.1   errors.log (errors+criticals, always on)

logging:
  enabled: true
  level: INFO
  log_to_file: true
  log_to_console: true
  max_file_size_mb: 10
  backup_count: 3
```
### Never log secrets or personal data. See Layer 17.

### Unattended apps need an outbound signal
For anything that runs without a person watching, a log file nobody reads isn't monitoring. Add a notification
path (webhook, email, or push) for ERROR/CRITICAL and for a "heartbeat missing" check.

One function handles all output (file, UI queue, console) — see `snippets/logger.py`.

---

## Layer 8 — Code commenting

> Write comments for the next reader — including yourself in six months.
> If a decision took more than thirty seconds, comment it.

**Gets a comment:** every function (docstring), every non-obvious decision, every workaround (what the real
problem is), every threshold (where it came from).
**Does not:** things obvious from the code; restating the code in English.

```python
def resolve_state(results: dict, profile: str) -> str:
    """
    Evaluate detection results against the profile's rule set.
    Returns the highest-priority matching state, or STATE_UNKNOWN if nothing matches.

    Args:
        results : detector_name -> DetectResult from the current scan
        profile : profile name — selects which rule set to evaluate
    """
```

---

## Layer 9 — Data model first

> Define data shapes before writing logic. The logic follows naturally from clear data.

```python
@dataclass
class DetectResult:
    detector_name: str
    found: bool
    score: float
    location: Optional[tuple]   # (x, y) center of match, or None
```
Use `dataclass` (or pydantic when validating outside input). Type hints are part of the contract and feed pyright.

---

## Layer 10 — Interface before implementation

> Write what a function promises — accepts and returns — before how it works.

```python
def run_detectors(frame: np.ndarray, enabled: list[str], threshold: float) -> dict[str, DetectResult]:
    """Run only the enabled detectors against the frame. Return all results."""
    ...
```
For every new module: name it, define inputs, define outputs, write the docstring — then implement.

---

## Layer 11 — Defensive programming

> Never assume. Verify. Handle the failure case before writing the success case.

Always check: config exists and is valid, the connection is live, inputs are the expected type and range,
external calls can fail, state transitions are valid.

*The productive form of thinking through every scenario:* you don't have to solve every edge case up front.
Name it, handle it safely, log it, move on. Fix it properly later with more information.

```python
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

- `main` is always working. Never commit broken code to it.
- Every feature or experiment gets a branch. Works → merge. Doesn't → delete; nothing lost.
- **Commit summary line:** `type: description` — `feat`, `fix`, `refactor`, `docs`, `test`, `chore`. Imperative, about 72 characters.
  Bad: `fixed stuff`. Good: `fix: reconnect no longer blocks the main loop`.
- One logical change per commit. "And" in the summary line means two commits.
- **Every commit gets a detailed message** — a short summary line plus a body. The commit log is the project's step-by-step
  history and the way back to a known-good point, so write it for the person reading it in six months. Body sections
  (omit one only if it is empty):
  - **Why** — the problem or the decision behind the change
  - **What changed** — files and behavior, in plain words
  - **Verified** — how it was checked (tests run, manual steps) and the result
  - **Notes** — migration number, how to revert, follow-ups, any Known deviation touched
  End AI-assisted commits with the `Co-Authored-By` trailer the tool specifies.
- When an assistant asks you to commit, it hands over the ready-to-paste message and the exact commands (which terminal,
  which folder), not just "commit this". Multi-line messages: `git commit -F message.txt`, or in PowerShell
  `@'...'@ | git commit -F -`.
- The message is the commit text, not a copy of the `git commit` command.
- **Refactoring** (change how, not what): branch → refactor → verify the tests still pass → merge. The tests are what make this fearless.
- **pre-commit** hooks (ruff) and **CI** (`templates/ci/python-ci.yml`) back up the habit.

---

## Layer 13 — No magic numbers (or strings)

> Every meaningful value gets a name. Every name gets a comment if the value isn't obvious.

```python
MAX_INT32 = 2147483647   # max 32-bit integer — used as "never timeout"
STATE_IN_RUN = "IN_RUN"
```
All constants live in `config/constants.py`, grouped and commented.

---

## Layer 14 — Repo hygiene

> The root of the repo only contains files that are actively useful right now.

### Standard root
```
README.md  CLAUDE.md  ROADMAP.md  SPEC.md  .gitignore  .env.example
main.py  pyproject.toml  (uv.lock)  .pre-commit-config.yaml
```
### Working-file lifecycle
- `AUDIT.md` during an audit pass → summarize in ROADMAP.md, then delete or move to `docs/`
- Implementation notes → CLAUDE.md session log, not loose files
- Experiment files → on a branch, never on main

`docs/` holds history: completed audits, `decisions.md`.
`ROADMAP.md` is permanent and living: future work, known issues, ideas, tech debt, completed milestones (checked off, not deleted).

---

## Layer 15 — Claude Code context (CLAUDE.md)

A file named `CLAUDE.md` in the root of every repo. Claude Code reads it automatically at the start of each session.
It is the continuity layer — without it every session starts cold.

> The last thing done in every session: update CLAUDE.md with what was done, decided, and the current state — then commit it.

**Contains:** project summary · standards pointer · architecture map · key decisions · tried and rejected ·
**known deviations** from these standards · current state · session log · standing instructions.

Template: `templates/CLAUDE.md`. Companion docs: `ROADMAP.md` (the path) and `SPEC.md` (the current step) — see
`templates/PROJECT-INSTRUCTIONS.md` for how the three fit together.

**What it is not:** a substitute for code comments, a place for implementation detail, or optional.

---

## Layer 16 — Testing

*Promoted from "future layer" to a standard on 2026-10-04.*

### What it is
Small automated checks that verify individual pieces of code work. When you change something, tests tell you
immediately whether you broke something else — which is what makes refactoring (Layer 12) fearless.

### The rule
> Test the logic that costs time, money, or trust when it breaks. Coverage percentage is not a goal.

### What to test
1. **Pure logic first** — state resolution, parsing, calculations, rule evaluation. Easy to test because it has no side effects (another reason Layer 4 separates logic from I/O).
2. **Boundaries with fakes** — hardware, network, and device layers get a fake implementation so core logic can be tested without the real thing.
3. **Regression tests** — every bug fix starts with a failing test that reproduces it; the test stays.

### What not to test
Third-party library internals, trivial getters, and tests that only mock the code they claim to verify.

### How
```
tests/
  test_state_resolution.py      ← plain functions named test_*
  conftest.py                   ← shared fixtures (fake backends, sample data)
```
Run with `pytest`. Add it to pre-commit or CI so it can't be skipped.

---

## Layer 17 — Security and secrets

- **No secrets in code or in git.** API keys, tokens, and passwords come from environment variables or a
  gitignored `.env`; commit `.env.example` (names only) to document them.
- A secret ever pasted into chat or committed is considered leaked — rotate it.
- **Validate all outside input** (files, network, user entry) before using it; treat it as untrusted.
- **Never log secrets or personal data** (Layer 7).
- Bind services to the narrowest interface that works (localhost or a private network) and expose remotely only
  through an authenticated path.
- Pin dependencies (lockfile) and update them deliberately.
- Back up anything that can't be rebuilt from git, and test the restore at least once.

---

## Pushback standard

### The rule
If a request works but isn't the best approach, say so before building it. Explain the better approach and why.
Give the choice.

### Why
Learning by building means a wrong pattern gets bolted-on-right later, with resentment. Better to know the
options upfront and choose intentionally.

> "That will work, but the standard approach is X because Y. Want me to do it that way instead?"

---

## Terminology reference (plain English)

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
| Entry point | The one file that starts everything and wires pieces together |
| Config schema | The definition of what settings exist, their types, and defaults |
| Linter / formatter | A tool that reads your code and flags mistakes / fixes style automatically (ruff) |
| Lockfile | A record of the exact dependency versions installed, so every machine matches |
| Pre-commit hook | A check that runs automatically before each commit |
| CI | A server that runs your checks on every push, so nothing broken reaches `main` |

---

## New app checklist

Before writing any feature code:

**Project setup**
- [ ] Repo created from `templates/project-structure.md`; first commit made
- [ ] `CLAUDE.md` (standards pointer + standing instructions), `README.md`, `ROADMAP.md`, `SPEC.md`
- [ ] `.gitignore` and `.env.example` configured
- [ ] Known deviations table filled in (even if "none")

**Toolchain**
- [ ] `pyproject.toml` with dependencies and Python version
- [ ] ruff configured; pytest installed; pre-commit installed (`pre-commit install`)
- [ ] CI workflow in place (`templates/ci/python-ci.yml`)

**Foundations**
- [ ] Data models defined
- [ ] `config/constants.py` created (even if empty — establishes the pattern)
- [ ] Settings store with schema and defaults
- [ ] Debug layer wired to settings; logging layer with levels and file output
- [ ] Error-handling strategy decided (what fails loudly vs gracefully)
- [ ] Folder structure per Layer 4; interface signatures written for major modules
- [ ] UI reads status and writes to the store only
- [ ] Every feature has an enabled flag
- [ ] First test written (even trivial) so the pattern exists
- [ ] Outbound alert path decided for unattended apps

---

*Last updated: October 2026.*
*This document grows as new patterns are identified and learned.*
