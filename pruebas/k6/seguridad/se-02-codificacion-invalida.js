// SE-02 Codificación inválida en rutas: percent-encoding que decodeURIComponent no puede decodificar.
// Nota: k6 (Go) rechaza en el cliente escapes sintácticamente rotos como "%zz" o "%A"; esos casos se cubren en
// FT-25 (funcionales, con fetch de Node). Aquí se usan secuencias con hex válido pero UTF-8 inválido.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

export default function () {
  for (const ruta of ["/%E0%A4", "/%FF", "/%C0%AF", "/%80", "/app%E0%A4%A8%E0/styles.css", "/%ED%A0%80"]) {
    const res = http.get(`${BASE}${ruta}`);
    check(res, {
      [`${ruta} error controlado (400/404)`]: (r) => r.status === 400 || r.status === 404,
      [`${ruta} sin trazas internas`]: sinTraza,
      [`${ruta} responde JSON`]: (r) => (r.headers["Content-Type"] || "").includes("application/json"),
    });
  }
  check(null, { "servidor sigue disponible": vivo });
}
