const botaoConsultar = document.querySelector("#consultarButton");

const botaoLimpar = document.querySelector("#limparButton");

const mensagem = document.querySelector("#mensagem");

botaoConsultar.addEventListener("click", async function () {
  // Pega o número digitado
  const id = document.querySelector("#idSolicitacao").value;

  // Pega o token salvo durante o login
  const token = sessionStorage.getItem("token");

  if (!id) {
    mensagem.textContent = "Informe o número da solicitação.";

    return;
  }

  if (!token) {
    mensagem.textContent = "Faça login antes de realizar a consulta.";

    return;
  }

  mensagem.textContent = "Consultando...";

  try {
    // Chama a API
    const response = await fetch(`/api/provas-vida/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Converte a resposta JSON para JavaScript
    const resultado = await response.json();

    console.log("Status HTTP:", response.status);
    console.log("Resposta:", resultado);

    if (response.ok) {
      // Coloca os dados recebidos dentro do HTML
      document.querySelector("#idResultado").textContent = resultado.id;

      document.querySelector("#protocolo").textContent = resultado.protocolo;

      document.querySelector("#nuit").textContent = resultado.nuit;

      document.querySelector("#beneficio").textContent =
        resultado.numeroBeneficio;

      document.querySelector("#status").textContent = resultado.status;

      atualizarStatus(resultado.status);

      mensagem.textContent = "Solicitação encontrada.";
    } else {
      mensagem.textContent =
        resultado.mensagem || "Não foi possível consultar a solicitação.";

      limparResultado();
    }
  } catch (error) {
    console.error(error);

    mensagem.textContent = "Erro ao conectar com o sistema.";

    limparResultado();
  }
});

// Limpa a tela
botaoLimpar.addEventListener("click", function () {
  document.querySelector("#idSolicitacao").value = "";

  mensagem.textContent = "";

  limparResultado();
});

// Limpa os dados apresentados
function limparResultado() {
  document.querySelector("#idResultado").textContent = "-";
  document.querySelector("#protocolo").textContent = "-";
  document.querySelector("#nuit").textContent = "-";
  document.querySelector("#beneficio").textContent = "-";
  document.querySelector("#status").textContent = "-";

  document.querySelector("#status").className = "status";
}

// Altera a aparência do status
function atualizarStatus(status) {
  const elemento = document.querySelector("#status");

  elemento.className = "status";

  if (status === "VALIDADA") {
    elemento.classList.add("status-validada");
  }

  if (status === "REPROVADA") {
    elemento.classList.add("status-reprovada");
  }

  if (status === "AGUARDANDO_VALIDACAO") {
    elemento.classList.add("status-aguardando");
  }
}
