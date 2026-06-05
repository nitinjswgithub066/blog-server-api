"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Export a single shared PrismaClient instance
exports.prisma = new client_1.PrismaClient({
    // @ts-ignore - Prisma 7 types may not reflect this properly yet
    datasourceUrl: process.env.DATABASE_URL
});
// Provide a safe way to cleanly disconnect on server shutdown
const disconnectPrisma = async () => {
    await exports.prisma.$disconnect();
    console.log("[PRISMA] Database disconnected cleanly.");
};
exports.disconnectPrisma = disconnectPrisma;
//# sourceMappingURL=prisma.js.map