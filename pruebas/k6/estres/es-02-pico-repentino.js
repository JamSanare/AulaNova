// ES-02 Pico repentino: de carga baja a alta en segundos y vuelta a baja (recuperación).
import http from "k6/http";
import { check, sleep } from "k6";
import { BASE, TARGET_VUS, pick } from "../lib.js";

const PICO = TARGET_VUS * Number(__ENV.MULT || 10);
export const options = {
  stages: [
    { duration: "20s", target: 5 },
    { duration: "5s", target: PICO },
    { duration: "40s", target: PICO },
    { duration: "5s", target: 5 },
    { duration: "30s", target: 5 },
  ],
  thresholds: { http_req_failed: ["rate<0.05"], http_req_duration: ["p(95)<1500"] },
};

export default function () {
  const res = http.get(`${BASE}${pick(["/", "/api/student", "/api/courses", "/api/messages"])}`);
  check(res, { "HTTP 200": (r) => r.status === 200 });
  sleep(0.1);
}
