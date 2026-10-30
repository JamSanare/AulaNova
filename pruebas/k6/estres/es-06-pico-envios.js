// ES-06 Pico de envíos válidos: muchos POST en poco tiempo.
// Los mensajes se guardan en memoria: ejecutar con scripts/monitor.sh <PID> para ver el crecimiento de RSS.
import { check } from "k6";
import { TARGET_VUS, mensajeValido, postMensaje } from "../lib.js";

const TASA = Number(__ENV.PEAK_RATE || 500); // POST por segundo en el pico
export const options = {
  scenarios: {
    pico: {
      executor: "ramping-arrival-rate", startRate: 10, timeUnit: "1s",
      preAllocatedVUs: TARGET_VUS * 2, maxVUs: TARGET_VUS * 20,
      stages: [{ duration: "10s", target: 50 }, { duration: "5s", target: TASA }, { duration: "30s", target: TASA }, { duration: "5s", target: 10 }, { duration: "20s", target: 10 }],
    },
  },
  thresholds: { http_req_failed: ["rate<0.05"], http_req_duration: ["p(95)<1000"], checks: ["rate>0.95"] },
};

export default function () {
  check(postMensaje(mensajeValido(1000)), { "HTTP 201": (r) => r.status === 201 });
}
