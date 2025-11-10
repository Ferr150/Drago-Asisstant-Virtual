"""High level orchestration of the Athena assistant."""
from __future__ import annotations

import logging
import threading
from typing import Callable, List

from ..nlp.processor import CommandResult, NLPProcessor
from ..speech.listener import VoiceListener
from ..tts.synthesizer import SpeechSynthesizer

LOGGER = logging.getLogger(__name__)


class AthenaController:
    """Coordinates the speech, NLP, actions and TTS subsystems."""

    def __init__(self, nlp: NLPProcessor, listener: VoiceListener, synthesizer: SpeechSynthesizer) -> None:
        self._nlp = nlp
        self._listener = listener
        self._synthesizer = synthesizer
        self._history: List[str] = []
        self._on_update: Callable[[str, str], None] = lambda speaker, text: None
        self._lock = threading.Lock()

    def set_update_callback(self, callback: Callable[[str, str], None]) -> None:
        self._on_update = callback

    def start(self) -> None:
        LOGGER.info("Iniciando Athena controller")
        self._listener.start_background(self.handle_transcription)

    def stop(self) -> None:
        LOGGER.info("Deteniendo Athena controller")
        self._listener.stop()

    def handle_transcription(self, text: str) -> None:
        LOGGER.debug("Handling transcription: %s", text)
        with self._lock:
            self._history.append(f"Usuario: {text}")
            self._on_update("Usuario", text)
        result = self._nlp.process(text)
        with self._lock:
            self._history.append(f"Athena: {result.response}")
            self._on_update("Athena", result.response)
        if result.speak:
            self._synthesizer.speak(result.response)

    def execute_text_command(self, text: str) -> None:
        """Process commands coming from the GUI text input."""
        self.handle_transcription(text)

    @property
    def conversation(self) -> List[str]:
        return list(self._history)
