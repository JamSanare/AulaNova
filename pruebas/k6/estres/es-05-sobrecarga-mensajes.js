// ES-05 Sobrecarga de consultas de mensajes con bandeja creciente.
// setup() precarga PRELOAD mensajes y un escritor sigue agregando; las lecturas aumentan por escalones.
// Se registra el tamaño de la bandeja (bytes de respuesta) y la latencia por escalón.
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE, TARGET_VUS, mensajeValido, postMensaje } from "../lib.js";

const PASO = Number(__ENV.STEP_DUR || 20);
const PRELOAD = Number(__ENV.PRELOAD || 500);
const tamanoBandeja = new Trend("tamano_respuesta_bytes");

export const options = {
  scenarios: {
    lecturas: {
      executor: "ramping-vus", exec: "leer",
      stages: [1, 3, 6, 10].map((m) => ({ duration: `${PASO}s`, target: TARGET_VUS * m })).concat([{ duration: "10s", target: 0 }]),
    },
    crecimiento: { executor: "constant-arrival-rate", rate: 20, timeUnit: "1s", duration: `${PASO * 4}s`, preAllocatedVUs: 5, exec: "escribir" },
  },
  thresholds: { "http_req_duration{tipo:lectura}": ["p(95)<1000"], "http_req_failed{tipo:lectura}": ["rate<0.05"] },
};

export function setup() {
  for (let i = 0; i < PRELOAD; i++) postMensaje(mensajeValido(300));
}
export function leer() {
  const res = http.get(`${BASE}/api/messages`, { tags: { tipo: "lectura" } });
  tamanoBandeja.add(res.body ? res.body.length : 0);
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.1);
}
export function escribir() {
  check(postMensaje(mensajeValido(300), { tipo: "escritura" }), { "POST 201": (r) => r.status === 201 });
}
