import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { registerSchema, loginSchema } from "../utils/validation";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.admin.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است." });
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const admin = await prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.status(201).json({ admin, token });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return res.status(400).json({ error: "اطلاعات نامعتبر", details: err });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({
      where: { email: data.email },
    });
    if (!admin) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }

    const valid = await bcrypt.compare(data.password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }

    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      token,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return res.status(400).json({ error: "اطلاعات نامعتبر", details: err });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "دسترسی غیرمجاز" });
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as {
      adminId: string;
    };
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!admin) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }
    res.json(admin);
  } catch {
    return res.status(401).json({ error: "توکن نامعتبر" });
  }
});

export default router;
