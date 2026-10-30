# Pruebas — Aula Nova (funcionales, rendimiento, estrés y seguridad)

## Requisitos
- Node.js 18+ y [Grafana k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`k6 version`).
- Servidor en marcha en otra terminal: `npm start` (http://localhost:3000).
  **Reinícialo antes de cada script** que dependa de la bandeja vacía (RD-04) o de memoria limpia (ES-05, ES-06).

## Orden
1. **Funcionales** (≥ 20 casos): `npm run test:funcional` — casos en `funcional/casos-funcionales.md`.
2. **Rendimiento (10)**: `k6 run pruebas/k6/rendimiento/rd-01-carga-inicio.js` …
3. **Estrés (10)**: `k6 run pruebas/k6/estres/es-01-rampa-sobre-carga.js` …
4. **Seguridad (10)**: `k6 run pruebas/k6/seguridad/se-01-traversal.js` …

Todo seguido (Linux/macOS/Git Bash): `pruebas/scripts/ejecutar.sh todo`.
Un script individual en PowerShell: `k6 run -e BASE_URL=http://localhost:3000 pruebas\k6\rendimiento\rd-02-consulta-perfil.js`.

## Parámetros (`-e NOMBRE=valor`)
| Variable | Por defecto | Uso |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Dirección del servidor |
| `TARGET_VUS` | 20 | Concurrencia prevista de uso normal (RD-10 y base del estrés) |
| `DUR` | 30s | Duración de la fase sostenida (RD-01…RD-08) |
| `STEP_DUR` | 20 / 20s | Duración de cada escalón (RD-10, ES-01, ES-04, ES-05, ES-10) |
| `SOAK_DURATION` | 30m | RD-09 (usar `2m` para verificar el script) |
| `OVERLOAD_DURATION` | 5m | ES-03 |
| `PRELOAD` | 500 | Mensajes precargados en ES-05 |
| `PEAK_RATE` | 500 | POST/s en el pico de ES-06 |
| `MAX_CONN` | `TARGET_VUS*25` | Conexiones concurrentes en ES-09 |
| `MULT` | 10 | Multiplicador del pico en ES-02 y ES-10 |

## Memoria y CPU (ES-03, ES-06)
k6 no mide el servidor. Con el servidor iniciado, en otra terminal:
```bash
pgrep -f backend/server.js        # obtiene el PID
pruebas/scripts/monitor.sh <PID> memoria.csv
```
En Windows: Administrador de tareas → proceso `node.exe`, o `Get-Process node | Select CPU,WorkingSet`.

## Cómo leer los resultados
- `✓` / `✗` en *thresholds*: umbral cumplido / no cumplido. Código de salida de k6: 0 = todo cumplido, 99 = algún umbral falló.
- Pruebas de **rendimiento** y **seguridad**: se espera todo en verde.
- Pruebas de **estrés**: los umbrales son referenciales; lo importante es *dónde* empiezan a fallar y si el servidor se recupera (ES-10).
- Los casos SE-07 a SE-10 son adicionales propuestos: el enunciado dice 10 casos de seguridad pero lista 6.
