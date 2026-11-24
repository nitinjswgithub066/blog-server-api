import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

const idParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export const getAdminComments = async (_req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      include: { post: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    res.json({ success: true, data: comments });
  } catch {
    res.status(500).json({ success: false, message: "Unable to load comments." });
  }
};

export const updateAdminComment = async (req: Request, res: Response) => {
  try {
    const id = idParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Comment id is required." });
    const comment = await prisma.comment.update({
      where: { id },
      data: { isApproved: Boolean(req.body.isApproved) },
    });
    res.json({ success: true, data: comment });
  } catch {
    res.status(500).json({ success: false, message: "Unable to update comment." });
  }
};

export const deleteAdminComment = async (req: Request, res: Response) => {
  try {
    const id = idParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Comment id is required." });
    await prisma.comment.delete({ where: { id } });
    res.json({ success: true, message: "Comment deleted." });
  } catch {
    res.status(500).json({ success: false, message: "Unable to delete comment." });
  }
};
