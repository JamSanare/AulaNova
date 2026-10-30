#!/usr/bin/env bash
# Uso: ./ejecutar.sh <rendimiento|estres|seguridad|funcional|todo> [BASE_URL]
#  - Sin BASE_URL: levanta un servidor NUEVO (puerto 3000) para cada script, así el estado en memoria
#    (mensajes) de una prueba no contamina a la siguiente, y registra CPU/RSS en resultados/<script>-monitor.csv.
#  - Con BASE_URL: usa ese servidor (ya iniciado por ti) tal cual.
# Variables opcionales: TARGET_VUS (20), DUR (30s), STEP_DUR, SOAK_DURATION (30m), K6 (ruta del binario), PORT (3000)
set -u
cd "$(dirname "$0")/../.."
SUITE="${1:-todo}"; EXTERNO="${2:-}"; K6="${K6:-k6}"; PORT="${PORT:-3000}"
BASE_URL="${EXTERNO:-http://localhost:$PORT}"
OUT="pruebas/resultados"; mkdir -p "$OUT"

correr() {  # $1 = carpeta
  for f in pruebas/k6/$1/*.js; do
    n=$(basename "$f" .js); echo "=== $n ==="
    SP=""; MP=""
    if [ -z "$EXTERNO" ]; then
      PORT="$PORT" node backend/server.js > "$OUT/$n-servidor.log" 2>&1 & SP=$!
      sleep 1
      ( echo "hora,cpu_pct,rss_mb"; while kill -0 "$SP" 2>/dev/null; do
          read -r c r < <(ps -o %cpu=,rss= -p "$SP" 2>/dev/null) || break
          echo "$(date +%T),$c,$(awk -v r="${r:-0}" 'BEGIN{printf "%.1f", r/1024}')"; sleep 2; done ) > "$OUT/$n-monitor.csv" & MP=$!
    fi
    "$K6" run -q -e BASE_URL="$BASE_URL" --summary-export "$OUT/$n.json" "$f" > "$OUT/$n.txt" 2>&1
    echo "   código de salida: $? (0 = umbrales cumplidos, 99 = umbral incumplido)"
    if [ -n "$SP" ]; then
      kill -0 "$SP" 2>/dev/null && echo "   servidor: vivo al terminar" || echo "   servidor: CAÍDO"
      kill "$SP" "$MP" 2>/dev/null; wait 2>/dev/null
    fi
  done
}
case "$SUITE" in
  funcional)   node --test pruebas/funcional/funcionales.test.js ;;
  rendimiento) correr rendimiento ;;
  estres)      correr estres ;;
  seguridad)   correr seguridad ;;
  todo) node --test pruebas/funcional/funcionales.test.js; correr rendimiento; correr estres; correr seguridad ;;
  *) echo "Suite desconocida: $SUITE"; exit 1 ;;
esac
