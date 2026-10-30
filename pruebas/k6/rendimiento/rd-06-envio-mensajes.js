// RD-06 Envío de mensajes válidos: POST /api/messages, HTTP 201.
import { check, sleep } from "k6";
import { TARGET_VUS, DUR, mensajeValido, postMensaje } from "../lib.js";

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: DUR, target: TARGET_VUS }, { duration: "5s", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"], checks: ["rate>0.99"] },
};

export default function () {
  const res = postMensaje(mensajeValido(60));
  check(res, { "HTTP 201": (r) => r.status === 201 });
  sleep(0.3);
}
