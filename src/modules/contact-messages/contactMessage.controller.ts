import { Request, Response } from "express";
import {
  archiveContactMessageService,
  createContactMessageService,
  deleteContactMessageService,
  getContactMessageByIdService,
  getContactMessagesService,
  getUnreadContactMessageCountService,
  markAllContactMessagesReadService,
  markContactMessageReadService,
  restoreContactMessageService,
} from "./contactMessage.service";

const sendContactMessageError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message.includes("required") ? 400 : 500;
  res.status(status).json({ success: false, message });
};

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export const submitContactMessage = async (req: Request, res: Response) => {
  try {
    const data = await createContactMessageService({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || undefined,
    });
    res.status(201).json({ success: true, message: "Contact message submitted successfully.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error submitting contact message:", error);
    sendContactMessageError(res, error);
  }
};

export const getContactMessages = async (_req: Request, res: Response) => {
  try {
    const data = await getContactMessagesService();
    res.json({ success: true, message: "Contact messages fetched successfully.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error fetching contact messages:", error);
    sendContactMessageError(res, error);
  }
};

export const getContactMessageById = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Contact message id is required." });
    const data = await getContactMessageByIdService(id);
    if (!data) return res.status(404).json({ success: false, message: "Contact message not found." });
    res.json({ success: true, message: "Contact message fetched successfully.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error fetching contact message:", error);
    sendContactMessageError(res, error);
  }
};

export const getUnreadContactMessageCount = async (_req: Request, res: Response) => {
  try {
    const count = await getUnreadContactMessageCountService();
    res.json({ success: true, message: "Unread contact message count fetched successfully.", data: { count } });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error fetching unread count:", error);
    sendContactMessageError(res, error);
  }
};

export const markContactMessageRead = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Contact message id is required." });
    const data = await markContactMessageReadService(id);
    res.json({ success: true, message: "Contact message marked as read.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error marking contact message read:", error);
    sendContactMessageError(res, error);
  }
};

export const markAllContactMessagesRead = async (_req: Request, res: Response) => {
  try {
    const data = await markAllContactMessagesReadService();
    res.json({ success: true, message: "All contact messages marked as read.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error marking all contact messages read:", error);
    sendContactMessageError(res, error);
  }
};

export const archiveContactMessage = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Contact message id is required." });
    const data = await archiveContactMessageService(id);
    res.json({ success: true, message: "Contact message archived.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error archiving contact message:", error);
    sendContactMessageError(res, error);
  }
};

export const restoreContactMessage = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Contact message id is required." });
    const data = await restoreContactMessageService(id);
    res.json({ success: true, message: "Contact message restored.", data });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error restoring contact message:", error);
    sendContactMessageError(res, error);
  }
};

export const deleteContactMessage = async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Contact message id is required." });
    await deleteContactMessageService(id);
    res.json({ success: true, message: "Contact message deleted successfully." });
  } catch (error) {
    console.error("[CONTACT_MESSAGES] Error deleting contact message:", error);
    sendContactMessageError(res, error);
  }
};
