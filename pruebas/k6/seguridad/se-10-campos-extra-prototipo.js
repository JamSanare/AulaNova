// SE-10 (adicional propuesto) Campos adicionales y contaminación de prototipo: se ignoran, no alteran el servidor.
import http from "k6/http";
import { check } from "k6";
import { BASE, JSON_HEADERS } from "../lib.js";

export const options = { vus: 1, iterations: 1, thresholds: { checks: ["rate==1"] } };
const sinTraza = (r) => !/(\bat\s.+\(|node:internal|\.js:\d+|ReferenceError|SyntaxError|stack)/i.test(r.body || "");
const vivo = () => http.get(`${BASE}/api/student`).status === 200;

export default function () {
  const cuerpos = [
    '{"courseId":"calc-201","subject":"Asunto ok","body":"Mensaje ok","isAdmin":true,"id":"msg-hack","teacher":"Hacker","createdAt":"2000-01-01"}',
    '{"__proto__":{"polluted":true},"courseId":"calc-201","subject":"Asunto ok","body":"Mensaje ok"}',
    '{"constructor":{"prototype":{"polluted":true}},"courseId":"calc-201","subject":"Asunto ok","body":"Mensaje ok"}',
  ];
  for (const c of cuerpos) {
    const res = http.post(`${BASE}/api/messages`, c, JSON_HEADERS);
    check(res, {
      "acepta o rechaza sin error 5xx": (r) => r.status === 201 || r.status === 400,
      "no acepta id/profesor/fecha impuestos": (r) => r.status !== 201 || (r.json("message.id") !== "msg-hack" && r.json("message.teacher") === "Dra. Elena Torres" && r.json("message.createdAt") !== "2000-01-01"),
      "no expone campos extra (isAdmin)": (r) => r.status !== 201 || r.json("message.isAdmin") === undefined,
    });
  }
  const sano = http.get(`${BASE}/api/courses`);
  check(sano, { "servidor sin contaminación (curso sigue válido)": (r) => r.status === 200 && r.json("courses").length === 4 });
  check(null, { "servidor sigue disponible": vivo });
}
