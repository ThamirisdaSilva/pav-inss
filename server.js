import express from "express";
import swaggerUi from "swagger-ui-express";
import { pathToFileURL } from "node:url";
import { config } from "./src/config.js";
import { requestId } from "./src/middleware/requestId.js";
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";
import { healthRouter } from "./src/routes/health.routes.js";
import { authRouter } from "./src/routes/auth.routes.js";
import { provaVidaRouter } from "./src/routes/provaVida.routes.js";
import { auditoriaRouter } from "./src/routes/auditoria.routes.js";
import { demoRouter } from "./src/routes/demo.routes.js";
import { openapi } from "./docs/openapi.js";

export const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(requestId);

app.get("/api/config-publica", (req, res) => {
  res.json({ demoMode: config.demoMode, frontendTimeoutMs: config.frontendTimeoutMs, requestId: req.requestId });
});
app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/provas-vida", provaVidaRouter);
app.use("/api/auditoria", auditoriaRouter);
app.use("/api/demo", demoRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: "Prova de Vida Digital - Swagger",
  swaggerOptions: { persistAuthorization: true }
}));

app.use(express.static("public"));
app.use(notFound);
app.use(errorHandler);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(config.port, "127.0.0.1", () => {
    console.log("\nSistema Didático de Prova de Vida Digital iniciado.");
    console.log(`Frontend: http://localhost:${config.port}`);
    console.log(`Swagger:  http://localhost:${config.port}/api-docs`);
    console.log(`API:      http://localhost:${config.port}/api`);
    console.log(`DEMO_MODE=${config.demoMode}`);
    console.log(`TEACHING_BUGS=${config.teachingBugs}\n`);
  });
}
