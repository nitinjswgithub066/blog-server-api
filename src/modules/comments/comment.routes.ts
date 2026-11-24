import { Router } from "express";
import { createPublicComment, getPublicComments } from "./comment.controller";

const router = Router();
router.get("/:postId/comments", getPublicComments);
router.post("/:postId/comments", createPublicComment);
export default router;
