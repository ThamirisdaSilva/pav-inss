import * as service from "../services/provaVidaService.js";
import { audit } from "../services/auditService.js";

async function auditFailure(req, action, resource, error) {
  try {
    await audit(req, action, resource, `ERRO_${error.status || 500}`);
  } catch {
    // Uma falha ao gravar auditoria não substitui o erro original da operação.
  }
}

export async function create(req, res, next) {
  try {
    const proof = await service.createProof(req.user, req.body || {});
    await audit(req, "CRIAR_PROVA_VIDA", proof.id, "SUCESSO");
    res.status(201).json({ ...proof, requestId: req.requestId });
  } catch (error) {
    await auditFailure(req, "CRIAR_PROVA_VIDA", "nova", error);
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const proof = await service.getProof(req.user, req.params.id);
    await audit(req, "CONSULTAR_PROVA_VIDA", proof.id, "SUCESSO");
    res.status(200).json({ ...proof, requestId: req.requestId });
  } catch (error) {
    await auditFailure(req, "CONSULTAR_PROVA_VIDA", req.params.id, error);
    next(error);
  }
}

export async function validate(req, res, next) {
  try {
    const proof = await service.validateProof(req.user, req.params.id, req.body?.biometriaValida);
    await audit(req, "VALIDAR_PROVA_VIDA", proof.id, proof.status);
    res.status(200).json({ ...proof, requestId: req.requestId });
  } catch (error) {
    await auditFailure(req, "VALIDAR_PROVA_VIDA", req.params.id, error);
    next(error);
  }
}

export async function receipt(req, res, next) {
  try {
    const receiptData = await service.getReceipt(req.user, req.params.id);
    await audit(req, "CONSULTAR_RECIBO", req.params.id, "SUCESSO");
    res.status(200).json({ ...receiptData, requestId: req.requestId });
  } catch (error) {
    await auditFailure(req, "CONSULTAR_RECIBO", req.params.id, error);
    next(error);
  }
}
