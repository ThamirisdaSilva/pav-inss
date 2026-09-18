const form = document.querySelector("#solicitacaoForm");
const mensagem = document.querySelector("#mensagem");


form.addEventListener("submit", async function (event) {

    // Impede o formulário de recarregar a página
    event.preventDefault();


    // Pega os valores digitados no HTML
    const nuit = document.querySelector("#nuit").value.trim();
    const numeroBeneficio =
        document.querySelector("#numeroBeneficio").value.trim();


    // Recupera o token do usuário que fez login
    const token = sessionStorage.getItem("token");


    if (!token) {
        mensagem.textContent =
            "Faça login antes de cadastrar uma solicitação.";

        return;
    }


    // Dados que serão enviados para a API
    const dados = {
        nuit,
        numeroBeneficio
    };


    console.log("Enviando para a API:", dados);


    try {

        // Faz uma requisição POST para a API
        const response = await fetch("/api/provas-vida", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify(dados)

        });


        // Converte a resposta JSON para JavaScript
        const resultado = await response.json();


        console.log("Status:", response.status);
        console.log("Resposta:", resultado);


        // Verifica se a API respondeu com sucesso
        if (response.ok) {

            mensagem.textContent =
                `Solicitação cadastrada com sucesso. Protocolo: ${resultado.protocolo}`;

            form.reset();

        } else {

            mensagem.textContent =
                resultado.mensagem ||
                "Não foi possível cadastrar a solicitação.";

        }


    } catch (error) {

        console.error(error);

        mensagem.textContent =
            "Erro ao conectar com o sistema.";

    }

});

//1. Encontrar o formulário no HTML
//2. Perceber quando o usuário envia
//3. Ler NUIT e benefício
//4. Recuperar o token
//5. Fazer POST para a API com fetch()
//6. Mostrar a resposta no HTML