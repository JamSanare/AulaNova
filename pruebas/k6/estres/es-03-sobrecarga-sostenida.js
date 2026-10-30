// ES-03 Sobrecarga sostenida: carga superior a la normal por un periodo controlado.
// Ejecutar junto a scripts/monitor.sh <PID> para registrar CPU y memoria.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, pick, postMensaje, mensajeValido } from "../lib.js";

const DURACION = __ENV.OVERLOAD_DURATION || "5m";
export const options = {
  stages: [{ duration: "20s", target: TARGET_VUS * 3 }, { duration: DURACION, target: TARGET_VUS * 3 }, { duration: "10s", target: 0 }],
  thresholds: { http_req_failed: ["rate<0.05"], http_req_duration: ["p(95)<1000"] },
};

export default function () {
  if (Math.random() < 0.1) {
    check(postMensaje(mensajeValido(100)), { "POST 201": (r) => r.status === 201 });
  } else {
    const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`);
    check(res, { "GET 200": (r) => r.status === 200 });
  }
  sleep(0.1);
}
