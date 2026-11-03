import cron from "node-cron";
import { prisma } from "../config/prisma";

export const keepAliveJob = cron.schedule("*/14 * * * *", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[CRON] Database keep-alive ping successful.");
  } catch (error) {
    console.error("[CRON] Database keep-alive ping failed:", error);
  }
}, { scheduled: false } as any);
