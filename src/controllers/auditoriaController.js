import { listAudit } from "../services/auditService.js";

export async function list(req, res, next) {
  try {
    const records = await listAudit();
    res.status(200).json({ registros: records, total: records.length, requestId: req.requestId });
  } catch (error) { next(error); }
}
