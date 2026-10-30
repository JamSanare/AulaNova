// RD-01 Carga de inicio: solicitudes concurrentes a "/".
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, DUR } from "../lib.js";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: DUR, target: TARGET_VUS }, { duration: "5s", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"], checks: ["rate>0.99"] },
};

export default function () {
  const res = http.get(`${BASE}/`);
  check(res, { "HTTP 200": (r) => r.status === 200, "contiene Aula Nova": (r) => r.body.includes("Aula Nova") });
  sleep(0.2);
}
