import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface StaffAuthRequest extends Request {
  staffId?: string;
}

export function staffAuthMiddleware(
  req: StaffAuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "دسترسی غیرمجاز. لطفاً وارد شوید." });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      staffId?: string;
      role?: string;
    };
    if (!payload.staffId || payload.role !== "staff") {
      return res.status(401).json({ error: "توکن نامعتبر است." });
    }
    req.staffId = payload.staffId;
    next();
  } catch {
    return res.status(401).json({ error: "توکن نامعتبر یا منقضی شده است." });
  }
}
