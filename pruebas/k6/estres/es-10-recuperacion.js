// ES-10 Recuperación tras el estrés: dos picos; después de cada uno se vuelve a carga baja
// y se exige que la latencia regrese a valores normales y que el proceso siga disponible.
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, pick } from "../lib.js";

const BAJA = 5, PICO = TARGET_VUS * Number(__ENV.MULT || 10);
const fase = (nombre, start, vus, dur) => ({ executor: "constant-vus", vus, duration: `${dur}s`, startTime: `${start}s`, tags: { fase: nombre } });

export const options = {
  scenarios: {
    base_inicial: fase("base", 0, BAJA, 20),
    pico_1: fase("pico", 20, PICO, 25),
    recuperacion_1: fase("recuperacion", 45, BAJA, 25),
    pico_2: fase("pico", 70, PICO, 25),
    recuperacion_2: fase("recuperacion", 95, BAJA, 25),
  },
  thresholds: {
    "http_req_duration{fase:base}": ["p(95)<500"],
    "http_req_duration{fase:recuperacion}": ["p(95)<500"], // debe volver a lo normal
    "http_req_failed{fase:recuperacion}": ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`);
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.1);
}
