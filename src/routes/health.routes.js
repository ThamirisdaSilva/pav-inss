import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/saude", (req, res) => {
  res.status(200).json({ status: "UP", requestId: req.requestId });
});
