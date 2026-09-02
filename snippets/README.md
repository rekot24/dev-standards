# Snippets

Reusable code patterns. Copy these into any new project and adapt.

| File | What it is |
|---|---|
| `settings_store.py` | Live settings store — single source of truth, persists to disk, thread-safe |
| `logger.py` | Unified debug + logging layer — all output through one function, level-controlled |

## How to use

Each file is self-contained and documented. Copy the file into your project's `tools/` or `config/` folder, adjust the field names to match your app, and wire it into `main.py`.

More snippets get added here as patterns are proven across projects.
