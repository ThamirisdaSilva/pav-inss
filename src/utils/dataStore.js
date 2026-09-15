import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function dataPath(fileName) {
  return path.join(rootDir, "data", fileName);
}

export async function readJson(fileName) {
  const content = await fs.readFile(dataPath(fileName), "utf8");
  return JSON.parse(content);
}

export async function writeJson(fileName, value) {
  const target = dataPath(fileName);
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temporary, target);
}
