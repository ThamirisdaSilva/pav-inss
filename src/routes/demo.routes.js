import { Router } from "express";
import { changeBiometricService, status } from "../controllers/demoController.js";
import { authenticate } from "../middleware/authentication.js";
import { authorize } from "../middleware/authorization.js";

export const demoRouter = Router();
demoRouter.get("/status", authenticate, status);
demoRouter.post("/servico-biometria", authenticate, authorize("servidor", "auditor"), changeBiometricService);
