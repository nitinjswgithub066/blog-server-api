import { Router } from "express";
import { getSearchTrends, getTopPerformingPosts, getFirstStage } from "./dashboard.controller";
import { verifyAdminToken } from "../../middlewares/auth.middleware";

const router = Router();

// Protect all dashboard routes
router.use(verifyAdminToken);

router.get("/first-stage", getFirstStage);
router.get("/search-trends", getSearchTrends);
router.get("/top-performing-posts", getTopPerformingPosts);

export default router;
