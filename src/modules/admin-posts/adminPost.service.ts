import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinaryImageUrl";

type RecentStatusFilter = "all" | "published" | "draft" | "scheduled";

const STATUS_FILTER_MAP: Record<Exclude<RecentStatusFilter, "all">, PostStatus> = {
  published: PostStatus.PUBLISHED,
  draft: PostStatus.DRAFT,
  scheduled: PostStatus.SCHEDULED,
};

const normalizeStatus = (status: PostStatus) => status.toLowerCase();

const safeJsonParse = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toTextPreview = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

const postInclude = {
  category: true,
  tags: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      avatarPublicId: true,
    },
  },
  media: true,
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

const mapRecentPost = (post: PostWithRelations) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  subtitle: post.subtitle,
  category: post.category
    ? { id: post.category.id, name: post.category.name, slug: post.category.slug }
    : null,
  categoryName: post.category?.name ?? "Uncategorized",
  categorySlug: post.category?.slug ?? "uncategorized",
  tags: post.tags.map((tag) => tag.name),
  status: normalizeStatus(post.status),
  views: post.views,
  clicks: post.clicks,
  shares: post.shares,
  readingTime: post.readingTime,
  coverImageUrl: post.coverImageUrl,
  coverImagePublicId: post.coverImagePublicId,
  optimizedCoverUrl: getOptimizedCloudinaryUrl(post.coverImageUrl, "card"),
  contentPreview: toTextPreview(post.contentHtml),
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
  publishedAt: post.publishedAt?.toISOString() ?? null,
  scheduledAt: post.scheduledAt?.toISOString() ?? null,
});

export const getRecentAdminPostsService = async (
  status: string | undefined,
  limitParam: string | undefined
) => {
  const filter = (status || "all").toLowerCase() as RecentStatusFilter;
  const limit = Math.min(Math.max(Number(limitParam) || 30, 1), 100);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where: Prisma.PostWhereInput = {
    createdAt: { gte: thirtyDaysAgo },
    status: { notIn: [PostStatus.DELETED, PostStatus.ARCHIVED] },
  };

  if (filter !== "all" && STATUS_FILTER_MAP[filter]) {
    where.status = STATUS_FILTER_MAP[filter];
  }

  const posts = await prisma.post.findMany({
    where,
    include: postInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return posts.map(mapRecentPost);
};

export const getAdminPostByIdService = async (id: string) => {
  const post = await prisma.post.findFirst({
    where: {
      id,
      status: { not: PostStatus.DELETED },
    },
    include: postInclude,
  });

  if (!post) {
    return null;
  }

  return {
    ...mapRecentPost(post),
    contentHtml: post.contentHtml,
    contentCss: post.contentCss,
    contentJson: safeJsonParse(post.contentJson),
    sourceType: post.sourceType,
    conversionStatus: post.conversionStatus,
    coverImageUrl: post.coverImageUrl,
    optimizedCoverUrl: getOptimizedCloudinaryUrl(post.coverImageUrl, "cover"),
    author: post.author,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    isFeatured: post.isFeatured,
    isTrending: post.isTrending,
    isEditorPick: post.isEditorPick,
    deletedAt: post.deletedAt?.toISOString() ?? null,
  };
};

export const getAdminPostPreviewService = async (id: string) => {
  const post = await prisma.post.findFirst({
    where: {
      id,
      status: { not: PostStatus.DELETED },
    },
    include: postInclude,
  });

  if (!post) {
    return null;
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    subtitle: post.subtitle,
    status: normalizeStatus(post.status),
    category: post.category
      ? { id: post.category.id, name: post.category.name, slug: post.category.slug }
      : null,
    tags: post.tags.map((tag) => tag.name),
    author: {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email,
      avatarUrl: post.author.avatarUrl,
      optimizedAvatarUrl: getOptimizedCloudinaryUrl(post.author.avatarUrl, "avatar"),
    },
    contentHtml: post.contentHtml,
    contentCss: post.contentCss,
    coverImageUrl: post.coverImageUrl,
    coverImagePublicId: post.coverImagePublicId,
    optimizedCoverUrl: getOptimizedCloudinaryUrl(post.coverImageUrl, "cover"),
    readingTime: post.readingTime,
    views: post.views,
    clicks: post.clicks,
    shares: post.shares,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
  };
};

export const softDeleteAdminPostService = async (id: string) => {
  const existing = await prisma.post.findFirst({
    where: {
      id,
      status: { not: PostStatus.DELETED },
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.DELETED,
      deletedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      deletedAt: true,
    },
  });
};
