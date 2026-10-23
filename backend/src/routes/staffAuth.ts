import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { staffRegisterSchema, loginSchema } from "../utils/validation";
import { staffAuthMiddleware, StaffAuthRequest } from "../middleware/staffAuth";

const router = Router();

const staffSelect = {
  id: true,
  name: true,
  email: true,
  department: true,
  phone: true,
  createdAt: true,
};

function signStaffToken(staffId: string) {
  return jwt.sign({ staffId, role: "staff" }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = staffRegisterSchema.parse(req.body);

    const existing = await prisma.staff.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است." });
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        department: data.department,
        phone: data.phone,
      },
      select: staffSelect,
    });

    const token = signStaffToken(staff.id);
    res.status(201).json({ staff, token });
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

    const staff = await prisma.staff.findUnique({ where: { email: data.email } });
    if (!staff) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }

    const valid = await bcrypt.compare(data.password, staff.password);
    if (!valid) {
      return res.status(401).json({ error: "ایمیل یا رمز عبور اشتباه است." });
    }

    const token = signStaffToken(staff.id);
    res.json({
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        phone: staff.phone,
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

router.get("/me", staffAuthMiddleware, async (req: StaffAuthRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.staffId! },
      select: staffSelect,
    });
    if (!staff) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

export default router;
