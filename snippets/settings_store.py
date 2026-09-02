"""
snippets/settings_store.py

Reusable settings store pattern.
Copy into config/settings_store.py in any new project and adapt field names.

Key behaviors:
- Loads from disk on startup
- Saves to disk automatically on change
- Lives in memory as a live object — workers read it on every cycle
- No restart required when settings change
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional


# ---------------------------------------------------------------------------
# Data shapes — define all settings fields here with their defaults
# ---------------------------------------------------------------------------

@dataclass
class DebugSettings:
    enabled: bool = False
    log_state_changes: bool = True
    log_actions: bool = True
    log_detections: bool = False
    log_health: bool = False
    screenshot_on_event: bool = False
    screenshot_dir: str = "./debug"


@dataclass
class LoggingSettings:
    enabled: bool = True
    level: str = "INFO"             # DEBUG / INFO / WARNING / ERROR / CRITICAL
    log_to_file: bool = True
    log_to_console: bool = True
    max_file_size_mb: int = 10
    backup_count: int = 3


@dataclass
class FeatureFlags:
    """Add one boolean per feature. Default to True for core features, False for optional ones."""
    example_feature_enabled: bool = True
    optional_feature_enabled: bool = False


@dataclass
class AppSettings:
    debug: DebugSettings = field(default_factory=DebugSettings)
    logging: LoggingSettings = field(default_factory=LoggingSettings)
    features: FeatureFlags = field(default_factory=FeatureFlags)


# ---------------------------------------------------------------------------
# Settings store — the live object the app reads from
# ---------------------------------------------------------------------------

class SettingsStore:
    """
    Single source of truth for all app settings.
    Thread-safe reads and writes.
    Persists to disk automatically on every change.
    """

    def __init__(self, path: str = "config/settings.json"):
        self._path = Path(path)
        self._lock = threading.RLock()
        self._settings = self._load()

    # ------------------------------------------------------------------
    # Public read access
    # ------------------------------------------------------------------

    @property
    def debug(self) -> DebugSettings:
        with self._lock:
            return self._settings.debug

    @property
    def logging(self) -> LoggingSettings:
        with self._lock:
            return self._settings.logging

    @property
    def features(self) -> FeatureFlags:
        with self._lock:
            return self._settings.features

    # ------------------------------------------------------------------
    # Public write access — call these from the UI
    # ------------------------------------------------------------------

    def update_debug(self, **kwargs) -> None:
        """Update one or more debug settings and save."""
        with self._lock:
            for key, value in kwargs.items():
                if hasattr(self._settings.debug, key):
                    setattr(self._settings.debug, key, value)
            self._save()

    def update_features(self, **kwargs) -> None:
        """Update one or more feature flags and save."""
        with self._lock:
            for key, value in kwargs.items():
                if hasattr(self._settings.features, key):
                    setattr(self._settings.features, key, value)
            self._save()

    # ------------------------------------------------------------------
    # Disk persistence
    # ------------------------------------------------------------------

    def _load(self) -> AppSettings:
        """Load settings from disk, falling back to defaults if missing or corrupt."""
        if not self._path.exists():
            defaults = AppSettings()
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._write(defaults)
            return defaults
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return self._from_dict(data)
        except Exception as e:
            print(f"[WARN] Settings failed to load ({e}), using defaults")
            return AppSettings()

    def _save(self) -> None:
        """Write current settings to disk. Call after every change."""
        try:
            self._write(self._settings)
        except Exception as e:
            print(f"[ERROR] Settings failed to save: {e}")

    def _write(self, settings: AppSettings) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with open(self._path, "w", encoding="utf-8") as f:
            json.dump(asdict(settings), f, indent=2)

    def _from_dict(self, data: dict) -> AppSettings:
        """Safely reconstruct settings from disk, filling in missing fields with defaults."""
        defaults = AppSettings()
        return AppSettings(
            debug=DebugSettings(**{**asdict(defaults.debug), **data.get("debug", {})}),
            logging=LoggingSettings(**{**asdict(defaults.logging), **data.get("logging", {})}),
            features=FeatureFlags(**{**asdict(defaults.features), **data.get("features", {})}),
        )


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    store = SettingsStore("config/settings.json")

    # Read a feature flag every loop — this is the pattern
    if store.features.example_feature_enabled:
        print("Feature is on")

    # Update from UI — saves to disk automatically
    store.update_features(example_feature_enabled=False)

    # Read again — immediately reflects the change, no restart
    if store.features.example_feature_enabled:
        print("Feature is on")
    else:
        print("Feature is off")
