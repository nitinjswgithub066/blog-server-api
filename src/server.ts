import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { startCronJobs } from "./jobs";
import { disconnectPrisma, connectWithRetry, prisma } from "./config/prisma";
import authRoutes from "./modules/auth/auth.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("Blog Server API is running");
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, server: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ success: false, server: "ok", database: "disconnected" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

let server: any;

const shutdown = async () => {
  console.log("\n[SERVER] Shutting down gracefully...");
  if (server) {
    server.close(async () => {
      console.log("[SERVER] HTTP server closed.");
      await disconnectPrisma();
      process.exit(0);
    });
  } else {
    await disconnectPrisma();
    process.exit(0);
  }

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("[SERVER] Forcing shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const startServer = async () => {
  await connectWithRetry();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCronJobs();
  });
};

startServer();
