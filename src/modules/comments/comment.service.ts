import { PostStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { createNotificationService } from "../notifications/notification.service";

export const getPublicCommentsService = async (postId: string) =>
  prisma.comment.findMany({
    where: { postId, isApproved: true, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      replies: {
        where: { isApproved: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

export const createPublicCommentService = async (
  postId: string,
  payload: { name?: string; email?: string; content?: string; parentId?: string | null }
) => {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const content = payload.content?.trim();
  if (!name) throw new Error("Name is required.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required.");
  if (!content) throw new Error("Comment is required.");
  if (content.length > 3000) throw new Error("Comment cannot exceed 3000 characters.");

  const post = await prisma.post.findFirst({
    where: { id: postId, status: PostStatus.PUBLISHED, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!post) throw new Error("Published article not found.");

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorName: name,
      authorEmail: email,
      content,
      parentId: payload.parentId || null,
      isApproved: true,
    },
  });
  await createNotificationService({
    type: "comment",
    title: "New comment received",
    message: `${name} commented on ${post.title}.`,
    metadata: { commentId: comment.id, postId, email },
  });
  return comment;
};
