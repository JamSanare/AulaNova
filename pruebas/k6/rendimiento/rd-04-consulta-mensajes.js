// RD-04 Consulta de mensajes: GET /api/messages con bandeja inicialmente vacía.
// Ejecutar sobre un servidor recién iniciado. Si ya hay mensajes: -e EXPECT_EMPTY=0
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, DUR, jsonOk } from "../lib.js";

const VACIA = (__ENV.EXPECT_EMPTY || "1") === "1";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: DUR, target: TARGET_VUS }, { duration: "5s", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<300"], checks: ["rate>0.99"] },
};

export default function () {
  const res = http.get(`${BASE}/api/messages`);
  check(res, {
    "HTTP 200": (r) => r.status === 200,
    "JSON válido (messages es arreglo)": (r) => jsonOk(r, (j) => Array.isArray(j.messages)),
    "bandeja vacía": (r) => !VACIA || jsonOk(r, (j) => j.messages.length === 0),
  });
  sleep(0.2);
}
