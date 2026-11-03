import { Request, Response } from "express";
import { createAdminTagService, getAdminTagsService } from "./adminTag.service";

const sendError = (res: Response, error: any) => {
  const message = error?.message || "Internal server error";
  res.status(message.includes("required") ? 400 : 500).json({ success: false, message });
};

export const getAdminTags = async (_req: Request, res: Response) => {
  try {
    const tags = await getAdminTagsService();
    res.json({ success: true, message: "Tags fetched successfully.", data: tags });
  } catch (error) {
    console.error("[ADMIN_TAGS] Error fetching tags:", error);
    sendError(res, error);
  }
};

export const createAdminTag = async (req: Request, res: Response) => {
  try {
    const tag = await createAdminTagService(req.body.name || "");
    res.status(201).json({
      success: true,
      message: "Tag created successfully.",
      data: tag,
    });
  } catch (error) {
    console.error("[ADMIN_TAGS] Error creating tag:", error);
    sendError(res, error);
  }
};
