import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import staffAuthRoutes from "./routes/staffAuth";
import ticketRoutes from "./routes/tickets";
import staffTicketRoutes from "./routes/staffTickets";
import { initSocket } from "./lib/socket";

const app = express();
const PORT = process.env.PORT || 4000;

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/staff-auth", staffAuthRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/staff/tickets", staffTicketRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "مسیر یافت نشد" });
});

const server = http.createServer(app);
initSocket(server, corsOrigins);

server.listen(PORT, () => {
  console.log(`🏥 Hospital Ticket API running on http://localhost:${PORT}`);
});
