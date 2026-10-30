// ES-04 Sobrecarga de consultas de cursos: ¿afecta a las demás rutas?
// Un escenario satura /api/courses; otro "sonda" mide /, /api/student y /api/messages con poca carga.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS } from "../lib.js";

const PASO = Number(__ENV.STEP_DUR || 20);
export const options = {
  scenarios: {
    saturacion_cursos: {
      executor: "ramping-vus", exec: "saturar",
      stages: [1, 3, 6, 10].map((m) => ({ duration: `${PASO}s`, target: TARGET_VUS * m })).concat([{ duration: "10s", target: 0 }]),
    },
    sonda: { executor: "constant-vus", vus: 3, duration: `${PASO * 4 + 10}s`, exec: "sonda" },
  },
  thresholds: {
    "http_req_duration{tipo:saturacion}": ["p(95)<1000"],
    "http_req_duration{tipo:sonda}": ["p(95)<500"], // si falla, /api/courses afecta a las otras rutas
    "http_req_failed{tipo:sonda}": ["rate<0.01"],
  },
};

export function saturar() {
  const res = http.get(`${BASE}/api/courses`, { tags: { tipo: "saturacion" } });
  check(res, { "courses 200": (r) => r.status === 200 });
}

export function sonda() {
  for (const ruta of ["/", "/api/student", "/api/messages"]) {
    const res = http.get(`${BASE}${ruta}`, { tags: { tipo: "sonda", ruta } });
    check(res, { "sonda 200": (r) => r.status === 200 });
  }
  sleep(0.5);
}
