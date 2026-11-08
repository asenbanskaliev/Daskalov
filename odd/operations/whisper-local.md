# Whisper.cpp local — instalación privada y consentida

Se utiliza el servidor HTTP oficial `whisper-server` de [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp/tree/master/examples/server). El código usa licencia MIT (comprobar licencia y atribución en el repositorio instalado); el modelo acústico descargado y ffmpeg deben verificarse por separado. No se incluye ningún archivo de voz ni modelo, ni se descarga código al ejecutar el servidor Node.

**Windows PowerShell (disco D):**

1. Instalar manualmente CMake, compilador C++ y ffmpeg desde orígenes autorizados; descargar/compilar `whisper.cpp` según sus instrucciones, bajo `D:\whisper.cpp`.
2. Obtener y validar un modelo multilingüe de origen fiable: por ejemplo `D:\whisper.cpp\models\ggml-base.bin` (no usar `.en` para español).
3. Ejecutar `powershell -NoProfile -File scripts/start-whisper-local.ps1 -ServerBin 'D:\whisper.cpp\build\bin\Release\whisper-server.exe' -Model 'D:\whisper.cpp\models\ggml-base.bin' -Convert`.
4. En el backend Daskalov establecer `DASKALOV_WHISPER_URL=http://127.0.0.1:8080/`, ejecutar `npm start` y elegir **Whisper local**. Solo se permite loopback: audio WebM/Ogg requiere `--convert` y ffmpeg.

**Limitaciones:** archivos de hasta 2 MiB, tiempo de respuesta máximo de 60 segundos, sin guardarlos en Daskalov. El modo local no activa Cloud. Mantener el servidor en localhost sin exponerlo a redes y revisar el riesgo de uploads/ffmpeg. Los tests automatizados usan un transcriptor falso; falta medir un servidor instalado con 20 grabaciones reales autorizadas, WER y compatibilidad en dispositivos. No declarar STT-READY ni privacidad infantil validada con este runbook.
