// SE-05 Validación de campos: curso inexistente, asunto y mensaje fuera de rango → HTTP 400.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

const ok = { courseId: "calc-201", subject: "Asunto válido", body: "Mensaje válido" };
const casos = {
  "curso inexistente": { ...ok, courseId: "no-existe" },
  "curso ausente": { subject: ok.subject, body: ok.body },
  "asunto de 2 caracteres": { ...ok, subject: "ab" },
  "asunto de 101 caracteres": { ...ok, subject: "a".repeat(101) },
  "asunto solo espacios": { ...ok, subject: "     " },
  "mensaje de 4 caracteres": { ...ok, body: "abcd" },
  "mensaje de 1001 caracteres": { ...ok, body: "a".repeat(1001) },
  "mensaje solo espacios": { ...ok, body: "          " },
  "asunto numérico": { ...ok, subject: 123456 },
  "curso como objeto": { ...ok, courseId: { id: "calc-201" } },
};

export default function () {
  for (const [nombre, payload] of Object.entries(casos)) {
    const res = http.post(`${BASE}/api/messages`, JSON.stringify(payload), JSON_HEADERS);
    check(res, { [`${nombre} → 400`]: (r) => r.status === 400, "sin trazas internas": sinTraza });
  }
  check(null, { "servidor sigue disponible": vivo });
}
