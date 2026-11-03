import { Router } from "express";
import multer from "multer";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import {
  archivePost,
  bulkArchivePosts,
  bulkDeletePosts,
  bulkExportPosts,
  bulkMovePostsToDraft,
  bulkPublishPosts,
  createDraftPost,
  deleteAdminPost,
  duplicatePost,
  getAdminPostById,
  getAdminPostPreview,
  getAdminPosts,
  getAdminPostsSummary,
  getRecentAdminPosts,
  movePostToDraft,
  publishPost,
  restorePost,
  schedulePost,
  updatePost,
  uploadCoverImage,
  uploadDocument,
  uploadInlineImage,
} from "./adminPost.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(verifyAdminToken);

router.get("/", getAdminPosts);
router.get("/summary", getAdminPostsSummary);
router.get("/recent", getRecentAdminPosts);
router.post("/draft", createDraftPost);
router.post("/upload-cover", upload.single("image"), uploadCoverImage);
router.post("/upload-inline-image", upload.single("image"), uploadInlineImage);
router.post("/upload-document", upload.single("document"), uploadDocument);
router.post("/bulk/publish", bulkPublishPosts);
router.post("/bulk/move-to-draft", bulkMovePostsToDraft);
router.post("/bulk/archive", bulkArchivePosts);
router.post("/bulk/delete", bulkDeletePosts);
router.post("/bulk/export", bulkExportPosts);

router.get("/:id/preview", getAdminPostPreview);
router.post("/:id/duplicate", duplicatePost);
router.post("/:id/publish", publishPost);
router.post("/:id/schedule", schedulePost);
router.post("/:id/move-to-draft", movePostToDraft);
router.post("/:id/restore", restorePost);
router.post("/:id/archive", archivePost);
router.get("/:id", getAdminPostById);
router.put("/:id", updatePost);
router.delete("/:id", deleteAdminPost);

export default router;
