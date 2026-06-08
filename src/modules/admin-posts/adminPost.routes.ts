import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import {
  deleteAdminPost,
  getAdminPostById,
  getAdminPostPreview,
  getRecentAdminPosts,
} from "./adminPost.controller";

const router = Router();

router.use(verifyAdminToken);

router.get("/recent", getRecentAdminPosts);
router.get("/:id/preview", getAdminPostPreview);
router.get("/:id", getAdminPostById);
router.delete("/:id", deleteAdminPost);

export default router;
