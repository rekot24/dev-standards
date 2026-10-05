#!/usr/bin/env python3
"""
Build dev-standards.skill from this repo.

Run from the repo root:   python skill/build_skill.py
Output:                   skill/dist/dev-standards.skill   (upload this to Claude)

What it does: copies SKILL.md plus the repo's docs, templates and snippets into a
skill folder layout, then zips it. The repo stays the single source of truth;
the skill is a generated snapshot, so never edit files inside the .skill.

Standard library only - no installs needed.
"""
import shutil
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILL_SRC = REPO / "skill" / "SKILL.md"
DIST = REPO / "skill" / "dist"
SKILL_NAME = "dev-standards"

# Files copied into references/ (top-level docs)
DOCS = ["app-framework.md", "web-app-framework.md", "web-frontend-design.md", "web-patterns.md"]
# Folders copied whole into references/
FOLDERS = ["templates", "snippets"]
# Extra files copied into references/ with a new name
RENAMED = {"docs/decisions.md": "decisions.md"}

SKIP_NAMES = {".DS_Store", "__pycache__", "*.pyc"}


def main() -> int:
    if not SKILL_SRC.exists():
        print(f"Missing {SKILL_SRC}")
        return 1

    stage = DIST / SKILL_NAME
    if DIST.exists():
        shutil.rmtree(DIST)
    refs = stage / "references"
    refs.mkdir(parents=True)

    shutil.copy2(SKILL_SRC, stage / "SKILL.md")

    for name in DOCS:
        src = REPO / name
        if not src.exists():
            print(f"Missing {src}")
            return 1
        shutil.copy2(src, refs / name)

    for src_rel, dest_name in RENAMED.items():
        src = REPO / src_rel
        if src.exists():
            shutil.copy2(src, refs / dest_name)

    for folder in FOLDERS:
        shutil.copytree(REPO / folder, refs / folder, ignore=shutil.ignore_patterns(*SKIP_NAMES))

    out = DIST / f"{SKILL_NAME}.skill"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(stage.rglob("*")):
            if path.is_file():
                z.write(path, path.relative_to(DIST))
    shutil.rmtree(stage)

    print(f"Built {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
