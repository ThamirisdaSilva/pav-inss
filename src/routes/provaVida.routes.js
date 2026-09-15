import { Router } from "express";
import { create, getOne, receipt, validate } from "../controllers/provaVidaController.js";
import { authenticate } from "../middleware/authentication.js";
import { authorize } from "../middleware/authorization.js";

export const provaVidaRouter = Router();

provaVidaRouter.post("/", authenticate, authorize("cidadao"), create);
provaVidaRouter.get("/:id", authenticate, authorize("cidadao", "servidor", "auditor"), getOne);
provaVidaRouter.post("/:id/validacao", authenticate, authorize("cidadao"), validate);
provaVidaRouter.get("/:id/recibo", authenticate, authorize("cidadao", "servidor", "auditor"), receipt);
