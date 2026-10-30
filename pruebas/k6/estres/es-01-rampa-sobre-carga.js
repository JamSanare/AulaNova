// ES-01 Rampa por encima de la carga normal: identificar cuándo crecen latencia y errores.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, pick } from "../lib.js";

const PASO = Number(__ENV.STEP_DUR || 20);
const mult = [1, 2, 4, 6, 8, 10];
export const options = {
  stages: [
    ...mult.map((m) => ({ duration: `${PASO}s`, target: TARGET_VUS * m })),
    { duration: "10s", target: 0 },
  ],
  // Umbrales informativos: no se espera cumplirlos en todos los escalones.
  thresholds: { http_req_failed: ["rate<0.05"], http_req_duration: ["p(95)<1000"] },
};

export default function () {
  const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`);
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.1);
}
