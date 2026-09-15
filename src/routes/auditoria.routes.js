import { Router } from "express";
import { list } from "../controllers/auditoriaController.js";
import { authenticate } from "../middleware/authentication.js";
import { authorize } from "../middleware/authorization.js";

export const auditoriaRouter = Router();
auditoriaRouter.get("/", authenticate, authorize("auditor"), list);
