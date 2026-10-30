// SE-07 (adicional propuesto) Cabeceras de seguridad en página y API; sin cabeceras CORS abiertas.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

export default function () {
  const pagina = http.get(`${BASE}/`);
  check(pagina, {
    "CSP presente con default-src 'self'": (r) => (r.headers["Content-Security-Policy"] || "").includes("default-src 'self'"),
    "CSP bloquea frames (frame-ancestors 'none')": (r) => (r.headers["Content-Security-Policy"] || "").includes("frame-ancestors 'none'"),
    "X-Frame-Options DENY": (r) => r.headers["X-Frame-Options"] === "DENY",
    "nosniff": (r) => r.headers["X-Content-Type-Options"] === "nosniff",
    "Referrer-Policy": (r) => !!r.headers["Referrer-Policy"],
    "sin X-Powered-By": (r) => !r.headers["X-Powered-By"],
  });
  const api = http.get(`${BASE}/api/courses`, { headers: { Origin: "https://sitio-malicioso.example" } });
  check(api, {
    "API sin Access-Control-Allow-Origin abierto": (r) => !r.headers["Access-Control-Allow-Origin"],
    "API con Cache-Control no-store": (r) => r.headers["Cache-Control"] === "no-store",
  });
}
