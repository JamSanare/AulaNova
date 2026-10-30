// RD-10 Capacidad objetivo: escalones de usuarios hasta la concurrencia prevista (TARGET_VUS).
// Cada nivel tiene su propio umbral; el máximo nivel en verde es la capacidad que cumple los umbrales.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, pick } from "../lib.js";

const PASO = Number(__ENV.STEP_DUR || 20);
const niveles = [0.25, 0.5, 0.75, 1].map((f) => Math.max(1, Math.round(TARGET_VUS * f)));
const scenarios = {};
const thresholds = { http_req_failed: ["rate<0.01"] };
niveles.forEach((n, i) => {
  scenarios[`nivel_${n}`] = { executor: "constant-vus", vus: n, duration: `${PASO}s`, startTime: `${i * (PASO + 2)}s`, tags: { nivel: String(n) } };
  thresholds[`http_req_duration{nivel:${n}}`] = ["p(95)<500"];
  thresholds[`http_req_failed{nivel:${n}}`] = ["rate<0.01"];
});

export const options = { scenarios, thresholds };

export default function () {
  const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`);
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.2);
}
