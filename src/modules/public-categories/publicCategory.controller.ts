import { Request, Response } from "express";
import { getActiveCategoriesService, getCategoryWithPostsService } from "./publicCategory.service";

export const getActiveCategories = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getActiveCategoriesService() });
  } catch (error) {
    console.error("[PUBLIC_CATEGORIES]", error);
    res.status(500).json({ success: false, message: "Unable to load categories." });
  }
};

export const getCategoryPosts = async (req: Request, res: Response) => {
  try {
    const data = await getCategoryWithPostsService(
      String(req.params.slug || ""),
      req.query.page as string,
      req.query.limit as string
    );
    if (!data) return res.status(404).json({ success: false, message: "Category not found." });
    res.json({ success: true, data });
  } catch (error) {
    console.error("[PUBLIC_CATEGORIES]", error);
    res.status(500).json({ success: false, message: "Unable to load category articles." });
  }
};
