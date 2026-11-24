import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import {
  clearNotificationHistory,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.controller";

const router = Router();

router.use(verifyAdminToken);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/clear-history", clearNotificationHistory);
router.delete("/:id", deleteNotification);

export default router;
