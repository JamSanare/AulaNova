// SE-09 (adicional propuesto) Fuga de información: errores genéricos y rutas sensibles no accesibles.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

const SENSIBLES = ["/package.json", "/backend/server.js", "/README.md", "/.env", "/.git/config", "/node_modules/", "/server.js", "/app/../package.json"];

export default function () {
  for (const ruta of SENSIBLES) {
    const res = http.get(`${BASE}${ruta}`);
    check(res, {
      [`${ruta} no accesible (404/403)`]: (r) => r.status === 404 || r.status === 403,
      [`${ruta} no revela contenido`]: (r) => !/"name":|createServer|DB_PASSWORD|\[core\]/.test(r.body || ""),
    });
  }
  const api = http.get(`${BASE}/api/no-existe`);
  check(api, { "404 de API genérico": (r) => r.status === 404 && sinTraza(r) });
  check(null, { "servidor sigue disponible": vivo });
}
