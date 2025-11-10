"""PyQt5 based graphical interface for Athena."""
from __future__ import annotations

import logging
import threading
from typing import Callable

from PyQt5 import QtCore, QtGui, QtWidgets

from ..core.controller import AthenaController

LOGGER = logging.getLogger(__name__)


class AthenaWindow(QtWidgets.QMainWindow):
    """Main window showing conversation history and controls."""

    message_received = QtCore.pyqtSignal(str, str)
    processing_changed = QtCore.pyqtSignal(bool)

    def __init__(self, controller_factory: Callable[[], AthenaController]) -> None:
        super().__init__()
        self.setWindowTitle("Athena - Asistente Virtual")
        self.resize(720, 480)
        self._controller = controller_factory()
        self._controller.set_update_callback(self._append_message)

        self.message_received.connect(self._on_message_received)

        central_widget = QtWidgets.QWidget(self)
        self.setCentralWidget(central_widget)
        layout = QtWidgets.QVBoxLayout(central_widget)

        title = QtWidgets.QLabel("Hola, soy Athena")
        font = QtGui.QFont()
        font.setPointSize(18)
        font.setBold(True)
        title.setFont(font)
        title.setAlignment(QtCore.Qt.AlignCenter)
        layout.addWidget(title)

        self._conversation = QtWidgets.QTextEdit()
        self._conversation.setReadOnly(True)
        layout.addWidget(self._conversation)

        controls_layout = QtWidgets.QHBoxLayout()
        layout.addLayout(controls_layout)

        self._microphone_btn = QtWidgets.QPushButton("🎤 Escuchar")
        self._microphone_btn.setCheckable(True)
        self._microphone_btn.clicked.connect(self._toggle_listening)
        controls_layout.addWidget(self._microphone_btn)

        self._status_label = QtWidgets.QLabel("Inactivo")
        controls_layout.addWidget(self._status_label)

        self._text_input = QtWidgets.QLineEdit()
        self._text_input.setPlaceholderText("Escribe un comando…")
        self._text_input.returnPressed.connect(self._handle_text_command)
        layout.addWidget(self._text_input)

        self._typing_indicator = QtWidgets.QProgressBar()
        self._typing_indicator.setRange(0, 0)
        self._typing_indicator.setVisible(False)
        layout.addWidget(self._typing_indicator)

        self.processing_changed.connect(self._typing_indicator.setVisible)

    def showEvent(self, event: QtGui.QShowEvent) -> None:  # pragma: no cover - UI event
        super().showEvent(event)

    def closeEvent(self, event: QtGui.QCloseEvent) -> None:  # pragma: no cover - UI event
        self._controller.stop()
        super().closeEvent(event)

    def _toggle_listening(self) -> None:
        listening = self._microphone_btn.isChecked()
        if listening:
            LOGGER.info("Activando escucha por voz")
            self._status_label.setText("Escuchando…")
            self._microphone_btn.setText("🛑 Detener")
            threading.Thread(target=self._controller.start, daemon=True).start()
        else:
            LOGGER.info("Deteniendo escucha por voz")
            self._status_label.setText("Inactivo")
            self._microphone_btn.setText("🎤 Escuchar")
            self._controller.stop()

    def _handle_text_command(self) -> None:
        text = self._text_input.text().strip()
        if not text:
            return
        self._text_input.clear()
        self.processing_changed.emit(True)
        threading.Thread(target=self._execute_text, args=(text,), daemon=True).start()

    def _execute_text(self, text: str) -> None:
        try:
            self._controller.execute_text_command(text)
        finally:
            self.processing_changed.emit(False)

    def _append_message(self, speaker: str, message: str) -> None:
        if speaker.lower() == "usuario":
            self.processing_changed.emit(True)
        self.message_received.emit(speaker, message)

    @QtCore.pyqtSlot(str, str)
    def _on_message_received(self, speaker: str, message: str) -> None:
        self._conversation.append(f"<b>{speaker}:</b> {message}")
        if speaker.lower() == "athena":
            self.processing_changed.emit(False)
