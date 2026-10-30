// RD-08 Variación del tamaño del cuerpo: mensajes pequeños y cercanos al límite funcional (1000 caracteres).
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { TARGET_VUS, DUR, mensajeValido, postMensaje } from "../lib.js";

const TAMANOS = [5, 50, 200, 500, 900, 1000];
const latPorTamano = Object.fromEntries(TAMANOS.map((t) => [t, new Trend(`latencia_cuerpo_${t}`, true)]));

export const options = {
  stages: [{ duration: "10s", target: TARGET_VUS }, { duration: DUR, target: TARGET_VUS }, { duration: "5s", target: 0 }],
  thresholds: {
    http_req_failed: ["rate<0.01"], http_req_duration: ["p(95)<500"], checks: ["rate>0.99"],
    ...Object.fromEntries(TAMANOS.map((t) => [`latencia_cuerpo_${t}`, ["p(95)<500"]])),
  },
};

export default function () {
  const t = TAMANOS[(__ITER + __VU) % TAMANOS.length];
  const res = postMensaje(mensajeValido(t));
  latPorTamano[t].add(res.timings.duration);
  check(res, { "HTTP 201": (r) => r.status === 201 });
  sleep(0.3);
}
