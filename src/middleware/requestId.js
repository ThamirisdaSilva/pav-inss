import crypto from "node:crypto";

export function requestId(req, res, next) {
  req.requestId = `REQ-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
