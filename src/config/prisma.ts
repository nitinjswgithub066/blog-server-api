import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Export a single shared PrismaClient instance using the driver adapter (Required for Prisma 7+)
export const prisma = new PrismaClient({ adapter });

// Provide a safe way to cleanly disconnect on server shutdown
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  await pool.end();
  console.log("[PRISMA] Database disconnected cleanly.");
};

export const connectWithRetry = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[PRISMA] Database connected successfully.");
      return;
    } catch (error) {
      console.warn(`[PRISMA] Connection attempt \${i} failed. Retrying in \${RETRY_DELAY}ms...`);
      if (i === MAX_RETRIES) {
        console.error("[PRISMA] Failed to connect to database after max retries.");
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};
