import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../server.js";
import { resetData } from "../scripts/reset.js";

let server;
let baseUrl;

before(async () => {
  await resetData();
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await resetData();
  await new Promise((resolve) => server.close(resolve));
});

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { response, body: await response.json() };
}

test("saúde retorna 200 e requestId", async () => {
  const { response, body } = await request("/api/saude");
  assert.equal(response.status, 200);
  assert.equal(body.status, "UP");
  assert.match(body.requestId, /^REQ-[A-F0-9]{6}$/);
});

test("login retorna token didático", async () => {
  const { response, body } = await request("/api/auth/login", {
    method: "POST", body: { usuario: "cidadao.demo", senha: "123456" }
  });
  assert.equal(response.status, 200);
  assert.equal(body.token, "TOKEN_CIDADAO");
});

test("consulta sem token retorna 401", async () => {
  const { response } = await request("/api/provas-vida/1001");
  assert.equal(response.status, 401);
});

test("token inválido retorna 401", async () => {
  const { response } = await request("/api/provas-vida/1001", { token: "TOKEN_INEXISTENTE" });
  assert.equal(response.status, 401);
});

test("visitante autenticado retorna 403", async () => {
  const { response } = await request("/api/provas-vida/1001", { token: "TOKEN_VISITANTE" });
  assert.equal(response.status, 403);
});

test("cidadão consulta a própria prova e recebe dados mascarados", async () => {
  const { response, body } = await request("/api/provas-vida/1001", { token: "TOKEN_CIDADAO" });
  assert.equal(response.status, 200);
  assert.equal(body.cpf, "***.***.***-00");
  assert.equal(body.numeroBeneficio, "******321");
});

test("cidadão não consulta prova de outra pessoa", async () => {
  const { response } = await request("/api/provas-vida/1003", { token: "TOKEN_CIDADAO" });
  assert.equal(response.status, 403);
});

test("recurso inexistente retorna 404", async () => {
  const { response } = await request("/api/provas-vida/9999", { token: "TOKEN_SERVIDOR" });
  assert.equal(response.status, 404);
});

test("CPF com formato inválido retorna 422", async () => {
  const { response } = await request("/api/provas-vida", {
    method: "POST", token: "TOKEN_CIDADAO", body: { cpf: "123", numeroBeneficio: "555" }
  });
  assert.equal(response.status, 422);
});

test("validação válida conclui a prova e segunda tentativa retorna 409", async () => {
  const first = await request("/api/provas-vida/1002/validacao", {
    method: "POST", token: "TOKEN_CIDADAO", body: { biometriaValida: true }
  });
  assert.equal(first.response.status, 200);
  assert.equal(first.body.status, "VALIDADA");

  const second = await request("/api/provas-vida/1002/validacao", {
    method: "POST", token: "TOKEN_CIDADAO", body: { biometriaValida: true }
  });
  assert.equal(second.response.status, 409);
});

test("auditoria só fica disponível ao auditor", async () => {
  const denied = await request("/api/auditoria", { token: "TOKEN_SERVIDOR" });
  assert.equal(denied.response.status, 403);
  const allowed = await request("/api/auditoria", { token: "TOKEN_AUDITOR" });
  assert.equal(allowed.response.status, 200);
  assert.ok(allowed.body.total > 0);
});

test("fluxo completo cria, simula 503, reprova e emite recibo", async () => {
  const created = await request("/api/provas-vida", {
    method: "POST",
    token: "TOKEN_CIDADAO",
    body: { cpf: "12345678900", numeroBeneficio: "555555555" }
  });
  assert.equal(created.response.status, 201);
  const id = created.body.id;

  const pendingReceipt = await request(`/api/provas-vida/${id}/recibo`, { token: "TOKEN_CIDADAO" });
  assert.equal(pendingReceipt.response.status, 409);

  const unavailableMode = await request("/api/demo/servico-biometria", {
    method: "POST", token: "TOKEN_SERVIDOR", body: { status: "indisponivel" }
  });
  assert.equal(unavailableMode.response.status, 200);

  const unavailable = await request(`/api/provas-vida/${id}/validacao`, {
    method: "POST", token: "TOKEN_CIDADAO", body: { biometriaValida: true }
  });
  assert.equal(unavailable.response.status, 503);

  await request("/api/demo/servico-biometria", {
    method: "POST", token: "TOKEN_SERVIDOR", body: { status: "normal" }
  });
  const rejected = await request(`/api/provas-vida/${id}/validacao`, {
    method: "POST", token: "TOKEN_CIDADAO", body: { biometriaValida: false }
  });
  assert.equal(rejected.response.status, 200);
  assert.equal(rejected.body.status, "REPROVADA");

  const receipt = await request(`/api/provas-vida/${id}/recibo`, { token: "TOKEN_CIDADAO" });
  assert.equal(receipt.response.status, 200);
  assert.equal(receipt.body.numeroBeneficio, "******555");
});
