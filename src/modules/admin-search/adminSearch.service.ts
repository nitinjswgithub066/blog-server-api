import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

type SearchResult = {
  id: string;
  title: string;
  type: string;
  description: string;
  path?: string;
  action?: "navigate" | "openPanel";
};

type SearchGroups = Record<"Posts" | "Categories" | "Notifications" | "Messages" | "Pages" | "Settings", SearchResult[]>;

const emptyGroups = (): SearchGroups => ({
  Posts: [],
  Categories: [],
  Notifications: [],
  Messages: [],
  Pages: [],
  Settings: [],
});

const pageIndex: SearchResult[] = [
  { id: "page-dashboard", title: "Dashboard", type: "Page", description: "Overview, notes, trends, and blog performance.", path: "/dashboard" },
  { id: "page-posts", title: "Posts", type: "Page", description: "Manage published, draft, scheduled, and archived posts.", path: "/posts" },
  { id: "page-create-post", title: "Create Post", type: "Page", description: "Write or upload a new blog post.", path: "/posts/create" },
  { id: "page-statistics", title: "Analytics", type: "Page", description: "View statistics, traffic, and post performance.", path: "/statistics" },
  { id: "page-notifications", title: "Notifications", type: "Page", description: "View notification history and alerts.", path: "/notifications" },
  { id: "page-settings", title: "Settings", type: "Page", description: "Configure profile, site identity, security, and preferences.", path: "/settings" },
];

const settingsIndex: SearchResult[] = [
  { id: "settings-profile", title: "Profile settings", type: "Settings", description: "Update author profile and account details.", path: "/profile" },
  { id: "settings-account", title: "Account settings", type: "Settings", description: "Manage login and security preferences.", path: "/settings" },
  { id: "settings-site", title: "Site identity", type: "Settings", description: "Manage VEXIRAHUB identity and appearance.", path: "/settings" },
  { id: "settings-legal", title: "Legal pages", type: "Settings", description: "Manage privacy policy and legal content.", path: "/settings" },
];

const matches = (item: SearchResult, query: string) =>
  `${item.title} ${item.type} ${item.description}`.toLowerCase().includes(query);

export const globalSearchService = async (rawQuery: string | undefined) => {
  const query = (rawQuery || "").trim().toLowerCase();
  const groups = emptyGroups();
  if (!query) return groups;

  const contains = { contains: query, mode: "insensitive" as Prisma.QueryMode };

  const [posts, categories, notifications, messages] = await Promise.all([
    prisma.post.findMany({
      where: {
        status: { in: [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.SCHEDULED] },
        OR: [
          { title: contains },
          { subtitle: contains },
          { slug: contains },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: contains },
          { slug: contains },
        ],
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.notification.findMany({
      where: {
        OR: [
          { title: contains },
          { message: contains },
          { type: contains },
        ],
      },
      select: { id: true, title: true, message: true, type: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.contactMessage.findMany({
      where: {
        isArchived: false,
        OR: [
          { name: contains },
          { email: contains },
          { subject: contains },
        ],
      } as any,
      select: { id: true, name: true, email: true, subject: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  groups.Posts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    type: post.status.toLowerCase(),
    description: post.subtitle || `/${post.slug}`,
    path: `/posts/create?postId=${post.id}`,
  }));

  groups.Categories = categories.map((category) => ({
    id: category.id,
    title: category.name,
    type: "Category",
    description: `Category slug: ${category.slug}`,
    path: `/posts?category=${category.id}`,
  }));

  groups.Notifications = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    type: notification.type,
    description: notification.message,
    path: "/notifications",
  }));

  groups.Messages = messages.map((message) => ({
    id: message.id,
    title: message.subject,
    type: "Contact message",
    description: `${message.name} <${message.email}>`,
    action: "openPanel",
  }));

  groups.Pages = pageIndex.filter((item) => matches(item, query));
  groups.Settings = settingsIndex.filter((item) => matches(item, query));

  return groups;
};
