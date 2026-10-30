// RD-03 Consulta de cursos: carga sostenida de GET /api/courses.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, DUR, jsonOk } from "../lib.js";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: DUR, target: TARGET_VUS }, { duration: "5s", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<300"], checks: ["rate>0.99"] },
};

export default function () {
  const res = http.get(`${BASE}/api/courses`);
  check(res, {
    "HTTP 200": (r) => r.status === 200,
    "4 cursos presentes": (r) => jsonOk(r, (j) => j.courses.length === 4),
    "calificaciones presentes": (r) => jsonOk(r, (j) => j.courses.every((c) => c.grades && "final" in c.grades)),
  });
  sleep(0.2);
}
