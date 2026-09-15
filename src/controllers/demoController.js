import { config } from "../config.js";
import { getBiometricStatus, setBiometricStatus } from "../services/demoService.js";
import { AppError } from "../utils/AppError.js";

const allowed = ["normal", "lento", "indisponivel"];

export function status(req, res) {
  res.status(200).json({ demoMode: config.demoMode, servicoBiometria: getBiometricStatus(), requestId: req.requestId });
}

export function changeBiometricService(req, res, next) {
  try {
    if (!config.demoMode) {
      throw new AppError(404, "MODO_DEMO_DESATIVADO", "O modo de demonstração está desativado.");
    }
    const statusValue = String(req.body?.status || "").toLowerCase();
    if (!allowed.includes(statusValue)) {
      throw new AppError(400, "STATUS_DEMO_INVALIDO", "Use normal, lento ou indisponivel.");
    }
    setBiometricStatus(statusValue);
    res.status(200).json({ mensagem: "Estado didático atualizado.", status: statusValue, requestId: req.requestId });
  } catch (error) { next(error); }
}
