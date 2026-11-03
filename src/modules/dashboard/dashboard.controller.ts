import { Request, Response } from "express";
import { getSearchTrendsService, getTopPerformingPostsService } from "./dashboard.service";

export const getSearchTrends = async (req: Request, res: Response) => {
  try {
    const data = await getSearchTrendsService();
    res.json({
      success: true,
      message: "Dashboard search trends fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error fetching search trends:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getTopPerformingPosts = async (req: Request, res: Response) => {
  try {
    const data = await getTopPerformingPostsService();
    res.json({
      success: true,
      message: "Top performing posts fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error fetching top performing posts:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getFirstStage = async (req: Request, res: Response) => {
  try {
    const [searchTrends, topPosts] = await Promise.all([
      getSearchTrendsService(),
      getTopPerformingPostsService(),
    ]);

    res.json({
      success: true,
      data: {
        searchTrends,
        topPosts,
      },
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error fetching first stage dashboard:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

import { 
  getBlogPerformanceService, 
  getTopicNotesService, 
  createTopicNoteService, 
  updateTopicNoteService, 
  deleteTopicNoteService 
} from "./dashboard.service";

export const getBlogPerformance = async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || 'daily';
    const dateStr = req.query.date as string | undefined;
    const source = (req.query.source as string) || 'internal';
    
    const data = await getBlogPerformanceService(range, dateStr, source);
    
    res.json({
      success: true,
      message: "Blog performance fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error fetching blog performance:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getTopicNotes = async (req: Request, res: Response) => {
  try {
    const data = await getTopicNotesService();
    res.json({
      success: true,
      message: "Topic notes fetched successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error fetching topic notes:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const createTopicNote = async (req: Request, res: Response) => {
  try {
    const { title, categoryId } = req.body;
    // adminId could be sourced from req.user if auth middleware populates it.
    // For now we pass null or req.user.id if available
    const adminId = (req as any).user?.id;
    
    const data = await createTopicNoteService(title, categoryId, adminId);
    
    res.json({
      success: true,
      message: "Topic note added successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error creating topic note:", error);
    // Important: send 400 for max limit error
    const status = error.message?.includes('save only 5 active topic ideas') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const updateTopicNote = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { isCompleted } = req.body;
    
    const data = await updateTopicNoteService(id, isCompleted);
    
    res.json({
      success: true,
      message: "Topic note updated successfully.",
      data,
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error updating topic note:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const deleteTopicNote = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    await deleteTopicNoteService(id);
    
    res.json({
      success: true,
      message: "Topic note deleted successfully.",
    });
  } catch (error: any) {
    console.error("[DASHBOARD] Error deleting topic note:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};
