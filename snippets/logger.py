"""
snippets/logger.py

Unified debug + logging layer.
Copy into tools/logger.py in any new project and adapt as needed.

Key behaviors:
- All output flows through one function — no scattered print statements
- Debug categories are individually togglable via settings
- Log levels used correctly: DEBUG / INFO / WARNING / ERROR / CRITICAL
- Writes to rotating log file and/or console based on settings
- In production, DEBUG is off — nothing leaks
"""

from __future__ import annotations

import logging
import logging.handlers
from pathlib import Path
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from config.settings_store import SettingsStore


class AppLogger:
    """
    Single logging interface for the entire app.
    One instance, shared across all modules.

    Usage:
        logger = AppLogger(settings_store)
        logger.info("Worker started")
        logger.debug("state_changes", "state changed to IN_RUN")
        logger.warning("Frame capture returned None — retrying")
        logger.error("ADB disconnected unexpectedly")
    """

    def __init__(self, settings: "SettingsStore", log_dir: str = "logs"):
        self._settings = settings
        self._log_dir = Path(log_dir)
        self._logger = self._build_logger()
        self._ui_callback = None   # optional: wire to UI queue for live display

    def set_ui_callback(self, fn) -> None:
        """Wire a UI display function to receive log messages."""
        self._ui_callback = fn

    # ------------------------------------------------------------------
    # Public log methods — use these everywhere in the app
    # ------------------------------------------------------------------

    def debug(self, category: str, msg: str) -> None:
        """
        Debug output for a specific category.
        Only emits if debug is enabled AND that category is enabled in settings.
        """
        if not self._settings.debug.enabled:
            return
        flag = f"log_{category}"
        if not getattr(self._settings.debug, flag, False):
            return
        self._emit(logging.DEBUG, f"[{category}] {msg}")

    def info(self, msg: str) -> None:
        self._emit(logging.INFO, msg)

    def warning(self, msg: str) -> None:
        self._emit(logging.WARNING, msg)

    def error(self, msg: str) -> None:
        self._emit(logging.ERROR, msg)

    def critical(self, msg: str) -> None:
        self._emit(logging.CRITICAL, msg)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _emit(self, level: int, msg: str) -> None:
        """Send a message to the file logger and optionally the UI."""
        self._logger.log(level, msg)
        if self._ui_callback:
            try:
                self._ui_callback(msg)
            except Exception:
                pass  # UI errors never crash the logger

    def _build_logger(self) -> logging.Logger:
        """Configure the Python logging system."""
        log_settings = self._settings.logging

        logger = logging.getLogger("app")
        logger.setLevel(logging.DEBUG)  # capture everything; handlers filter by level
        logger.handlers.clear()

        level = getattr(logging, log_settings.level.upper(), logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        # File handler — rotating, so logs don't grow forever
        if log_settings.log_to_file:
            self._log_dir.mkdir(parents=True, exist_ok=True)
            file_handler = logging.handlers.RotatingFileHandler(
                filename=self._log_dir / "app.log",
                maxBytes=log_settings.max_file_size_mb * 1024 * 1024,
                backupCount=log_settings.backup_count,
                encoding="utf-8",
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

            # Separate errors-only log — always on regardless of level setting
            error_handler = logging.handlers.RotatingFileHandler(
                filename=self._log_dir / "errors.log",
                maxBytes=5 * 1024 * 1024,
                backupCount=2,
                encoding="utf-8",
            )
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(formatter)
            logger.addHandler(error_handler)

        # Console handler
        if log_settings.log_to_console:
            console_handler = logging.StreamHandler()
            console_handler.setLevel(level)
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)

        return logger
