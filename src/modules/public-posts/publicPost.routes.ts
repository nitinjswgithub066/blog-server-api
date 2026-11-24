import { Router } from "express";
import {
  getFeaturedPosts,
  getLatestPosts,
  getPostBySlug,
  getThoughtPosts,
  getTrendingPosts,
  recordPostShare,
  recordPostView,
  searchPosts,
} from "./publicPost.controller";

const router = Router();
router.get("/featured", getFeaturedPosts);
router.get("/latest", getLatestPosts);
router.get("/trending", getTrendingPosts);
router.get("/thoughts", getThoughtPosts);
router.get("/search", searchPosts);
router.post("/:slug/view", recordPostView);
router.post("/:slug/share", recordPostShare);
router.get("/:slug", getPostBySlug);
export default router;
