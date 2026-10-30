#!/usr/bin/env bash
# Uso: ./monitor.sh <PID_del_servidor> [salida.csv] [intervalo_s]
# Registra CPU (%) y memoria RSS (MB) del proceso Node mientras corre k6. Ctrl+C para terminar.
PID="${1:?Indica el PID del servidor (node backend/server.js)}"
OUT="${2:-resultados-monitor.csv}"
INT="${3:-2}"
echo "hora,cpu_pct,rss_mb" > "$OUT"
while kill -0 "$PID" 2>/dev/null; do
  read -r cpu rss < <(ps -o %cpu=,rss= -p "$PID")
  echo "$(date +%H:%M:%S),$cpu,$(awk -v r="$rss" 'BEGIN{printf "%.1f", r/1024}')" >> "$OUT"
  sleep "$INT"
done
