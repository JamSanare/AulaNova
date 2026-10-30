// SE-01 Acceso a archivos fuera de app/: traversal codificado.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

const RUTAS = [
  "/..%2Fbackend%2Fserver.js", "/%2e%2e%2fbackend%2fserver.js", "/..%2F..%2Fpackage.json",
  "/%2e%2e/%2e%2e/package.json", "/..%5Cbackend%5Cserver.js", "/%2e%2e%5c%2e%2e%5cpackage.json",
  "/..%252Fbackend%252Fserver.js", "/....%2F%2Fbackend%2Fserver.js",
];

export default function () {
  for (const ruta of RUTAS) {
    const res = http.get(`${BASE}${ruta}`);
    check(res, {
      [`${ruta} rechazado (400/403/404)`]: (r) => [400, 403, 404].includes(r.status),
      [`${ruta} no revela código del backend`]: (r) => !/createServer|require\(|"name": "aula-virtual"/.test(r.body || ""),
    });
  }
  check(null, { "servidor sigue disponible": vivo });
}
