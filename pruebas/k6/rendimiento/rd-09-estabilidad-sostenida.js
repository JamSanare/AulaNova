// RD-09 Estabilidad sostenida: carga moderada de lectura por 30 min (por defecto).
// Para una prueba corta de verificación: -e SOAK_DURATION=2m
// Compara la latencia del primer tercio contra el último para detectar degradación progresiva.
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE, pick } from "../lib.js";

const SOAK = __ENV.SOAK_DURATION || "30m";
const VUS = Number(__ENV.SOAK_VUS || 10);
const segundos = (d) => { const n = parseFloat(d); return d.endsWith("m") ? n * 60 : d.endsWith("h") ? n * 3600 : n; };
const TOTAL = segundos(SOAK);
const latInicio = new Trend("latencia_primer_tercio", true);
const latMedio = new Trend("latencia_segundo_tercio", true);
const latFinal = new Trend("latencia_ultimo_tercio", true);

export const options = {
  scenarios: { soak: { executor: "constant-vus", vus: VUS, duration: SOAK } },
  thresholds: {
    http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"], checks: ["rate>0.99"],
    latencia_ultimo_tercio: ["p(95)<500"],
  },
};

const t0 = Date.now();
export default function () {
  const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`);
  const fase = (Date.now() - t0) / 1000 / TOTAL;
  (fase < 1 / 3 ? latInicio : fase < 2 / 3 ? latMedio : latFinal).add(res.timings.duration);
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.5);
}
