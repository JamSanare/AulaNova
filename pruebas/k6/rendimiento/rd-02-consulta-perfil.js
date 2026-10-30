// RD-02 Consulta de perfil: carga sostenida de GET /api/student.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, DUR, jsonOk } from "../lib.js";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: DUR, target: TARGET_VUS }, { duration: "5s", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<300"], checks: ["rate>0.99"] },
};

export default function () {
  const res = http.get(`${BASE}/api/student`);
  check(res, {
    "HTTP 200": (r) => r.status === 200,
    "JSON válido con perfil": (r) => jsonOk(r, (j) => j.student && j.student.code === "202310458"),
  });
  sleep(0.2);
}
