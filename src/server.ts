import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { startCronJobs } from "./jobs";
import { disconnectPrisma, connectWithRetry, prisma } from "./config/prisma";
import authRoutes from "./modules/auth/auth.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import adminPostRoutes from "./modules/admin-posts/adminPost.routes";
import adminCategoryRoutes from "./modules/admin-categories/adminCategory.routes";
import adminTagRoutes from "./modules/admin-tags/adminTag.routes";
import { configureCloudinary } from "./services/cloudinary.service";

dotenv.config();

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  process.env.ADMIN_DASHBOARD_URL,
  process.env.CLIENT_WEB_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin ' + origin + ' not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("Blog Server API is running");
});

app.get("/api/health", async (_req, res) => {
  const mediaConnected = configureCloudinary();

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      message: "Blog Server API is running",
      db: {
        connected: true,
        name: "Neon PostgreSQL",
      },
      media: {
        connected: mediaConnected,
        name: "Cloudinary",
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      message: "Blog Server API is running",
      db: {
        connected: false,
        name: "Neon PostgreSQL",
      },
      media: {
        connected: mediaConnected,
        name: "Cloudinary",
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin/posts", adminPostRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/tags", adminTagRoutes);

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
