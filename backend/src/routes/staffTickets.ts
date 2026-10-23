import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { staffAuthMiddleware, StaffAuthRequest } from "../middleware/staffAuth";
import { staffCreateTicketSchema } from "../utils/validation";
import { generateTicketNumber } from "../utils/ticketNumber";
import { emitTicketEvent } from "../lib/socket";

const router = Router();

router.use(staffAuthMiddleware);

router.get("/", async (req: StaffAuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;

    const tickets = await prisma.ticket.findMany({
      where: {
        staffId: req.staffId!,
        ...(status && typeof status === "string" ? { status: status as never } : {}),
        ...(search && typeof search === "string"
          ? {
              OR: [
                { subject: { contains: search, mode: "insensitive" } },
                { ticketNumber: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { replies: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/track/:ticketNumber", async (req: StaffAuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketNumber: req.params.ticketNumber as string,
        staffId: req.staffId!,
      },
      include: {
        _count: { select: { replies: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "تیکت با این کد پیگیری یافت نشد" });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/:id", async (req: StaffAuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id as string, staffId: req.staffId! },
      include: {
        replies: {
          include: { admin: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "تیکت یافت نشد" });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.post("/", async (req: StaffAuthRequest, res: Response) => {
  try {
    const data = staffCreateTicketSchema.parse(req.body);

    const staff = await prisma.staff.findUnique({ where: { id: req.staffId! } });
    if (!staff) {
      return res.status(401).json({ error: "کاربر یافت نشد" });
    }

    let ticketNumber = generateTicketNumber();
    let exists = await prisma.ticket.findUnique({ where: { ticketNumber } });
    while (exists) {
      ticketNumber = generateTicketNumber();
      exists = await prisma.ticket.findUnique({ where: { ticketNumber } });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        urgency: data.urgency,
        category: data.category,
        staffName: staff.name,
        staffDepartment: staff.department,
        staffPhone: staff.phone,
        staffEmail: staff.email,
        staffId: staff.id,
      },
      include: { _count: { select: { replies: true } } },
    });

    emitTicketEvent("ticket:created", {
      ticketId: ticket.id,
      staffId: staff.id,
      payload: ticket,
    });

    res.status(201).json(ticket);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return res.status(400).json({ error: "اطلاعات نامعتبر", details: err });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

export default router;
