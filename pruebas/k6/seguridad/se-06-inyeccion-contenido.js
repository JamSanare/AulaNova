// SE-06 Inyección de contenido en mensajes: etiquetas y caracteres especiales deben tratarse como texto.
// Servidor: se almacena literalmente y se devuelve como JSON (nosniff). Interfaz: app.js usa escapeHtml (revisión estática).
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

const CARGAS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "\"><svg/onload=alert(1)>",
  "' OR '1'='1'; DROP TABLE mensajes;--",
  "{{7*7}} ${7*7} <%= 7*7 %>",
];

export default function () {
  for (const carga of CARGAS) {
    const res = http.post(`${BASE}/api/messages`, JSON.stringify({ courseId: "calc-201", subject: "Prueba XSS", body: carga + " texto" }), JSON_HEADERS);
    check(res, {
      [`${carga.slice(0, 20)} aceptado como texto (201)`]: (r) => r.status === 201,
      "devuelto sin interpretar (igual al original)": (r) => r.json("message.body") === carga + " texto",
      "Content-Type JSON": (r) => (r.headers["Content-Type"] || "").includes("application/json"),
      "X-Content-Type-Options nosniff": (r) => r.headers["X-Content-Type-Options"] === "nosniff",
    });
  }
  const lista = http.get(`${BASE}/api/messages`);
  check(lista, { "bandeja servida como JSON, no HTML": (r) => (r.headers["Content-Type"] || "").includes("application/json") && !/^\s*</.test(r.body) });
  check(null, { "servidor sigue disponible": vivo });
}
