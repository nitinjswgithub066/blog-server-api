import { Request, Response } from "express";
import {
  createAdminCategoryService,
  deleteAdminCategoryService,
  getAdminCategoriesService,
} from "./adminCategory.service";

const sendError = (res: Response, error: any) => {
  const message = error?.message || "Internal server error";
  const status = message.includes("used by posts") || message.includes("required") ? 400 : 500;
  res.status(status).json({ success: false, message });
};

export const getAdminCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await getAdminCategoriesService();
    res.json({
      success: true,
      message: "Categories fetched successfully.",
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        postCount: category._count.posts,
      })),
    });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES] Error fetching categories:", error);
    sendError(res, error);
  }
};

export const createAdminCategory = async (req: Request, res: Response) => {
  try {
    const category = await createAdminCategoryService(req.body.name || "");
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES] Error creating category:", error);
    sendError(res, error);
  }
};

export const deleteAdminCategory = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ success: false, message: "Category id is required." });

    await deleteAdminCategoryService(id);
    res.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES] Error deleting category:", error);
    sendError(res, error);
  }
};
