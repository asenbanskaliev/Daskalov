# Cinco validaciones técnicas ejecutables — Daskalov, 8 noviembre 2026

**Alcance:** integración privada, modo de voz, 3D, lecciones y protección infantil. No es una certificación WCAG, jurídica, de voz o de un modelo LLM. **No desbloquea FULL ni despliegue público.**

## Evidencias verificables

- **CI unitario:** [run 42486785297](https://github.com/asenbanskaliev/Daskalov/actions/runs/42486785297), `success` con tests Node de la tanda.
- **Chromium/Firefox:** [run 42486756258](https://github.com/asenbanskaliev/Daskalov/actions/runs/42486756258); resultado por motor sujeto a comprobación del run completo.
- Se detectó y corrigió un timeout de una prueba que intentaba recorrer los nueve retos en un único test Chrome. Ahora se ejecutan de forma independiente por nivel y sin WebGL para separar el objetivo pedagógico del rendimiento 3D.

| ID | Qué hace la prueba y dónde | Acredita | No acredita |
| --- | --- | --- | --- |
| VAL-01 — conversación | `e2e/validation-five.spec.js` + `tests/validation-five-integration.test.mjs`: navegador ↔ API Node real ↔ protocolo NDJSON ↔ historial. Comprueba el flujo del bypass determinista de seguridad y un flujo LLM inyectado sin conexión exterior. | Intercambio HTTP y respuesta mostrada con secuencia válida. | Respuestas de NVIDIA, OpenRouter, Ollama o Beam en producción. |
| VAL-02 — voz | `e2e/validation-voice-silent.spec.js`, `tests/tts-cloud-ui.test.mjs`, `tests/validation-five-integration.test.mjs`: el modo **Sin voz** hace cero llamadas TTS y cero Web Speech; WAV PCM16 real se valida sobre HTTP con un sintetizador de prueba. La voz de lectura se inicia desactivada. | Control de silencio, formato y conexión HTTP del audio. | Calidad vocal de Piper/Kokoro, acento búlgaro, síntesis de voz real y derechos de intérprete. |
| VAL-03 — rendimiento | `e2e/validation-five.spec.js`: métricas de FPS, geometrías, draw calls, vertex lighting desde navegador con WebGL cuando está disponible; si no, lecciones por texto. | Instrumentación del navegador; no se inventa VRAM. | 5 minutos de FPS ≥55/≥30, VRAM medida y GPU física de referencia. |
| VAL-04 — calidad educativa | `e2e/validation-five.spec.js` y `tests/validation-pedagogy-key.test.mjs`: 3 materias × 3 niveles, clave de respuestas independiente, respuestas y feedback. `tests/persona-300.test.mjs` conserva dataset 100/100/50/50 con validaciones estáticas. | Corrección mecánica de nueve ejercicios sencillos y contratos de 300 casos sintéticos. | Revisión docente de contenidos, 300 inferencias LLM reales o exactitud histórica exhaustiva. |
| VAL-05 — seguridad infantil | `e2e/validation-five.spec.js`, `tests/validation-five-integration.test.mjs`, `tests/speech-segments.test.mjs`: memoria por defecto apagada, voz opt-in, modo Demo sin peticiones de IA/TTS/STT, TTS Cloud rechazado sin permiso y moderación del modelo antes de dividir la frase en audio. | Control de privacidad local y respuestas inseguras fragmentadas en el caso probado. | Auditoría legal de menores, control parental verificado, seguridad de modelos adversariales arbitrarios ni borrado de backups externos. |

## Reproducción local

Usar Node 24, servidor privado y solo datos sintéticos:

```bash
npm ci --ignore-scripts
npm run build
node --test tests/validation-five-integration.test.mjs tests/validation-pedagogy-key.test.mjs tests/speech-segments.test.mjs tests/tts-cloud-ui.test.mjs tests/persona-300.test.mjs
npx playwright install chromium firefox
npx playwright test e2e/validation-five.spec.js e2e/validation-voice-silent.spec.js --project=chromium
npx playwright test e2e/validation-five.spec.js e2e/validation-voice-silent.spec.js --project=firefox
```

**Restricciones:** no se usan API keys, cuentas reales, estudiantes ni grabaciones; el navegador está en localhost. El **reporte de VALIDACIÓN** sigue separado de los gates externos del ODD: 25 puntos abiertos hasta superar sus propias evidencias legales, humanas, físicas, de proveedores y/o despliegue.
