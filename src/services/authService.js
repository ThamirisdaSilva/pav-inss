import { readJson } from "../utils/dataStore.js";

function publicUser(user) {
  return {
    usuario: user.usuario,
    nome: user.nome,
    perfil: user.perfil,
    cpf: user.cpf
  };
}

export async function loginUser(username, password) {
  const users = await readJson("usuarios.json");
  const user = users.find((item) => item.usuario === username && item.senha === password);
  if (!user) return null;
  return { token: user.token, usuario: publicUser(user) };
}

export async function findUserByToken(token) {
  const users = await readJson("usuarios.json");
  const user = users.find((item) => item.token === token);
  return user ? publicUser(user) : null;
}
