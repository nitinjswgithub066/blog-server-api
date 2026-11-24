import crypto from "crypto";
import { Request, Response } from "express";
import {
  getFeaturedPostsService,
  getLatestPostsService,
  getPublicPostBySlugService,
  getSearchPostsService,
  getThoughtPostsService,
  getTrendingPostsService,
  recordPostShareService,
  recordPostViewService,
} from "./publicPost.service";

const fail = (res: Response, error: unknown) => {
  console.error("[PUBLIC_POSTS]", error);
  res.status(500).json({ success: false, message: "Unable to load articles." });
};

export const getFeaturedPosts = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await getFeaturedPostsService() }); } catch (error) { fail(res, error); }
};
export const getLatestPosts = async (req: Request, res: Response) => {
  try { res.json({ success: true, data: await getLatestPostsService(req.query.page as string, req.query.limit as string) }); } catch (error) { fail(res, error); }
};
export const getTrendingPosts = async (req: Request, res: Response) => {
  try { res.json({ success: true, data: await getTrendingPostsService(req.query.page as string, req.query.limit as string) }); } catch (error) { fail(res, error); }
};
export const getThoughtPosts = async (req: Request, res: Response) => {
  try { res.json({ success: true, data: await getThoughtPostsService(req.query.page as string, req.query.limit as string) }); } catch (error) { fail(res, error); }
};
export const searchPosts = async (req: Request, res: Response) => {
  try { res.json({ success: true, data: await getSearchPostsService(String(req.query.q || ""), req.query.page as string, req.query.limit as string) }); } catch (error) { fail(res, error); }
};
export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const post = await getPublicPostBySlugService(String(req.params.slug || ""));
    if (!post) return res.status(404).json({ success: false, message: "Article not found." });
    res.json({ success: true, data: post });
  } catch (error) { fail(res, error); }
};
export const recordPostView = async (req: Request, res: Response) => {
  try {
    const visitorKey = crypto
      .createHash("sha256")
      .update(`${req.ip || ""}:${req.get("user-agent") || ""}`)
      .digest("hex");
    const data = await recordPostViewService(String(req.params.slug || ""), visitorKey);
    if (!data) return res.status(404).json({ success: false, message: "Article not found." });
    res.json({ success: true, data });
  } catch (error) { fail(res, error); }
};
export const recordPostShare = async (req: Request, res: Response) => {
  try { res.json({ success: true, data: await recordPostShareService(String(req.params.slug || "")) }); } catch (error) { fail(res, error); }
};
