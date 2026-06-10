import { Router } from "express";
import { 
  getSearchTrends, 
  getTopPerformingPosts, 
  getFirstStage,
  getBlogPerformance,
  getTopicNotes,
  createTopicNote,
  updateTopicNote,
  deleteTopicNote
} from "./dashboard.controller";
import { verifyAdminToken } from "../../middlewares/auth.middleware";

const router = Router();

// Protect all dashboard routes
router.use(verifyAdminToken);

router.get("/first-stage", getFirstStage);
router.get("/search-trends", getSearchTrends);
router.get("/top-performing-posts", getTopPerformingPosts);

// Stage 2 routes
router.get("/blog-performance", getBlogPerformance);
router.get("/topic-notes", getTopicNotes);
router.post("/topic-notes", createTopicNote);
router.put("/topic-notes/:id", updateTopicNote);
router.delete("/topic-notes/:id", deleteTopicNote);

export default router;
