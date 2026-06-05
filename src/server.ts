import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { startCronJobs } from "./jobs";
import { disconnectPrisma } from "./config/prisma";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Blog Server API is running");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start cron jobs after server initializes
  startCronJobs();
});

// Graceful shutdown handling
const shutdown = async () => {
  console.log("\n[SERVER] Shutting down gracefully...");
  server.close(async () => {
    console.log("[SERVER] HTTP server closed.");
    await disconnectPrisma();
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("[SERVER] Forcing shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
