import { loginUser } from "../services/authService.js";
import { audit } from "../services/auditService.js";
import { AppError } from "../utils/AppError.js";

export async function login(req, res, next) {
  try {
    const { usuario, senha } = req.body || {};
    if (!usuario || !senha) {
      throw new AppError(400, "CREDENCIAIS_OBRIGATORIAS", "Usuário e senha são obrigatórios.");
    }
    const result = await loginUser(usuario, senha);
    if (!result) {
      await audit(req, "LOGIN_FALHA", "autenticacao", "FALHA");
      throw new AppError(401, "CREDENCIAIS_INVALIDAS", "Usuário ou senha inválidos.");
    }
    req.user = result.usuario;
    await audit(req, "LOGIN_SUCESSO", "autenticacao", "SUCESSO");
    res.status(200).json({ ...result, requestId: req.requestId });
  } catch (error) {
    next(error);
  }
}
