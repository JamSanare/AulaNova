// ES-07 Cuerpos cercanos al máximo aceptado (16 KiB = 16384 bytes).
// Variante A (~16300 B, campos válidos + relleno extra): se espera 201 (el campo extra se ignora).
// Variante B (~16300 B con "body" de ~16000 caracteres): se espera 400 (supera 1000 caracteres).
// Variante C (> 16384 B): se espera 413.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, JSON_HEADERS, pick, CURSOS } from "../lib.js";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: "40s", target: TARGET_VUS * 2 }, { duration: "10s", target: 0 }],
  thresholds: { http_req_failed: ["rate<1"], "http_req_duration{variante:A}": ["p(95)<1000"], checks: ["rate>0.99"] },
};

const base = (n) => JSON.stringify({ courseId: "calc-201", subject: "Cuerpo grande", body: "Mensaje de prueba", relleno: "r".repeat(n) });
const A = (() => { const vacio = base(0).length; return base(16300 - vacio); })();
const B = JSON.stringify({ courseId: "calc-201", subject: "Cuerpo grande", body: "b".repeat(16300 - 70) });
const C = JSON.stringify({ courseId: "calc-201", subject: "Cuerpo grande", body: "x".repeat(16 * 1024 + 500) });

export default function () {
  const v = pick(["A", "B", "C"]);
  const payload = { A, B, C }[v];
  const esperado = { A: 201, B: 400, C: 413 }[v];
  const res = http.post(`${BASE}/api/messages`, payload, { ...JSON_HEADERS, tags: { variante: v } });
  check(res, { [`variante ${v} responde ${esperado}`]: (r) => r.status === esperado });
  sleep(0.2);
}
