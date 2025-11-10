"""Natural language understanding for Athena."""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Optional

from ..actions.system_executor import SystemCommandExecutor
from ..config import settings
from .llm_client import GeminiClient

LOGGER = logging.getLogger(__name__)


@dataclass
class CommandResult:
    """Wraps the response and whether it should be spoken out loud."""

    response: str
    speak: bool = True


class NLPProcessor:
    """Translate natural language commands into system actions."""

    def __init__(self, executor: SystemCommandExecutor, llm_client: Optional[GeminiClient] = None) -> None:
        self._executor = executor
        self._llm = llm_client or GeminiClient()

    def process(self, text: str) -> CommandResult:
        LOGGER.debug("Processing command: %s", text)
        normalized = text.lower().strip()
        if settings.wake_word and normalized.startswith(settings.wake_word.lower()):
            normalized = normalized[len(settings.wake_word) :].strip()

        handlers = [
            self._handle_open_app,
            self._handle_time,
            self._handle_date,
            self._handle_search_web,
            self._handle_play_music,
            self._handle_search_files,
        ]

        for handler in handlers:
            result = handler(normalized)
            if result:
                return CommandResult(result)

        llm_response = self._ask_llm(text)
        if llm_response:
            return CommandResult(llm_response)
        return CommandResult("Lo siento, no entendí la solicitud.")

    def _handle_open_app(self, text: str) -> Optional[str]:
        match = re.search(r"abre (?P<app>.+)", text)
        if match:
            app = match.group("app")
            return self._executor.open_application(app)
        return None

    def _handle_time(self, text: str) -> Optional[str]:
        if "hora" in text:
            return self._executor.tell_time()
        return None

    def _handle_date(self, text: str) -> Optional[str]:
        if "fecha" in text or "día" in text:
            return self._executor.tell_date()
        return None

    def _handle_search_web(self, text: str) -> Optional[str]:
        match = re.search(r"busca (en google )?(?P<query>.+)", text)
        if match:
            query = match.group("query")
            self._executor.open_url(query)
            return f"Buscando {query} en la web"
        return None

    def _handle_play_music(self, text: str) -> Optional[str]:
        if "reproduce música" in text or "pon música" in text:
            return self._executor.play_music()
        return None

    def _handle_search_files(self, text: str) -> Optional[str]:
        match = re.search(r"busca el archivo (?P<file>.+)", text)
        if match:
            file_name = match.group("file")
            return self._executor.search_files(file_name)
        return None

    def _ask_llm(self, text: str) -> Optional[str]:
        if not self._llm:
            return None
        prompt = (
            "Eres Athena, un asistente virtual en español. Responde de forma concisa y amigable. "
            f"El usuario dijo: {text}"
        )
        return self._llm.generate(prompt)
