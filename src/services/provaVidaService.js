import { config, bugEnabled } from "../config.js";
import { getBiometricStatus } from "./demoService.js";
import { readJson, writeJson } from "../utils/dataStore.js";
import { AppError } from "../utils/AppError.js";
import { maskBenefit, maskCpf } from "../utils/masks.js";

function validateInput(cpf, numeroBeneficio) {
  if (!cpf || !numeroBeneficio) {
    throw new AppError(400, "DADOS_OBRIGATORIOS", "CPF e número do benefício são obrigatórios.");
  }
  if (!/^\d{11}$/.test(String(cpf))) {
    throw new AppError(422, "CPF_INVALIDO", "O CPF deve conter exatamente 11 números.");
  }
  if (!/^\d+$/.test(String(numeroBeneficio))) {
    throw new AppError(422, "BENEFICIO_INVALIDO", "O número do benefício deve conter somente números.");
  }
}

function publicProof(proof) {
  return {
    id: proof.id,
    protocolo: proof.protocolo,
    cpf: maskCpf(proof.cpf),
    numeroBeneficio: maskBenefit(proof.numeroBeneficio),
    status: proof.status,
    dataCriacao: proof.dataCriacao,
    dataConclusao: proof.dataConclusao || null
  };
}

export async function createProof(user, input) {
  validateInput(input.cpf, input.numeroBeneficio);

  if (user.perfil !== "cidadao" || user.cpf !== input.cpf) {
    throw new AppError(403, "ACESSO_NEGADO", "O cidadão só pode criar a própria prova de vida.");
  }

  const proofs = await readJson("provasVida.json");
  const duplicate = proofs.find((item) =>
    item.cpf === input.cpf &&
    item.numeroBeneficio === String(input.numeroBeneficio) &&
    item.status === "AGUARDANDO_VALIDACAO"
  );
  if (duplicate) {
    throw new AppError(409, "PROVA_VIDA_PENDENTE", "Já existe uma prova de vida aguardando validação para este benefício.");
  }

  const id = Math.max(1000, ...proofs.map((item) => item.id)) + 1;
  const year = new Date().getFullYear();
  const proof = {
    id,
    protocolo: `PV-${year}-${String(id).padStart(6, "0")}`,
    cpf: input.cpf,
    numeroBeneficio: String(input.numeroBeneficio),
    proprietario: user.usuario,
    status: "AGUARDANDO_VALIDACAO",
    dataCriacao: new Date().toISOString(),
    dataConclusao: null
  };
  proofs.push(proof);
  await writeJson("provasVida.json", proofs);
  return publicProof(proof);
}

export async function findProof(id) {
  const proofs = await readJson("provasVida.json");
  const proof = proofs.find((item) => item.id === Number(id));
  if (!proof) {
    if (bugEnabled("notFoundAsServerError")) {
      throw new Error("BUG_3 didático: recurso inexistente convertido em erro interno");
    }
    throw new AppError(404, "PROVA_VIDA_NAO_ENCONTRADA", "A prova de vida informada não foi encontrada.");
  }
  return proof;
}

export function ensureCanRead(user, proof) {
  if (["servidor", "auditor"].includes(user.perfil)) return;
  if (user.perfil === "cidadao" && proof.proprietario === user.usuario) return;
  throw new AppError(403, "ACESSO_NEGADO", "Você não possui permissão para consultar esta prova de vida.");
}

export async function getProof(user, id) {
  const proof = await findProof(id);
  ensureCanRead(user, proof);
  return publicProof(proof);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function validateProof(user, id, biometriaValida) {
  if (typeof biometriaValida !== "boolean") {
    throw new AppError(400, "VALIDACAO_INVALIDA", "Informe biometriaValida como true ou false.");
  }

  const proofs = await readJson("provasVida.json");
  const index = proofs.findIndex((item) => item.id === Number(id));
  if (index < 0) {
    throw new AppError(404, "PROVA_VIDA_NAO_ENCONTRADA", "A prova de vida informada não foi encontrada.");
  }

  const proof = proofs[index];
  if (user.perfil !== "cidadao" || proof.proprietario !== user.usuario) {
    throw new AppError(403, "ACESSO_NEGADO", "O cidadão só pode validar a própria prova de vida.");
  }
  if (proof.status !== "AGUARDANDO_VALIDACAO") {
    throw new AppError(409, "ESTADO_INCOMPATIVEL", "Esta prova de vida já foi concluída e não pode ser validada novamente.");
  }

  const serviceStatus = getBiometricStatus();
  if (serviceStatus === "indisponivel") {
    throw new AppError(503, "SERVICO_BIOMETRICO_INDISPONIVEL", "Não foi possível realizar a validação neste momento.");
  }
  if (serviceStatus === "lento") await wait(config.slowServiceDelayMs);

  // BUG_1 é intencional e só pode ser ativado junto com TEACHING_BUGS=true.
  const approved = bugEnabled("invalidBiometryApproved") ? true : biometriaValida;
  proof.status = approved ? "VALIDADA" : "REPROVADA";
  proof.dataConclusao = new Date().toISOString();
  proofs[index] = proof;
  await writeJson("provasVida.json", proofs);
  return publicProof(proof);
}

export async function getReceipt(user, id) {
  const proof = await findProof(id);
  ensureCanRead(user, proof);
  if (!['VALIDADA', 'REPROVADA'].includes(proof.status)) {
    throw new AppError(409, "RECIBO_NAO_DISPONIVEL", "O recibo só fica disponível depois da conclusão da prova de vida.");
  }
  return {
    protocolo: proof.protocolo,
    cpf: maskCpf(proof.cpf),
    numeroBeneficio: maskBenefit(proof.numeroBeneficio),
    data: proof.dataConclusao,
    status: proof.status
  };
}
