import { Request, Response } from "express";
import {
  clearNotificationHistoryService,
  deleteNotificationService,
  getNotificationsService,
  getUnreadNotificationCountService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "./notification.service";

const sendNotificationError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ success: false, message });
};

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export const getNotifications = async (_req: Request, res: Response) => {
  try {
    const data = await getNotificationsService();
    res.json({ success: true, message: "Notifications fetched successfully.", data });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error fetching notifications:", error);
    sendNotificationError(res, error);
  }
};

export const getUnreadNotificationCount = async (_req: Request, res: Response) => {
  try {
    const count = await getUnreadNotificationCountService();
    res.json({ success: true, message: "Unread notification count fetched successfully.", data: { count } });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error fetching unread count:", error);
    sendNotificationError(res, error);
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Notification id is required." });
    const data = await markNotificationReadService(id);
    res.json({ success: true, message: "Notification marked as read.", data });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error marking notification read:", error);
    sendNotificationError(res, error);
  }
};

export const markAllNotificationsRead = async (_req: Request, res: Response) => {
  try {
    const data = await markAllNotificationsReadService();
    res.json({ success: true, message: "All notifications marked as read.", data });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error marking all notifications read:", error);
    sendNotificationError(res, error);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Notification id is required." });
    await deleteNotificationService(id);
    res.json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error deleting notification:", error);
    sendNotificationError(res, error);
  }
};

export const clearNotificationHistory = async (_req: Request, res: Response) => {
  try {
    const data = await clearNotificationHistoryService();
    res.json({ success: true, message: "Notification history cleared.", data });
  } catch (error) {
    console.error("[NOTIFICATIONS] Error clearing notification history:", error);
    sendNotificationError(res, error);
  }
};
