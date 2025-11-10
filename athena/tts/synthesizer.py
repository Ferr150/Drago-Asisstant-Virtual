"""Text-to-speech implementation for Athena."""
from __future__ import annotations

import logging
from typing import Optional

import pyttsx3


LOGGER = logging.getLogger(__name__)


class SpeechSynthesizer:
    """Wrapper around ``pyttsx3`` to produce audible responses."""

    def __init__(self, voice: Optional[str] = None, rate: int = 175, volume: float = 1.0) -> None:
        self._engine = pyttsx3.init()
        if voice is not None:
            for available_voice in self._engine.getProperty("voices"):
                if voice.lower() in available_voice.name.lower():
                    self._engine.setProperty("voice", available_voice.id)
                    break
        self._engine.setProperty("rate", rate)
        self._engine.setProperty("volume", volume)

    def speak(self, text: str) -> None:
        """Speak the provided text using the default output device."""
        LOGGER.info("Athena dice: %s", text)
        self._engine.say(text)
        self._engine.runAndWait()
