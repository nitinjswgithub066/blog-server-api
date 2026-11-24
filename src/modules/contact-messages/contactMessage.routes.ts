import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import {
  archiveContactMessage,
  deleteContactMessage,
  getContactMessageById,
  getContactMessages,
  getUnreadContactMessageCount,
  markAllContactMessagesRead,
  markContactMessageRead,
  restoreContactMessage,
  submitContactMessage,
} from "./contactMessage.controller";

export const publicContactMessageRouter = Router();
publicContactMessageRouter.post("/", submitContactMessage);

const adminContactMessageRouter = Router();
adminContactMessageRouter.use(verifyAdminToken);

adminContactMessageRouter.get("/", getContactMessages);
adminContactMessageRouter.get("/unread-count", getUnreadContactMessageCount);
adminContactMessageRouter.patch("/read-all", markAllContactMessagesRead);
adminContactMessageRouter.get("/:id", getContactMessageById);
adminContactMessageRouter.patch("/:id/read", markContactMessageRead);
adminContactMessageRouter.patch("/:id/archive", archiveContactMessage);
adminContactMessageRouter.patch("/:id/restore", restoreContactMessage);
adminContactMessageRouter.delete("/:id", deleteContactMessage);

export default adminContactMessageRouter;
