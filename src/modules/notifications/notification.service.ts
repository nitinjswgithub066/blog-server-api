import { prisma } from "../../config/prisma";

export type NotificationType =
  | "comment"
  | "traffic"
  | "draft"
  | "document"
  | "legal"
  | "category"
  | "contact"
  | "subscriber"
  | "system";

export const createNotificationService = async (payload: {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  const data: Record<string, unknown> = {
    type: payload.type,
    title: payload.title,
    message: payload.message,
  };

  if (payload.metadata) {
    data.metadata = payload.metadata;
  }

  return prisma.notification.create({
    data: data as any,
  });
};

export const getNotificationsService = async () =>
  prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

export const getUnreadNotificationCountService = async () =>
  prisma.notification.count({ where: { isRead: false } });

export const markNotificationReadService = async (id: string) =>
  prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

export const markAllNotificationsReadService = async () =>
  prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

export const deleteNotificationService = async (id: string) =>
  prisma.notification.delete({ where: { id } });

export const clearNotificationHistoryService = async () =>
  prisma.notification.deleteMany({});
