import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = ["usuarios.json", "provasVida.json", "auditoria.json"];

export async function resetData() {
  for (const file of files) {
    await fs.copyFile(path.join(rootDir, "data", "seed", file), path.join(rootDir, "data", file));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await resetData();
  console.log("Dados de demonstração restaurados com sucesso.");
  console.log("Se o servidor estiver aberto, reinicie-o para restaurar também o estado da simulação biométrica.");
}
