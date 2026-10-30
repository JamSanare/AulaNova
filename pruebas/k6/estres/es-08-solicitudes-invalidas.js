// ES-08 Solicitudes inválidas bajo carga: 20% malformadas mezcladas con tráfico normal.
// Los rechazos (400/404/413) no deben afectar al tráfico válido.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, JSON_HEADERS, pick, mensajeValido, postMensaje } from "../lib.js";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS * 3 }, { duration: "40s", target: TARGET_VUS * 3 }, { duration: "10s", target: 0 }],
  thresholds: {
    "http_req_duration{tipo:valida}": ["p(95)<800"],
    "checks{tipo:valida}": ["rate>0.99"],
    "checks{tipo:invalida}": ["rate>0.99"],
  },
};

const INVALIDAS = [
  ["json roto", "{"], ["vacío", ""], ["array", "[]"], ["null", "null"], ["texto plano", "hola"],
  ["tipos erróneos", JSON.stringify({ courseId: 1, subject: {}, body: [] })],
  ["curso inexistente", JSON.stringify({ courseId: "zzz", subject: "Asunto", body: "Mensaje válido" })],
  ["asunto corto", JSON.stringify({ courseId: "calc-201", subject: "a", body: "Mensaje válido" })],
];

export default function () {
  if (Math.random() < 0.2) {
    const [nombre, cuerpo] = pick(INVALIDAS);
    const res = http.post(`${BASE}/api/messages`, cuerpo, { ...JSON_HEADERS, tags: { tipo: "invalida" } });
    check(res, { [`rechaza ${nombre} con 400`]: (r) => r.status === 400 }, { tipo: "invalida" });
  } else if (Math.random() < 0.5) {
    const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`, { tags: { tipo: "valida" } });
    check(res, { "GET 200": (r) => r.status === 200 }, { tipo: "valida" });
  } else {
    const res = postMensaje(mensajeValido(80), { tipo: "valida" });
    check(res, { "POST 201": (r) => r.status === 201 }, { tipo: "valida" });
  }
  sleep(0.1);
}
