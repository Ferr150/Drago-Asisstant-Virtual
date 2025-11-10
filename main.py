"""Entry point to launch the Athena assistant GUI."""
from __future__ import annotations

import logging
import sys

from PyQt5 import QtWidgets

from athena.actions.system_executor import SystemCommandExecutor
from athena.core.controller import AthenaController
from athena.gui.app import AthenaWindow
from athena.nlp.llm_client import GeminiClient
from athena.nlp.processor import NLPProcessor
from athena.speech.listener import VoiceListener
from athena.tts.synthesizer import SpeechSynthesizer


def build_controller() -> AthenaController:
    executor = SystemCommandExecutor()
    nlp = NLPProcessor(executor, GeminiClient())
    listener = VoiceListener()
    synthesizer = SpeechSynthesizer()
    return AthenaController(nlp, listener, synthesizer)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(name)s: %(message)s")
    app = QtWidgets.QApplication(sys.argv)
    window = AthenaWindow(build_controller)
    window.show()
    return app.exec_()


if __name__ == "__main__":
    sys.exit(main())
