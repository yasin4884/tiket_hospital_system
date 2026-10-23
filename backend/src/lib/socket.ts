import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

export function initSocket(server: HttpServer, corsOrigins: string[]) {
  io = new Server(server, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.on("connection", (socket: Socket) => {
    socket.on("join:admin", (token: string) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { adminId?: string };
        if (payload.adminId) {
          socket.join("admin");
        }
      } catch {
        /* ignore invalid token */
      }
    });

    socket.on("join:staff", (token: string) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
          staffId?: string;
          role?: string;
        };
        if (payload.staffId && payload.role === "staff") {
          socket.join(`staff:${payload.staffId}`);
        }
      } catch {
        /* ignore */
      }
    });

    socket.on("join:ticket", (payload: { ticketId: string; token: string; role: "admin" | "staff" }) => {
      try {
        const decoded = jwt.verify(payload.token, process.env.JWT_SECRET!) as Record<string, string>;
        if (payload.role === "admin" && decoded.adminId) {
          socket.join(`ticket:${payload.ticketId}`);
        }
        if (payload.role === "staff" && decoded.staffId && decoded.role === "staff") {
          socket.join(`ticket:${payload.ticketId}`);
        }
      } catch {
        /* ignore */
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitTicketEvent(
  event: "ticket:created" | "ticket:updated" | "ticket:reply" | "ticket:deleted",
  data: { ticketId: string; staffId?: string | null; payload?: unknown }
) {
  if (!io) return;
  io.to("admin").emit(event, data.payload ?? data);
  if (data.staffId) {
    io.to(`staff:${data.staffId}`).emit(event, data.payload ?? data);
  }
  io.to(`ticket:${data.ticketId}`).emit(event, data.payload ?? data);
}
