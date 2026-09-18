import { config, bugEnabled } from "../config.js";
import { getBiometricStatus } from "./demoService.js";
import { readJson, writeJson } from "../utils/dataStore.js";
import { AppError } from "../utils/AppError.js";
import { maskBenefit, maskNuit } from "../utils/masks.js";


// ======================================================
// VALIDAÇÃO DOS DADOS
// ======================================================

function validateInput(nuit, numeroBeneficio) {

  if (!nuit || !numeroBeneficio) {
    throw new AppError(
      400,
      "DADOS_OBRIGATORIOS",
      "NUIT e número do benefício são obrigatórios."
    );
  }

  if (!/^\d{9}$/.test(String(nuit))) {
    throw new AppError(
      422,
      "NUIT_INVALIDO",
      "O NUIT deve conter exatamente 9 números."
    );
  }

  if (!/^\d+$/.test(String(numeroBeneficio))) {
    throw new AppError(
      422,
      "BENEFICIO_INVALIDO",
      "O número do benefício deve conter somente números."
    );
  }
}


// ======================================================
// FORMATAÇÃO DA RESPOSTA
// ======================================================

function publicProof(proof) {

  return {
    id: proof.id,
    protocolo: proof.protocolo,
    nuit: maskNuit(proof.nuit),
    numeroBeneficio: maskBenefit(proof.numeroBeneficio),
    proprietario: proof.proprietario,
    status: proof.status,
    dataCriacao: proof.dataCriacao,
    dataConclusao: proof.dataConclusao
  };

}


// ======================================================
// CRIAR PROVA DE VIDA
// ======================================================

export async function createProof(user, input) {

  validateInput(
    input.nuit,
    input.numeroBeneficio
  );


  // O cidadão só pode criar uma solicitação para o próprio NUIT
  if (
    user.perfil !== "cidadao" ||
    user.nuit !== input.nuit
  ) {

    throw new AppError(
      403,
      "ACESSO_NEGADO",
      "O cidadão só pode criar a própria prova de vida."
    );

  }


  const proofs =
    await readJson("provasVida.json");


  // Verifica se já existe uma solicitação pendente
  const duplicate = proofs.find(
    (item) =>
      item.nuit === input.nuit &&
      item.numeroBeneficio === String(input.numeroBeneficio) &&
      item.status === "AGUARDANDO_VALIDACAO"
  );


  if (duplicate) {

    throw new AppError(
      409,
      "PROVA_VIDA_PENDENTE",
      "Já existe uma prova de vida aguardando validação para este benefício."
    );

  }


  const id =
    Math.max(
      1000,
      ...proofs.map((item) => item.id)
    ) + 1;


  const year =
    new Date().getFullYear();


  const proof = {

    id,

    protocolo:
      `PV-${year}-${String(id).padStart(6, "0")}`,

    nuit: input.nuit,

    numeroBeneficio:
      String(input.numeroBeneficio),

    proprietario:
      user.usuario,

    status:
      "AGUARDANDO_VALIDACAO",

    dataCriacao:
      new Date().toISOString(),

    dataConclusao:
      null

  };


  proofs.push(proof);


  await writeJson(
    "provasVida.json",
    proofs
  );


  return publicProof(proof);

}


// ======================================================
// LOCALIZAR PROVA DE VIDA
// ======================================================

export async function findProof(id) {

  const proofs =
    await readJson("provasVida.json");


  const proof = proofs.find(
    (item) =>
      item.id === Number(id)
  );


  if (!proof) {

    if (bugEnabled("notFoundAsServerError")) {

      throw new Error(
        "BUG_3 didático: recurso inexistente convertido em erro interno"
      );

    }


    throw new AppError(
      404,
      "PROVA_VIDA_NAO_ENCONTRADA",
      "A prova de vida informada não foi encontrada."
    );

  }


  return proof;

}


// ======================================================
// AUTORIZAÇÃO PARA CONSULTA
// ======================================================

export function ensureCanRead(user, proof) {

  if (
    ["servidor", "auditor"]
      .includes(user.perfil)
  ) {
    return;
  }


  if (
    user.perfil === "cidadao" &&
    proof.proprietario === user.usuario
  ) {
    return;
  }


  throw new AppError(
    403,
    "ACESSO_NEGADO",
    "Você não possui permissão para consultar esta prova de vida."
  );

}


// ======================================================
// CONSULTAR PROVA DE VIDA
// ======================================================

export async function getProof(user, id) {

  const proof =
    await findProof(id);


  ensureCanRead(
    user,
    proof
  );


  return publicProof(proof);

}


// ======================================================
// FUNÇÃO AUXILIAR PARA SIMULAR DEMORA
// ======================================================

function wait(milliseconds) {

  return new Promise(
    (resolve) =>
      setTimeout(resolve, milliseconds)
  );

}


// ======================================================
// VALIDAR PROVA DE VIDA
// ======================================================

export async function validateProof(
  user,
  id,
  biometriaValida
) {

  if (
    typeof biometriaValida !== "boolean"
  ) {

    throw new AppError(
      400,
      "VALIDACAO_INVALIDA",
      "Informe biometriaValida como true ou false."
    );

  }


  const proofs =
    await readJson("provasVida.json");


  const index =
    proofs.findIndex(
      (item) =>
        item.id === Number(id)
    );


  if (index < 0) {

    throw new AppError(
      404,
      "PROVA_VIDA_NAO_ENCONTRADA",
      "A prova de vida informada não foi encontrada."
    );

  }


  const proof =
    proofs[index];


  if (
    user.perfil !== "cidadao" ||
    proof.proprietario !== user.usuario
  ) {

    throw new AppError(
      403,
      "ACESSO_NEGADO",
      "O cidadão só pode validar a própria prova de vida."
    );

  }


  if (
    proof.status !== "AGUARDANDO_VALIDACAO"
  ) {

    throw new AppError(
      409,
      "ESTADO_INCOMPATIVEL",
      "Esta prova de vida já foi concluída e não pode ser validada novamente."
    );

  }


  const serviceStatus =
    getBiometricStatus();


  if (
    serviceStatus === "indisponivel"
  ) {

    throw new AppError(
      503,
      "SERVICO_BIOMETRICO_INDISPONIVEL",
      "Não foi possível realizar a validação neste momento."
    );

  }


  if (
    serviceStatus === "lento"
  ) {

    await wait(
      config.slowServiceDelayMs
    );

  }


  // BUG_1 é intencional.
  // Só funciona quando TEACHING_BUGS=true.
  const approved =
    bugEnabled("invalidBiometryApproved")
      ? true
      : biometriaValida;


  proof.status =
    approved
      ? "VALIDADA"
      : "REPROVADA";


  proof.dataConclusao =
    new Date().toISOString();


  proofs[index] = proof;


  await writeJson(
    "provasVida.json",
    proofs
  );


  return publicProof(proof);

}


// ======================================================
// RECIBO
// ======================================================

export async function getReceipt(
  user,
  id
) {

  const proof =
    await findProof(id);


  ensureCanRead(
    user,
    proof
  );


  if (
    !["VALIDADA", "REPROVADA"]
      .includes(proof.status)
  ) {

    throw new AppError(
      409,
      "RECIBO_NAO_DISPONIVEL",
      "O recibo só fica disponível depois da conclusão da prova de vida."
    );

  }


  return {

    protocolo:
      proof.protocolo,

    nuit:
      maskNuit(proof.nuit),

    numeroBeneficio:
      maskBenefit(proof.numeroBeneficio),

    data:
      proof.dataConclusao,

    status:
      proof.status

  };

}