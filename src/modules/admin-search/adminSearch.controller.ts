import { Request, Response } from "express";
import { globalSearchService } from "./adminSearch.service";

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const query = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const data = await globalSearchService(typeof query === "string" ? query : undefined);
    res.json({ success: true, message: "Search results fetched successfully.", data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[ADMIN_SEARCH] Error searching:", error);
    res.status(500).json({ success: false, message });
  }
};
