# Standard project folder structure

Copy this layout when starting a new project.
Delete folders that don't apply — but think before you delete.

```
project-name/
  main.py                   ← entry point only; wires everything together
  requirements.txt          ← all dependencies listed
  README.md                 ← what this app does, how to run it, what each folder is
  .gitignore

  config/
    settings.json           ← persisted values (gitignored if sensitive)
    settings_schema.py      ← field definitions, types, and defaults
    settings_store.py       ← the live settings object the app reads from

  core/                     ← main logic: workers, managers, orchestration
  detection/                ← screen reading, pattern matching, sensors
  actions/                  ← things the app does (clicks, API calls, writes)
  ui/                       ← display only; never writes to workers directly
  tools/                    ← reusable utilities; general enough to copy to other projects
  assets/                   ← images, templates, static files
  profiles/                 ← saved named configurations

  logs/
    .gitkeep                ← keeps the folder in git without committing log files

  debug/
    .gitkeep                ← screenshots and debug output land here
```

## .gitignore minimums

Always ignore:
```
*.pyc
__pycache__/
.env
config/settings.json        ← if it contains secrets or machine-specific paths
logs/
debug/
```
