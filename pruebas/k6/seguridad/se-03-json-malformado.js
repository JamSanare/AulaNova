// SE-03 JSON malformado en POST /api/messages: debe rechazarse sin insertar mensajes ni caer.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

const total = () => http.get(`${BASE}/api/messages`).json("messages").length;

export default function () {
  const antes = total();
  for (const cuerpo of ["{", "{'courseId':'calc-201'}", "{\"courseId\":", "", "not json", "{\"a\":1}}", "\u0000\u0001"]) {
    const res = http.post(`${BASE}/api/messages`, cuerpo, JSON_HEADERS);
    check(res, { [`"${cuerpo.slice(0, 15)}" rechazado con 400`]: (r) => r.status === 400, "sin trazas internas": sinTraza });
  }
  check(null, { "no se insertaron mensajes": () => total() === antes, "servidor sigue disponible": vivo });
}
