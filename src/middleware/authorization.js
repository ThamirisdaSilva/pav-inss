import { bugEnabled } from "../config.js";
import { audit } from "../services/auditService.js";
import { AppError } from "../utils/AppError.js";

export function authorize(...profiles) {
  return async function authorizationMiddleware(req, res, next) {
    try {
      // BUG_2 é uma simulação educacional isolada e só funciona com TEACHING_BUGS=true.
      if (bugEnabled("ignoreAuthorization")) return next();

      if (!req.user || !profiles.includes(req.user.perfil)) {
        await audit(req, "ACESSO_NEGADO", req.originalUrl, "PERFIL_SEM_PERMISSAO");
        throw new AppError(403, "ACESSO_NEGADO", "Você não possui permissão para realizar esta operação.");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
