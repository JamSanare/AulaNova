// RD-05 Mezcla de lecturas: usuarios repartidos entre página, perfil, cursos y mensajes.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, DUR } from "../lib.js";

const RUTAS = ["/", "/api/student", "/api/courses", "/api/messages"];
const porRuta = Math.max(1, Math.floor(TARGET_VUS / RUTAS.length));
const escenarios = {};
RUTAS.forEach((ruta, i) => {
  escenarios[`ruta_${i}`] = {
    executor: "ramping-vus", exec: "leer", env: { RUTA: ruta },
    stages: [{ duration: "10s", target: porRuta }, { duration: DUR, target: porRuta }, { duration: "5s", target: 0 }],
  };
});

export const options = {
  scenarios: escenarios,
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"], checks: ["rate>0.99"] },
};

export function leer() {
  const res = http.get(`${BASE}${__ENV.RUTA}`, { tags: { ruta: __ENV.RUTA } });
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.2);
}
