export function maskNuit(nuit = "") {
  const digits = String(nuit).replace(/\D/g, "");

  if (digits.length !== 9) {
    return "*********";
  }

  return `******${digits.slice(-3)}`;
}


export function maskBenefit(number = "") {
  const digits = String(number).replace(/\D/g, "");

  return `${"*".repeat(
    Math.max(6, digits.length - 3)
  )}${digits.slice(-3)}`;
}


export function maskToken(token = "") {
  if (!token) {
    return "Sem token";
  }

  const end = token.slice(-5);

  return `${token.slice(0, 6)}********${end}`;
}