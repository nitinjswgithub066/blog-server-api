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
