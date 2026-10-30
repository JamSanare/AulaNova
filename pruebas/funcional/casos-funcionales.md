# Casos de prueba funcionales — Aula Nova

Ejecución automatizada: `npm run test:funcional` (archivo `pruebas/funcional/funcionales.test.js`, `node:test`, sin dependencias).
Cada caso se ejecuta contra una instancia nueva del servidor (puerto efímero), por lo que el orden importa para FT-09 a FT-14 (la bandeja parte vacía).

| ID | Módulo | Caso de prueba | Datos / acción | Resultado esperado |
|---|---|---|---|---|
| FT-01 | Interfaz | Página de inicio | `GET /` | 200, `text/html`, contiene "Aula Nova" |
| FT-02 | Interfaz | Cabeceras de seguridad | `GET /` | `X-Frame-Options: DENY`, `nosniff`, CSP `default-src 'self'`, `Referrer-Policy` |
| FT-03 | Interfaz | Hoja de estilos | `GET /styles.css` | 200, `text/css` |
| FT-04 | Interfaz | Script de la app | `GET /app.js` | 200, `text/javascript` |
| FT-05 | Interfaz | Recurso inexistente | `GET /no-existe.html` | 404 con JSON `error` |
| FT-06 | Perfil | Consulta de perfil | `GET /api/student` | 200, JSON con 7 campos; código `202310458` |
| FT-07 | Cursos | Consulta de cursos | `GET /api/courses` | 200, 4 cursos con todos sus campos |
| FT-08 | Cursos | Estructura de calificaciones | `GET /api/courses` | `t1,t2,t3,final`; `t3` nulo en `met-220` |
| FT-09 | Mensajes | Bandeja inicial | `GET /api/messages` | 200, `messages: []` |
| FT-10 | Mensajes | Envío válido | `POST /api/messages` con curso, asunto, mensaje válidos | 201, `message` con id `msg-…`, curso, docente, fecha ISO |
| FT-11 | Mensajes | Mensaje en la bandeja | `GET /api/messages` tras FT-10 | 1 mensaje con el asunto enviado |
| FT-12 | Mensajes | Orden de envío | 2.º POST y `GET` | Orden cronológico de envío |
| FT-13 | Mensajes | Iniciales del docente | POST a `calc-201` y `prog-105` | `ET` y `CM` |
| FT-14 | Mensajes | Recorte de espacios | Asunto y cuerpo con espacios laterales | Se guardan sin espacios |
| FT-15 | Validación | Curso inexistente | `courseId: "xyz"` | 400 |
| FT-16 | Validación | Asunto corto | Asunto de 2 caracteres | 400 |
| FT-17 | Validación | Asunto largo | Asunto de 101 caracteres | 400 |
| FT-18 | Validación | Mensaje corto | Mensaje de 4 caracteres | 400 |
| FT-19 | Validación | Mensaje largo | Mensaje de 1001 caracteres | 400 |
| FT-20 | Validación | Límites exactos | Asunto 3 / mensaje 5 y asunto 100 / mensaje 1000 | 201 en ambos |
| FT-21 | Validación | Tipos incorrectos | Asunto numérico, cuerpo arreglo, JSON `[]` y `null` | 400 |
| FT-22 | Validación | JSON inválido o vacío | `{` y cuerpo vacío | 400 y sin mensajes nuevos |
| FT-23 | Validación | Cuerpo > 16 KiB | 17 KiB | 413 |
| FT-24 | Seguridad básica | Traversal | `/..%2Fbackend%2Fserver.js` | 403 |
| FT-25 | Seguridad básica | Codificación inválida | `/%E0%A4%A` | 400 con JSON `error` |
| FT-26 | Rutas | Ruta de API desconocida | `GET /api/inexistente` | 404 "Ruta no encontrada." |
| FT-27 | Rutas | Métodos no soportados | `PUT/DELETE/PATCH /api/messages` | 404 |

**Resultado de la última ejecución:** 27 casos, 27 aprobados, 0 fallidos (ver `resultados/funcionales.txt`).
