// SE-08 (adicional propuesto) Métodos HTTP no permitidos: no deben modificar ni exponer datos.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

export default function () {
  const antes = http.get(`${BASE}/api/messages`).json("messages").length;
  for (const metodo of ["PUT", "PATCH", "DELETE", "OPTIONS", "TRACE"]) {
    const res = http.request(metodo, `${BASE}/api/messages`, metodo === "OPTIONS" || metodo === "TRACE" ? null : "{}", JSON_HEADERS);
    check(res, { [`${metodo} rechazado (404/405/501)`]: (r) => [404, 405, 501].includes(r.status), "sin trazas internas": sinTraza });
  }
  for (const metodo of ["POST", "PUT", "DELETE"]) {
    const res = http.request(metodo, `${BASE}/api/student`, "{}", JSON_HEADERS);
    check(res, { [`${metodo} /api/student rechazado`]: (r) => r.status >= 400 });
  }
  const despues = http.get(`${BASE}/api/messages`).json("messages").length;
  check(null, { "los datos no cambiaron": () => antes === despues, "servidor sigue disponible": vivo });
}
