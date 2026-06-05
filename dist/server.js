"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const jobs_1 = require("./jobs");
const prisma_1 = require("./config/prisma");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Blog Server API is running");
});
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start cron jobs after server initializes
    (0, jobs_1.startCronJobs)();
});
// Graceful shutdown handling
const shutdown = async () => {
    console.log("\n[SERVER] Shutting down gracefully...");
    server.close(async () => {
        console.log("[SERVER] HTTP server closed.");
        await (0, prisma_1.disconnectPrisma)();
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
//# sourceMappingURL=server.js.map