"""Speech recognition utilities for Athena."""
from __future__ import annotations

import logging
import threading
from typing import Callable, Optional

import speech_recognition as sr


LOGGER = logging.getLogger(__name__)


class VoiceListener:
    """Continuously listens for voice commands using ``speech_recognition``."""

    def __init__(self, phrase_timeout: float = 5.0) -> None:
        self._recognizer = sr.Recognizer()
        self._microphone = sr.Microphone()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._phrase_timeout = phrase_timeout
        self._callback: Optional[Callable[[str], None]] = None

    def listen_once(self, timeout: Optional[float] = None) -> Optional[str]:
        """Return the next utterance from the microphone as text."""
        with self._microphone as source:
            self._recognizer.adjust_for_ambient_noise(source)
            LOGGER.debug("Listening for a single command…")
            try:
                audio = self._recognizer.listen(
                    source, timeout=timeout, phrase_time_limit=self._phrase_timeout
                )
            except sr.WaitTimeoutError:
                LOGGER.debug("Tiempo de espera agotado sin recibir audio")
                return None
        try:
            text = self._recognizer.recognize_google(audio, language="es-ES")
            LOGGER.debug("Recognized command: %s", text)
            return text
        except sr.UnknownValueError:
            LOGGER.warning("No se pudo entender el audio")
            return None
        except sr.RequestError as exc:
            LOGGER.error("Error al contactar el servicio de reconocimiento: %s", exc)
            return None

    def start_background(self, callback: Callable[[str], None]) -> None:
        """Start listening in a background thread."""
        if self._thread and self._thread.is_alive():
            return
        self._callback = callback
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        LOGGER.info("Voice listener started")

    def stop(self) -> None:
        """Stop listening."""
        if not self._thread:
            return
        self._stop_event.set()
        self._thread.join()
        self._thread = None
        LOGGER.info("Voice listener stopped")

    def _run(self) -> None:
        while not self._stop_event.is_set():
            try:
                result = self.listen_once()
                if result and self._callback:
                    self._callback(result)
            except Exception as exc:  # pylint: disable=broad-except
                LOGGER.exception("Unexpected error while listening: %s", exc)
