// Pruebas funcionales (27 casos) - se ejecutan con: npm run test:funcional
const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../../backend/server");

const JSON_HEADERS = { "Content-Type": "application/json" };

test("Pruebas funcionales - Aula Nova", async (suite) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  suite.after(() => new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))));

  const post = (payload, raw) =>
    fetch(`${base}/api/messages`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: raw !== undefined ? raw : JSON.stringify(payload),
    });
  const valid = (extra = {}) => ({ courseId: "calc-201", subject: "Consulta de práctica", body: "¿Podría explicar el ejercicio tres?", ...extra });

  // ---------- Interfaz estática ----------
  await suite.test("FT-01 La página de inicio responde 200 con HTML y título", async () => {
    const r = await fetch(base);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/html/);
    assert.match(await r.text(), /Aula Nova/);
  });
  await suite.test("FT-02 La página incluye cabeceras de seguridad", async () => {
    const r = await fetch(base);
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
    assert.ok(r.headers.get("referrer-policy"));
  });
  await suite.test("FT-03 Se entrega styles.css con tipo text/css", async () => {
    const r = await fetch(`${base}/styles.css`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/css/);
  });
  await suite.test("FT-04 Se entrega app.js con tipo text/javascript", async () => {
    const r = await fetch(`${base}/app.js`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/javascript/);
  });
  await suite.test("FT-05 Un recurso inexistente responde 404", async () => {
    const r = await fetch(`${base}/no-existe.html`);
    assert.equal(r.status, 404);
    assert.ok((await r.json()).error);
  });

  // ---------- Perfil y cursos ----------
  await suite.test("FT-06 GET /api/student devuelve el perfil completo", async () => {
    const r = await fetch(`${base}/api/student`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /application\/json/);
    const { student } = await r.json();
    for (const k of ["firstName", "lastName", "code", "email", "program", "faculty", "cycle"]) assert.ok(student[k], k);
    assert.equal(student.code, "202310458");
  });
  await suite.test("FT-07 GET /api/courses devuelve cuatro cursos con sus campos", async () => {
    const { courses } = await (await fetch(`${base}/api/courses`)).json();
    assert.equal(courses.length, 4);
    for (const c of courses) for (const k of ["id", "code", "name", "teacher", "schedule", "room", "credits", "average", "grades"]) assert.ok(k in c, `${c.id}.${k}`);
  });
  await suite.test("FT-08 Las calificaciones tienen t1, t2, t3 y final (t3 nulo en met-220)", async () => {
    const { courses } = await (await fetch(`${base}/api/courses`)).json();
    for (const c of courses) assert.deepEqual(Object.keys(c.grades), ["t1", "t2", "t3", "final"]);
    assert.equal(courses.find((c) => c.id === "met-220").grades.t3, null);
  });

  // ---------- Mensajes: lectura y envío ----------
  await suite.test("FT-09 La bandeja de mensajes inicia vacía", async () => {
    const r = await fetch(`${base}/api/messages`);
    assert.equal(r.status, 200);
    assert.deepEqual((await r.json()).messages, []);
  });
  await suite.test("FT-10 POST válido responde 201 con el mensaje creado", async () => {
    const r = await post(valid());
    assert.equal(r.status, 201);
    const { message } = await r.json();
    assert.match(message.id, /^msg-/);
    assert.equal(message.courseId, "calc-201");
    assert.equal(message.courseName, "Cálculo diferencial");
    assert.equal(message.teacher, "Dra. Elena Torres");
    assert.ok(!Number.isNaN(Date.parse(message.createdAt)));
  });
  await suite.test("FT-11 El mensaje enviado aparece en la bandeja", async () => {
    const { messages } = await (await fetch(`${base}/api/messages`)).json();
    assert.equal(messages.length, 1);
    assert.equal(messages[0].subject, "Consulta de práctica");
  });
  await suite.test("FT-12 Los mensajes se conservan en orden de envío", async () => {
    await post(valid({ subject: "Segundo mensaje", courseId: "bd-210" }));
    const { messages } = await (await fetch(`${base}/api/messages`)).json();
    assert.deepEqual(messages.map((m) => m.subject), ["Consulta de práctica", "Segundo mensaje"]);
  });
  await suite.test("FT-13 Las iniciales del docente se calculan correctamente", async () => {
    const a = await (await post(valid({ courseId: "calc-201" }))).json();
    const b = await (await post(valid({ courseId: "prog-105" }))).json();
    assert.equal(a.message.teacherInitials, "ET");
    assert.equal(b.message.teacherInitials, "CM");
  });
  await suite.test("FT-14 Asunto y mensaje se recortan (trim)", async () => {
    const { message } = await (await post(valid({ subject: "   Hola profe   ", body: "   Mensaje con espacios   " }))).json();
    assert.equal(message.subject, "Hola profe");
    assert.equal(message.body, "Mensaje con espacios");
  });

  // ---------- Validaciones ----------
  await suite.test("FT-15 Curso inexistente responde 400", async () => {
    assert.equal((await post(valid({ courseId: "xyz" }))).status, 400);
  });
  await suite.test("FT-16 Asunto de 2 caracteres responde 400", async () => {
    assert.equal((await post(valid({ subject: "Ok" }))).status, 400);
  });
  await suite.test("FT-17 Asunto de 101 caracteres responde 400", async () => {
    assert.equal((await post(valid({ subject: "a".repeat(101) }))).status, 400);
  });
  await suite.test("FT-18 Mensaje de 4 caracteres responde 400", async () => {
    assert.equal((await post(valid({ body: "abcd" }))).status, 400);
  });
  await suite.test("FT-19 Mensaje de 1001 caracteres responde 400", async () => {
    assert.equal((await post(valid({ body: "a".repeat(1001) }))).status, 400);
  });
  await suite.test("FT-20 Límites exactos válidos (asunto 3/100, mensaje 5/1000) responden 201", async () => {
    for (const [s, b] of [[3, 5], [100, 1000]]) {
      const r = await post(valid({ subject: "s".repeat(s), body: "b".repeat(b) }));
      assert.equal(r.status, 201, `asunto ${s} / mensaje ${b}`);
    }
  });
  await suite.test("FT-21 Campos con tipo incorrecto o cuerpo no-objeto responden 400", async () => {
    assert.equal((await post(valid({ subject: 12345 }))).status, 400);
    assert.equal((await post(valid({ body: ["texto"] }))).status, 400);
    assert.equal((await post(null, "[]")).status, 400);
    assert.equal((await post(null, "null")).status, 400);
  });
  await suite.test("FT-22 JSON inválido o vacío responde 400 y no inserta mensajes", async () => {
    const antes = (await (await fetch(`${base}/api/messages`)).json()).messages.length;
    assert.equal((await post(null, "{")).status, 400);
    assert.equal((await post(null, "")).status, 400);
    const despues = (await (await fetch(`${base}/api/messages`)).json()).messages.length;
    assert.equal(despues, antes);
  });
  await suite.test("FT-23 Un cuerpo mayor a 16 KiB responde 413", async () => {
    assert.equal((await post({ body: "x".repeat(17 * 1024) })).status, 413);
  });

  // ---------- Rutas y seguridad básica ----------
  await suite.test("FT-24 Traversal de directorios responde 403", async () => {
    assert.equal((await fetch(`${base}/..%2Fbackend%2Fserver.js`)).status, 403);
  });
  await suite.test("FT-25 Percent-encoding inválido responde 400 controlado", async () => {
    const r = await fetch(`${base}/%E0%A4%A`);
    assert.equal(r.status, 400);
    assert.ok((await r.json()).error);
  });
  await suite.test("FT-26 Una ruta de API desconocida responde 404", async () => {
    const r = await fetch(`${base}/api/inexistente`);
    assert.equal(r.status, 404);
    assert.equal((await r.json()).error, "Ruta no encontrada.");
  });
  await suite.test("FT-27 Métodos no soportados (PUT/DELETE) responden 404", async () => {
    for (const method of ["PUT", "DELETE", "PATCH"]) {
      assert.equal((await fetch(`${base}/api/messages`, { method })).status, 404, method);
    }
  });
});
