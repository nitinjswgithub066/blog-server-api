import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import {
  exportStatisticsReport,
  getCategoryPerformance,
  getStatistics,
  getStatisticsOverview,
  getTopPostPerformance,
  getTrafficTrend,
} from "./adminStatistics.controller";

const router = Router();

router.use(verifyAdminToken);

router.post("/export", exportStatisticsReport);
router.get("/", getStatistics);
router.get("/overview", getStatisticsOverview);
router.get("/traffic-trend", getTrafficTrend);
router.get("/category-performance", getCategoryPerformance);
router.get("/top-posts", getTopPostPerformance);

export default router;
