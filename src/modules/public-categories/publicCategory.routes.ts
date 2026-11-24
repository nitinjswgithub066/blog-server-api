import { Router } from "express";
import { getActiveCategories, getCategoryPosts } from "./publicCategory.controller";

const router = Router();
router.get("/active", getActiveCategories);
router.get("/:slug/posts", getCategoryPosts);
export default router;
