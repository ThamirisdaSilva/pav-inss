import "dotenv/config";

function booleanValue(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return String(value).toLowerCase() === "true";
}

export const config = {
  port: Number(process.env.PORT || 3000),
  demoMode: booleanValue(process.env.DEMO_MODE, true),
  teachingBugs: booleanValue(process.env.TEACHING_BUGS, false),
  bugs: {
    invalidBiometryApproved: booleanValue(process.env.BUG_1, false),
    ignoreAuthorization: booleanValue(process.env.BUG_2, false),
    notFoundAsServerError: booleanValue(process.env.BUG_3, false)
  },
  frontendTimeoutMs: 3000,
  slowServiceDelayMs: 5000
};

export function bugEnabled(name) {
  return config.teachingBugs && config.bugs[name];
}
