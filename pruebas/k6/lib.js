// Utilidades compartidas por todos los scripts k6.
import http from "k6/http";
import { check } from "k6";

export const BASE = __ENV.BASE_URL || "http://localhost:3000";
// Concurrencia prevista para uso normal (ajustable): k6 run -e TARGET_VUS=50 ...
export const TARGET_VUS = Number(__ENV.TARGET_VUS || 20);
// Duración base de cada fase (ajustable): -e DUR=30s
export const DUR = __ENV.DUR || "30s";
export const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };
export const CURSOS = ["calc-201", "prog-105", "met-220", "bd-210"];

export function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

export function mensajeValido(longitudCuerpo = 40) {
  return {
    courseId: pick(CURSOS),
    subject: `Consulta k6 ${typeof __VU === "undefined" ? 0 : __VU}-${typeof __ITER === "undefined" ? 0 : __ITER}`, // __VU/__ITER no existen en setup()
    body: "m".repeat(Math.max(5, Math.min(1000, longitudCuerpo))),
  };
}

export function postMensaje(payload, tags = {}) {
  return http.post(`${BASE}/api/messages`, JSON.stringify(payload), { ...JSON_HEADERS, tags });
}

export function jsonOk(res, validar) {
  try { return validar(res.json()); } catch (e) { return false; }
}

export const verificar200 = (res, nombre) => check(res, { [`${nombre} HTTP 200`]: (r) => r.status === 200 });
