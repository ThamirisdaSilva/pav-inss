import { readJson, writeJson } from "../utils/dataStore.js";

export async function audit(req, action, resource, result) {
  const records = await readJson("auditoria.json");
  records.push({
    requestId: req.requestId,
    data: new Date().toISOString(),
    usuario: req.user?.usuario || req.body?.usuario || "nao_autenticado",
    perfil: req.user?.perfil || "nao_autenticado",
    acao: action,
    recurso: String(resource || "-"),
    resultado: result
  });
  await writeJson("auditoria.json", records);
}

export async function listAudit() {
  const records = await readJson("auditoria.json");
  return records.slice().reverse();
}
