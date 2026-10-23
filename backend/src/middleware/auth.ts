import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  adminId?: string;
}

export function authMiddleware(
  req: AuthRequest,
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
      adminId: string;
    };
    req.adminId = payload.adminId;
    next();
  } catch {
    return res.status(401).json({ error: "توکن نامعتبر یا منقضی شده است." });
  }
}
