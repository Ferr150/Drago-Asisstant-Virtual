<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Athena Assistant

Athena es un asistente virtual de escritorio inspirado en soluciones como Cortana o Jarvis. Incluye reconocimiento de voz en tiempo real, síntesis de voz, ejecución de comandos del sistema, integración con la API de Gemini y una interfaz gráfica desarrollada con PyQt5.

> El proyecto sigue manteniendo los archivos originales de la plantilla AI Studio. Consulta la sección [Aplicación web AI Studio](#aplicación-web-ai-studio) si deseas ejecutarla.

## Características

- Reconocimiento de voz en español mediante `speech_recognition` y `PyAudio`.
- Respuestas habladas usando `pyttsx3` (funciona sin conexión).
- Interfaz de escritorio moderna desarrollada con PyQt5.
- Procesamiento de lenguaje natural modular con reglas básicas y soporte para Gemini.
- Ejecución de acciones del sistema operativo: abrir aplicaciones, buscar en la web, reproducir música, obtener la hora/fecha, localizar archivos.
- Arquitectura escalable lista para extender con nuevos comandos personalizados.

## Estructura del proyecto

```
athena/
├── actions/              # Ejecución de comandos del sistema
├── core/                 # Coordinador principal
├── gui/                  # Interfaz PyQt5
├── nlp/                  # Procesamiento de lenguaje natural y cliente Gemini
├── speech/               # Reconocimiento de voz
├── tts/                  # Síntesis de voz
├── config.py             # Configuración basada en variables de entorno
main.py                   # Punto de entrada de la aplicación
requirements.txt          # Dependencias de Python
```

## Requisitos previos

- Windows 10/11 (el ejemplo incluye rutas de aplicaciones comunes en Windows).
- Python 3.11 o superior.
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) para compilar PyAudio en caso de ser necesario.
- Controladores de audio funcionando (micrófono y altavoces).
- Una clave válida de Gemini (Google Generative AI) exportada como `GEMINI_API_KEY`.

## Instalación

1. Crea y activa un entorno virtual:
   ```bash
   python -m venv .venv
   .venv\\Scripts\\activate  # En PowerShell
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Configura la clave de Gemini:
   ```powershell
   setx GEMINI_API_KEY "TU_API_KEY"
   ```
   Después de ejecutar `setx`, abre una nueva terminal para heredar la variable.

## Ejecución

1. Inicia Athena:
   ```bash
   python main.py
   ```
2. En la interfaz podrás:
   - Presionar **🎤 Escuchar** para habilitar el reconocimiento por voz.
   - Escribir comandos directamente en la caja de texto.
   - Visualizar el historial de conversación en tiempo real.

### Ejemplos de comandos

- "Athena, abre Chrome"
- "¿Qué hora es?"
- "Busca en Google inteligencia artificial"
- "Reproduce música"
- "Busca el archivo presupuesto"
- "Explícame la teoría de la relatividad" (usa Gemini para responder)

## Empaquetado con PyInstaller

1. Instala PyInstaller:
   ```bash
   pip install pyinstaller
   ```
2. Genera el ejecutable:
   ```bash
   pyinstaller --name Athena --noconfirm --windowed --add-data "athena;athena" main.py
   ```
3. El ejecutable se creará en `dist/Athena/Athena.exe`. Copia junto a él los archivos adicionales que requieras (por ejemplo, iconos o configuraciones personalizadas).

> Sugerencia: prueba el ejecutable en una máquina limpia para verificar que incluye todas las dependencias.

## Añadir nuevas acciones

1. Implementa el comportamiento en `athena/actions/system_executor.py` o crea un nuevo módulo dentro de `athena/actions`.
2. Añade la lógica de detección en `athena/nlp/processor.py` siguiendo el patrón de métodos `_handle_*`.
3. Opcionalmente extiende la interfaz gráfica para incluir botones dedicados.

## Solución de problemas

- **El micrófono no funciona:** verifica que PyAudio detecte tu dispositivo y que el sistema operativo otorgue permisos a la aplicación.
- **No escucho la voz de Athena:** asegúrate de que `pyttsx3` tenga voces instaladas en Windows (Panel de control → Configuración de voz).
- **Las acciones del sistema no se ejecutan:** ajusta las rutas de aplicaciones en `SystemCommandExecutor._app_paths`.
- **Las respuestas de Gemini no llegan:** confirma que `GEMINI_API_KEY` esté configurada y que tengas acceso a la API.

## Aplicación web AI Studio

El repositorio incluye la plantilla original de Google AI Studio. Para ejecutarla:

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea `.env.local` con tu `GEMINI_API_KEY`.
3. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

Esto levantará la aplicación web definida en los archivos `App.tsx` y asociados.
