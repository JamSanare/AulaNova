// ES-09 Saturación de conexiones: muchas conexiones concurrentes NUEVAS (sin reutilización) y vuelta a pocas.
// Una sonda con keep-alive mide si el servidor sigue respondiendo durante la saturación.
// En Linux/macOS: ulimit -n 65535 antes de ejecutar.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS } from "../lib.js";

const MAX = Number(__ENV.MAX_CONN || TARGET_VUS * 25);
export const options = {
  noConnectionReuse: true,
  noVUConnectionReuse: true,
  scenarios: {
    saturacion: {
      executor: "ramping-vus", exec: "saturar",
      stages: [{ duration: "15s", target: MAX / 2 }, { duration: "15s", target: MAX }, { duration: "30s", target: MAX }, { duration: "10s", target: 5 }, { duration: "30s", target: 5 }],
    },
  },
  thresholds: { "http_req_failed": ["rate<0.10"], "http_req_duration": ["p(95)<2000"] },
};

export function saturar() {
  const res = http.get(`${BASE}/api/courses`, { timeout: "10s" });
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.05);
}
