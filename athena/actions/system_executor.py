"""System command execution helpers for Athena."""
from __future__ import annotations

import datetime as dt
import logging
import os
import subprocess
import webbrowser
from pathlib import Path
from typing import Dict, Optional

from ..config import settings

LOGGER = logging.getLogger(__name__)


class SystemCommandExecutor:
    """Executes system level commands requested by the user."""

    def __init__(self) -> None:
        self._app_paths: Dict[str, str] = {
            "notepad": "notepad.exe",
            "chrome": "C:/Program Files/Google/Chrome/Application/chrome.exe",
            "spotify": "spotify",
            "calculadora": "calc.exe",
        }

    def open_application(self, app_name: str) -> str:
        LOGGER.debug("Intentando abrir la aplicación: %s", app_name)
        path = self._app_paths.get(app_name.lower())
        if not path:
            raise ValueError(f"Aplicación desconocida: {app_name}")

        try:
            if Path(path).exists():
                subprocess.Popen([path], shell=False)  # noqa: S603,S607
            else:
                subprocess.Popen([path], shell=True)  # noqa: S603
        except FileNotFoundError as exc:  # pragma: no cover - depends on OS
            LOGGER.exception("No se pudo abrir %s", app_name)
            raise ValueError(f"No se encontró la aplicación {app_name}") from exc
        return f"Abriendo {app_name}"

    @staticmethod
    def open_url(query: str) -> str:
        url = query if query.startswith("http") else f"https://www.google.com/search?q={query}"
        try:
            browser = webbrowser.get(settings.default_browser)
            browser.open(url)
        except webbrowser.Error:
            webbrowser.open(url)
        return "Abriendo el navegador"

    @staticmethod
    def play_music(path: Optional[str] = None) -> str:
        if path:
            resolved = Path(path).expanduser()
            if not resolved.exists():
                raise ValueError(f"La ruta {resolved} no existe")
            try:
                os.startfile(resolved)  # type: ignore[attr-defined]
            except AttributeError:
                subprocess.Popen([str(resolved)])  # noqa: S603,S607
        else:
            webbrowser.open("https://open.spotify.com")
        return "Reproduciendo música"

    @staticmethod
    def tell_time() -> str:
        now = dt.datetime.now()
        return f"Son las {now:%H:%M}"

    @staticmethod
    def tell_date() -> str:
        today = dt.date.today()
        return f"Hoy es {today:%A %d de %B de %Y}"

    @staticmethod
    def search_files(keyword: str, start_dir: Optional[str] = None) -> str:
        base = Path(start_dir or Path.home())
        matches = list(base.rglob(f"*{keyword}*"))
        if not matches:
            return "No se encontraron archivos con ese nombre"
        first = matches[0]
        try:
            os.startfile(first)  # type: ignore[attr-defined]
        except AttributeError:
            subprocess.Popen([str(first)])  # noqa: S603,S607
        return f"Abriendo {first}"
