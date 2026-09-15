const state = {
  token: sessionStorage.getItem("token") || "",
  user: JSON.parse(sessionStorage.getItem("user") || "null"),
  currentProofId: null,
  demoMode: false,
  timeoutMs: 3000
};

const elements = {
  loginSection: document.querySelector("#loginSection"),
  appSection: document.querySelector("#appSection"),
  loginForm: document.querySelector("#loginForm"),
  proofForm: document.querySelector("#proofForm"),
  newProofSection: document.querySelector("#newProofSection"),
  validationSection: document.querySelector("#validationSection"),
  resultSection: document.querySelector("#resultSection"),
  receiptSection: document.querySelector("#receiptSection"),
  demoPanel: document.querySelector("#demoPanel"),
  message: document.querySelector("#message")
};

function logApi(method, url, request, status, response) {
  console.group("[API]");
  console.log(`${method} ${url}`);
  if (request) console.log("Request:", request);
  if (status) console.log("Status:", status);
  if (response) console.log("Response:", response);
  console.groupEnd();
}

function showMessage(text, type = "") {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`.trim();
}

function clearMessage() {
  elements.message.className = "message hidden";
}

function maskToken(token) {
  return token ? `${token.slice(0, 6)}********${token.slice(-5)}` : "Sem token";
}

async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.mensagem || "Não foi possível concluir a operação.");
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function loadPublicConfig() {
  const response = await fetch("/api/config-publica");
  const body = await response.json();
  state.demoMode = body.demoMode;
  state.timeoutMs = body.frontendTimeoutMs;
}

export async function login(usuario, senha) {
  const url = "/api/auth/login";
  const safeRequest = { usuario, senha: "******" };
  logApi("POST", url, safeRequest);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, senha })
  });
  const raw = await response.clone().json().catch(() => ({}));
  logApi("POST", url, safeRequest, response.status, { ...raw, token: raw.token ? maskToken(raw.token) : undefined });
  const body = await readResponse(response);

  state.token = body.token;
  state.user = body.usuario;
  sessionStorage.setItem("token", state.token);
  sessionStorage.setItem("user", JSON.stringify(state.user));
  renderSession();
}

export async function iniciarProvaVida(cpf, numeroBeneficio) {
  const url = "/api/provas-vida";
  const request = { cpf, numeroBeneficio };
  logApi("POST", url, request);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.token}` },
    body: JSON.stringify(request)
  });
  const raw = await response.clone().json().catch(() => ({}));
  logApi("POST", url, request, response.status, raw);
  const body = await readResponse(response);

  state.currentProofId = body.id;
  document.querySelector("#proofId").textContent = body.id;
  document.querySelector("#temporaryProtocol").textContent = body.protocolo;
  document.querySelector("#currentStatus").textContent = body.status;
  elements.validationSection.classList.remove("hidden");
  elements.resultSection.classList.add("hidden");
  showMessage(`Solicitação ${body.protocolo} criada. HTTP 201 Created.`, "success");
}

export async function realizarValidacao(biometriaValida) {
  const url = `/api/provas-vida/${state.currentProofId}/validacao`;
  const request = { biometriaValida };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), state.timeoutMs);
  logApi("POST", url, request);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.token}` },
      body: JSON.stringify(request),
      signal: controller.signal
    });
    const raw = await response.clone().json().catch(() => ({}));
    logApi("POST", url, request, response.status, raw);
    const body = await readResponse(response);
    document.querySelector("#currentStatus").textContent = body.status;
    renderProof(body);
    showMessage(`Validação concluída com status ${body.status}.`, body.status === "VALIDADA" ? "success" : "");
  } catch (error) {
    if (error.name === "AbortError") {
      logApi("POST", url, request, "TIMEOUT", { mensagem: "Chamada cancelada pelo frontend" });
      showMessage("A operação demorou mais que o esperado. Tente novamente.", "error");
      return;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function consultarProvaVida(id) {
  const url = `/api/provas-vida/${id}`;
  logApi("GET", url);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${state.token}` } });
  const raw = await response.clone().json().catch(() => ({}));
  logApi("GET", url, null, response.status, raw);
  const body = await readResponse(response);
  state.currentProofId = body.id;
  renderProof(body);
  showMessage(`Consulta concluída. HTTP ${response.status} OK.`, "success");
}

export async function consultarRecibo() {
  const url = `/api/provas-vida/${state.currentProofId}/recibo`;
  logApi("GET", url);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${state.token}` } });
  const raw = await response.clone().json().catch(() => ({}));
  logApi("GET", url, null, response.status, raw);
  const body = await readResponse(response);

  document.querySelector("#receiptDetails").innerHTML = detailsHtml({
    Protocolo: body.protocolo,
    CPF: body.cpf,
    Benefício: body.numeroBeneficio,
    Data: formatDate(body.data),
    Situação: body.status === "VALIDADA" ? "PROVA DE VIDA VALIDADA" : "PROVA DE VIDA REPROVADA"
  });
  elements.receiptSection.classList.remove("hidden");
  elements.receiptSection.scrollIntoView({ behavior: "smooth" });
}

async function changeDemoStatus(status) {
  const url = "/api/demo/servico-biometria";
  const request = { status };
  logApi("POST", url, request);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.token}` },
    body: JSON.stringify(request)
  });
  const raw = await response.clone().json().catch(() => ({}));
  logApi("POST", url, request, response.status, raw);
  const body = await readResponse(response);
  showMessage(`Serviço biométrico simulado como: ${body.status}.`, "success");
}

function detailsHtml(values) {
  return Object.entries(values).map(([label, value]) => `<div><dt>${label}</dt><dd>${value ?? "-"}</dd></div>`).join("");
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("pt-BR") : "-";
}

function renderProof(proof) {
  document.querySelector("#resultTitle").textContent = proof.status === "VALIDADA"
    ? "Prova de vida realizada com sucesso"
    : `Status: ${proof.status}`;
  document.querySelector("#resultDetails").innerHTML = detailsHtml({
    ID: proof.id,
    Protocolo: proof.protocolo,
    CPF: proof.cpf,
    Benefício: proof.numeroBeneficio,
    Status: proof.status,
    Data: formatDate(proof.dataConclusao || proof.dataCriacao)
  });
  document.querySelector("#receiptButton").classList.toggle("hidden", proof.status === "AGUARDANDO_VALIDACAO");
  elements.resultSection.classList.remove("hidden");
}

function renderSession() {
  const authenticated = Boolean(state.token && state.user);
  elements.loginSection.classList.toggle("hidden", authenticated);
  elements.appSection.classList.toggle("hidden", !authenticated);
  document.querySelector("#logoutButton").classList.toggle("hidden", !authenticated);
  if (!authenticated) return;

  document.querySelector("#userInfo").textContent = `${state.user.nome} — perfil ${state.user.perfil}`;
  document.querySelector("#demoUser").textContent = state.user.usuario;
  document.querySelector("#demoRole").textContent = state.user.perfil;
  document.querySelector("#demoToken").textContent = maskToken(state.token);
  elements.demoPanel.classList.toggle("hidden", !state.demoMode);
  document.querySelector("#startButton").classList.toggle("hidden", state.user.perfil !== "cidadao");
  if (state.user.cpf) document.querySelector("#cpf").value = state.user.cpf;
}

function handleError(error) {
  console.error(error);
  if (error.status === 503) {
    showMessage("Não foi possível concluir a validação agora. Tente novamente em alguns instantes.", "error");
    return;
  }
  showMessage(`${error.message}${error.status ? ` HTTP ${error.status}.` : ""}`, "error");
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); clearMessage();
  try { await login(event.target.usuario.value.trim(), event.target.senha.value); }
  catch (error) { handleError(error); }
});

document.querySelectorAll("[data-user]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#usuario").value = button.dataset.user;
    document.querySelector("#senha").value = "123456";
  });
});

document.querySelector("#startButton").addEventListener("click", () => {
  elements.newProofSection.classList.remove("hidden");
  elements.newProofSection.scrollIntoView({ behavior: "smooth" });
});

elements.proofForm.addEventListener("submit", async (event) => {
  event.preventDefault(); clearMessage();
  try { await iniciarProvaVida(event.target.cpf.value.trim(), event.target.numeroBeneficio.value.trim()); }
  catch (error) { handleError(error); }
});

document.querySelector("#validButton").addEventListener("click", () => realizarValidacao(true).catch(handleError));
document.querySelector("#invalidButton").addEventListener("click", () => realizarValidacao(false).catch(handleError));
document.querySelector("#consultButton").addEventListener("click", () => consultarProvaVida(document.querySelector("#consultId").value.trim()).catch(handleError));
document.querySelector("#receiptButton").addEventListener("click", () => consultarRecibo().catch(handleError));
document.querySelector("#printButton").addEventListener("click", () => window.print());
document.querySelector("#demoButton").addEventListener("click", () => changeDemoStatus(document.querySelector("#biometricService").value).catch(handleError));
document.querySelector("#logoutButton").addEventListener("click", () => {
  sessionStorage.clear();
  state.token = ""; state.user = null; state.currentProofId = null;
  location.reload();
});

await loadPublicConfig();
renderSession();
