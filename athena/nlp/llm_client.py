"""Client to interact with Gemini (Generative AI) models."""
from __future__ import annotations

import logging
from typing import Optional

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None  # type: ignore[assignment]

from ..config import settings

LOGGER = logging.getLogger(__name__)


class GeminiClient:
    """Small wrapper around the Gemini API to obtain intelligent responses."""

    def __init__(self, model: str = "gemini-1.5-flash") -> None:
        self._model = model
        self._client: Optional["genai.GenerativeModel"] = None
        api_key = settings.gemini_api_key
        if api_key and genai:
            genai.configure(api_key=api_key)
            self._client = genai.GenerativeModel(model)
        elif not api_key:
            LOGGER.warning("GEMINI_API_KEY no está configurada. Respuestas inteligentes deshabilitadas.")
        else:
            LOGGER.warning("La librería google-generativeai no está instalada.")

    def generate(self, prompt: str) -> Optional[str]:
        if not self._client:
            return None
        try:
            response = self._client.generate_content(prompt)
            if hasattr(response, "text"):
                return response.text
            if response.candidates:
                return response.candidates[0].content.parts[0].text  # type: ignore[index]
            return None
        except Exception as exc:  # pragma: no cover - network call
            LOGGER.exception("Gemini request failed: %s", exc)
            return None
