import { Request, Response } from "express";
import { createPublicCommentService, getPublicCommentsService } from "./comment.service";

const mapComment = (comment: any): any => ({
  id: comment.id,
  author: comment.authorName,
  text: comment.content,
  createdAt: comment.createdAt,
  replies: (comment.replies || []).map(mapComment),
});

export const getPublicComments = async (req: Request, res: Response) => {
  try {
    const comments = await getPublicCommentsService(String(req.params.postId || ""));
    res.json({ success: true, data: comments.map(mapComment) });
  } catch (error) {
    console.error("[COMMENTS]", error);
    res.status(500).json({ success: false, message: "Unable to load comments." });
  }
};

export const createPublicComment = async (req: Request, res: Response) => {
  try {
    const comment = await createPublicCommentService(String(req.params.postId || ""), req.body);
    res.status(201).json({ success: true, message: "Comment posted successfully.", data: mapComment(comment) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to post comment.";
    res.status(message.includes("required") || message.includes("valid") || message.includes("exceed") ? 400 : 404)
      .json({ success: false, message });
  }
};
