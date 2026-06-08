import { Request, Response } from "express";
import {
  getAdminPostByIdService,
  getAdminPostPreviewService,
  getRecentAdminPostsService,
  softDeleteAdminPostService,
} from "./adminPost.service";

const getIdParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export const getRecentAdminPosts = async (req: Request, res: Response) => {
  try {
    const data = await getRecentAdminPostsService(
      req.query.status as string | undefined,
      req.query.limit as string | undefined
    );

    res.json({
      success: true,
      message: "Recent posts fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching recent posts:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getAdminPostById = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Post id is required." });
    }

    const data = await getAdminPostByIdService(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    res.json({
      success: true,
      message: "Post fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching post:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getAdminPostPreview = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Post id is required." });
    }

    const data = await getAdminPostPreviewService(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    res.json({
      success: true,
      message: "Post preview fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching post preview:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const deleteAdminPost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "Post id is required." });
    }

    const data = await softDeleteAdminPostService(id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    res.json({
      success: true,
      message: "Post deleted successfully.",
      data: {
        id: data.id,
        status: data.status.toLowerCase(),
        deletedAt: data.deletedAt?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error deleting post:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};
