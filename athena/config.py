"""Configuration utilities for the Athena assistant."""
from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Optional


@dataclass(frozen=True)
class Settings:
    """Runtime configuration loaded from environment variables."""

    gemini_api_key: Optional[str] = None
    wake_word: str = "athena"
    default_browser: str = "chrome"

    @classmethod
    def load(cls) -> "Settings":
        """Create a :class:`Settings` instance using OS environment variables."""
        return cls(
            gemini_api_key=os.getenv("GEMINI_API_KEY"),
            wake_word=os.getenv("ATHENA_WAKE_WORD", "athena"),
            default_browser=os.getenv("ATHENA_BROWSER", "chrome"),
        )


settings = Settings.load()
