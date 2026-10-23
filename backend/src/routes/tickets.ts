import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  createTicketSchema,
  replySchema,
  updateStatusSchema,
} from "../utils/validation";
import { generateTicketNumber } from "../utils/ticketNumber";
import { emitTicketEvent } from "../lib/socket";

const router = Router();

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = createTicketSchema.parse(req.body);

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
        staffName: data.staffName,
        staffDepartment: data.staffDepartment,
        staffPhone: data.staffPhone,
        staffEmail: data.staffEmail || null,
      },
    });

    emitTicketEvent("ticket:created", {
      ticketId: ticket.id,
      staffId: ticket.staffId,
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

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, urgency, search } = req.query;

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status && typeof status === "string" ? { status: status as never } : {}),
        ...(urgency && typeof urgency === "string" ? { urgency: urgency as never } : {}),
        ...(search && typeof search === "string"
          ? {
              OR: [
                { subject: { contains: search, mode: "insensitive" } },
                { ticketNumber: { contains: search, mode: "insensitive" } },
                { staffName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { replies: true } },
      },
      orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/stats", authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [total, open, inProgress, resolved, critical] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { urgency: "CRITICAL", status: { not: "CLOSED" } } }),
    ]);

    res.json({ total, open, inProgress, resolved, critical });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id as string },
      include: {
        replies: {
          include: {
            admin: { select: { id: true, name: true, email: true } },
          },
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

router.patch("/:id/status", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = updateStatusSchema.parse(req.body);

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id as string },
      data: { status },
    });

    emitTicketEvent("ticket:updated", {
      ticketId: ticket.id,
      staffId: ticket.staffId,
      payload: ticket,
    });

    res.json(ticket);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      return res.status(404).json({ error: "تیکت یافت نشد" });
    }
    if (err && typeof err === "object" && "issues" in err) {
      return res.status(400).json({ error: "اطلاعات نامعتبر", details: err });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.post("/:id/replies", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = replySchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id as string },
    });
    if (!ticket) {
      return res.status(404).json({ error: "تیکت یافت نشد" });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        message,
        ticketId: ticket.id,
        adminId: req.adminId!,
      },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    if (ticket.status === "OPEN") {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });

    emitTicketEvent("ticket:reply", {
      ticketId: ticket.id,
      staffId: ticket.staffId,
      payload: { reply, ticket: updatedTicket },
    });

    res.status(201).json(reply);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return res.status(400).json({ error: "اطلاعات نامعتبر", details: err });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id as string },
    });
    if (!ticket) {
      return res.status(404).json({ error: "تیکت یافت نشد" });
    }

    await prisma.ticket.delete({
      where: { id: req.params.id as string },
    });

    emitTicketEvent("ticket:deleted", {
      ticketId: ticket.id,
      staffId: ticket.staffId,
      payload: { ticketId: ticket.id },
    });

    res.json({ message: "تیکت با موفقیت حذف شد" });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      return res.status(404).json({ error: "تیکت یافت نشد" });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

export default router;
