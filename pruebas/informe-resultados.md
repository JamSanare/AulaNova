# Informe de pruebas — Aula Nova (Grafana k6)

**Herramientas:** Node.js 22, Grafana k6 v0.54.0, servidor local (`npm start`).
**Nota de ejecución:** duraciones reducidas (fase sostenida 15 s, escalones 10 s, estabilidad 90 s en lugar de 30 min, sobrecarga 60 s en lugar de 5 min), concurrencia normal `TARGET_VUS=20`, todo en localhost. Cada script de estrés se ejecutó contra un servidor nuevo para evitar contaminación por mensajes en memoria. Repetir con tiempos completos en el equipo de entrega (ver `pruebas/README.md`).

## 1. Pruebas funcionales
27 casos (FT-01…FT-27, detalle en `funcional/casos-funcionales.md`): **27 aprobados, 0 fallidos.**

## 2. Rendimiento (umbrales: p95 < 300/500 ms, errores < 1 %)
| # | Caso | Script | Solicitudes | p95 | Errores | Resultado |
|---|---|---|---|---|---|---|
| 1 | Carga de inicio | rd-01 | 2.259 | 0,9 ms | 0 % | Cumple |
| 2 | Consulta de perfil | rd-02 | 2.260 | 0,5 ms | 0 % | Cumple |
| 3 | Consulta de cursos | rd-03 | 2.260 | 0,6 ms | 0 % | Cumple |
| 4 | Consulta de mensajes (bandeja vacía) | rd-04 | 2.261 | 0,3 ms | 0 % | Cumple |
| 5 | Mezcla de lecturas | rd-05 | 2.297 | 0,9 ms | 0 % | Cumple |
| 6 | Envío de mensajes válidos | rd-06 | 1.511 | 1,0 ms | 0 % | Cumple (201) |
| 7 | Lecturas con escrituras | rd-07 | 2.234 | 7,2 ms | 0 % | Cumple; mensajes aparecen en la bandeja |
| 8 | Variación del tamaño del cuerpo (5–1000 car.) | rd-08 | 1.512 | 0,9 ms | 0 % | Cumple (201) |
| 9 | Estabilidad sostenida (90 s) | rd-09 | 1.790 | 8,4 ms | 0 % | Cumple; p95 12,2 ms (1.er tercio) → 7,1 ms (último): sin degradación |
| 10 | Capacidad objetivo | rd-10 | 2.471 | 12,6 ms | 0 % | Cumple en niveles 5, 10, 15 y 20 usuarios |

## 3. Estrés (umbrales referenciales)
| # | Caso | Script | Observación |
|---|---|---|---|
| 1 | Rampa sobre la carga normal (hasta 10×, 200 usuarios) | es-01 | p95 5,8 ms, 0 % errores; no se halló punto de degradación en el rango probado |
| 2 | Pico repentino (5 → 200 usuarios) | es-02 | p95 16,7 ms, 0 % errores, recupera al bajar |
| 3 | Sobrecarga sostenida (3×, 60 s) | es-03 | p95 20,8 ms, 0 % errores; CPU máx. ~22 % |
| 4 | Sobrecarga de `/api/courses` | es-04 | ~8.200 req/s; sonda en otras rutas p95 37,8 ms: **no hay afectación** |
| 5 | Sobrecarga de `/api/messages` con bandeja creciente | es-05 | **Umbral incumplido:** con 1.000+ mensajes (520–800 KB por respuesta) lecturas p95 ≈ 1,09 s, máx. 15,8 s |
| 6 | Pico de envíos válidos | es-06 | 18.150 POST, p95 0,4 ms, 0 % errores |
| 7 | Cuerpos cercanos a 16 KiB | es-07 | Variantes 201 / 400 / 413 según lo esperado (100 % checks) |
| 8 | Solicitudes inválidas bajo carga | es-08 | 100 % de rechazos 400 correctos; tráfico válido p95 96 ms |
| 9 | Saturación de conexiones (500 nuevas concurrentes) | es-09 | 219.451 solicitudes, 0 fallos, p95 105 ms |
| 10 | Recuperación tras el estrés | es-10 | p95 base 3,3 ms; tras picos 2,3 ms; servidor disponible |

**Hallazgo principal:** `GET /api/messages` devuelve la lista completa sin paginar y los mensajes no tienen tope en memoria. En una primera tanda con servidor compartido (decenas de miles de mensajes acumulados) el servidor llegó a ~1,7 GB de RSS, la latencia de ES-08 subió a ~2 s y k6 fue terminado en ES-10; en servidor limpio esas dos pruebas pasan. La causa (lecturas simultáneas de una lista muy grande) es una inferencia, no se midió el número exacto de mensajes.
**Recomendación:** paginar o limitar la bandeja (p. ej. últimos N mensajes), poner un tope al total almacenado y un límite de peticiones por cliente.

## 4. Seguridad (156 checks, 0 fallidos)
| # | Caso | Script | Resultado |
|---|---|---|---|
| 1 | Traversal fuera de `app/` (8 variantes) | se-01 | Rechazado (403/404), sin revelar código |
| 2 | Codificación inválida en rutas | se-02 | 400 controlado, sin trazas (k6 no envía `%zz`; cubierto por FT-25) |
| 3 | JSON malformado | se-03 | 400, no se insertan mensajes, servidor activo |
| 4 | Cuerpo > 16 KiB (17 KiB–2 MiB) | se-04 | 413, servidor activo |
| 5 | Validación de campos (10 variantes) | se-05 | 400 en todas |
| 6 | Inyección de contenido (HTML/SQL/plantillas) | se-06 | Almacenado como texto, JSON con `nosniff`; la interfaz usa `escapeHtml` |
| 7* | Cabeceras de seguridad / CORS | se-07 | CSP, X-Frame-Options, nosniff, Referrer-Policy; sin CORS abierto |
| 8* | Métodos HTTP no permitidos | se-08 | Rechazados, datos sin cambios |
| 9* | Fuga de información | se-09 | Archivos sensibles inaccesibles, errores genéricos |
| 10* | Campos extra y `__proto__` | se-10 | Ignorados, sin contaminación |

\* Casos adicionales propuestos: el enunciado menciona 10 pero lista 6.

**Observaciones (demo):** sin autenticación, sin límite de peticiones y escucha en `0.0.0.0`.
