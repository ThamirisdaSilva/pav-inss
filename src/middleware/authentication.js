import { findUserByToken } from "../services/authService.js";
import { audit } from "../services/auditService.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, res, next) {
  try {
    const authorization = req.get("Authorization") || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      await audit(req, "ACESSO_NEGADO", req.originalUrl, "SEM_TOKEN");
      throw new AppError(401, "AUTENTICACAO_NECESSARIA", "Informe um Bearer Token válido.");
    }

    const user = await findUserByToken(token);
    if (!user) {
      await audit(req, "ACESSO_NEGADO", req.originalUrl, "TOKEN_INVALIDO");
      throw new AppError(401, "TOKEN_INVALIDO", "O token informado é inválido.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
