# Preparación de 20 pruebas de audio y comparación de voz (evidencia REAL pendiente)

Cada una de las siguientes situaciones requiere una grabación autorizada y una transcripción de referencia. No incluir voces reales de menores en el repositorio ni en artefactos CI. Reunir material sintético/licenciado o voces adultas con permiso.

01. Ruido de fondo en clase y la palabra pizarra
02. Voz lejana en habitación con eco
03. Alumno habla rápido, frases encadenadas
04. Pausa entre sílabas de matemáticas
05. Nombre Profesor Daskalov
06. Nombre Petar
07. Bulgaria con acento claro
08. Matemáticas con números 13 y 30
09. Fecha histórica y año 1492
10. Dictado de la palabra geometría
11. Pregunta en voz muy baja
12. Dos voces superpuestas, foco en voz principal
13. Pregunta con carraspeo inicial
14. Habla tras silencio prolongado
15. Oración con signos ¿? y ¡!
16. Enunciado sobre una resta
17. Un alumno se interrumpe y continúa
18. Palabra desconocida en una lección
19. Ruido de tráfico fuera de la clase
20. Lectura infantil con ritmo irregular

Ejecutar `node scripts/voice-validation.mjs stt <entrada.json> <salida.json>` con datos locales, 20 casos y resultados reales de Whisper y navegadores. El informe exporta solo ID+WER; nunca las transcripciones.

Para comparar Piper/Kokoro, medir en el mismo hardware tiempo de síntesis y duración WAV de frases españolas iguales. Ejemplo de campo: engine, synthesisMs, audioDurationMs, licenseVerified. Ejecutar modo `tts`; el informe indica RTF p50/p95 sin atribuir CPU/RAM falsos. Registrar CPU y RAM por separado con herramientas de sistema y sin archivos privados.

Panel ciego: al menos tres jueces independientes; cada muestra VOICE_A/B con intelligibility, naturalness, pronunciation y educationalAppropriateness en escala 1–5. Comprobar nombres Daskalov, Petar, Bulgaria y Pamplona. Los jueces escuchan las muestras sin ver proveedor o motor. No cargar archivos de voz al CI.

Identidad de voz propuesta: grave y ligeramente áspera, teatral pero siempre clara y respetuosa, habla español natural; solo adoptar acento búlgaro cuando exista una voz original/licenciada y evaluación de hablantes nativos. No imitar a una persona real no autorizada.

Estas herramientas **no inventan resultados**. STT-READY, VOICE-READY y validación pedagógica continúan pendientes de audio/voz real, licencias y personas.
