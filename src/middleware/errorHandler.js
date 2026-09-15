import { AppError } from "../utils/AppError.js";

export function notFound(req, res, next) {
  next(new AppError(404, "ROTA_NAO_ENCONTRADA", "A rota informada não foi encontrada."));
}

export function errorHandler(error, req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      erro: "JSON_INVALIDO",
      mensagem: "O corpo da requisição contém um JSON inválido.",
      requestId: req.requestId
    });
  }

  const status = error.status || 500;
  const code = error.code || "ERRO_INTERNO";
  const message = error instanceof AppError
    ? error.message
    : "Ocorreu um erro interno. Utilize o requestId para solicitar apoio.";

  if (status >= 500) {
    console.error(`[${req.requestId}]`, error.message);
  }

  res.status(status).json({ erro: code, mensagem: message, requestId: req.requestId });
}
