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
