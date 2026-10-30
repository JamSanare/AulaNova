// RD-07 Lecturas mientras se escriben mensajes: GET + POST combinados.
// Las lecturas deben seguir respondiendo y los mensajes aceptados deben aparecer en la bandeja.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, DUR, mensajeValido, postMensaje, jsonOk } from "../lib.js";

const lectores = Math.max(1, Math.floor(TARGET_VUS * 0.7));
const escritores = Math.max(1, TARGET_VUS - lectores);
const rampa = (n) => [{ duration: "10s", target: n }, { duration: DUR, target: n }, { duration: "5s", target: 0 }];

export const options = {
  scenarios: {
    lectores: { executor: "ramping-vus", exec: "leer", stages: rampa(lectores) },
    escritores: { executor: "ramping-vus", exec: "escribir", stages: rampa(escritores) },
  },
  thresholds: {
    "http_req_failed": ["rate<0.01"],
    "http_req_duration{tipo:lectura}": ["p(95)<500"],
    "http_req_duration{tipo:escritura}": ["p(95)<500"],
    checks: ["rate>0.99"],
  },
};

export function leer() {
  const res = http.get(`${BASE}/api/messages`, { tags: { tipo: "lectura" } });
  check(res, { "lectura HTTP 200": (r) => r.status === 200 });
  sleep(0.2);
}

export function escribir() {
  const res = postMensaje(mensajeValido(80), { tipo: "escritura" });
  const ok = check(res, { "escritura HTTP 201": (r) => r.status === 201 });
  if (ok) {
    const id = res.json("message.id");
    const lista = http.get(`${BASE}/api/messages`, { tags: { tipo: "lectura" } });
    check(lista, { "mensaje aceptado aparece en la bandeja": (r) => jsonOk(r, (j) => j.messages.some((m) => m.id === id)) });
  }
  sleep(0.4);
}
