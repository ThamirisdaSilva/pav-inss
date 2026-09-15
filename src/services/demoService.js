let biometricStatus = "normal";

export function getBiometricStatus() {
  return biometricStatus;
}

export function setBiometricStatus(status) {
  biometricStatus = status;
  return biometricStatus;
}

export function resetBiometricStatus() {
  biometricStatus = "normal";
}
