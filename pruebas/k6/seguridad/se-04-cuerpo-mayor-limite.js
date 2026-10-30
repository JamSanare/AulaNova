// SE-04 Cuerpo mayor al límite (16 KiB): debe responder 413 y el proceso seguir disponible.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

export default function () {
  for (const kb of [17, 64, 512, 2048]) {
    const cuerpo = JSON.stringify({ courseId: "calc-201", subject: "Grande", body: "x".repeat(kb * 1024) });
    const res = http.post(`${BASE}/api/messages`, cuerpo, JSON_HEADERS);
    check(res, { [`${kb} KiB responde 413`]: (r) => r.status === 413, "sin trazas internas": sinTraza });
  }
  check(null, { "servidor sigue disponible": vivo });
}
