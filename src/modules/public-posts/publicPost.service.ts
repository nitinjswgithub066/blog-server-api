import crypto from "crypto";
import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinaryImageUrl";

const publicPostInclude = {
  category: true,
  tags: true,
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
    },
  },
  _count: { select: { comments: { where: { isApproved: true } } } },
} satisfies Prisma.PostInclude;

type PublicPostRecord = Prisma.PostGetPayload<{ include: typeof publicPostInclude }>;

const iconBySlug: Record<string, string> = {
  technology: "FiCpu",
  programming: "FiCode",
  "web-development": "FiGlobe",
  ai: "FiZap",
  startups: "FiTrendingUp",
  business: "FiBriefcase",
  finance: "FiDollarSign",
  education: "FiBook",
  career: "FiAward",
  gaming: "FiMonitor",
  entertainment: "FiFilm",
  reviews: "FiStar",
  thoughts: "FiFeather",
};

const accentBySlug: Record<string, string> = {
  technology: "var(--cat-technology)",
  programming: "var(--cat-programming)",
  "web-development": "var(--cat-web-dev)",
  ai: "var(--cat-ai)",
  startups: "var(--cat-startups)",
  business: "var(--cat-business)",
  finance: "var(--cat-finance)",
  education: "var(--cat-education)",
  career: "var(--cat-career)",
  gaming: "var(--cat-gaming)",
  entertainment: "var(--cat-entertainment)",
  reviews: "var(--cat-reviews)",
  thoughts: "var(--cat-thoughts)",
};

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const mapCategory = (category: PublicPostRecord["category"]) => ({
  id: category?.id || "uncategorized",
  name: category?.name || "Uncategorized",
  slug: category?.slug || "uncategorized",
  description: `Latest ${category?.name || "uncategorized"} articles and insights.`,
  icon: iconBySlug[category?.slug || ""] || "FiBookOpen",
  accentColor: accentBySlug[category?.slug || ""] || "var(--accent-primary)",
  coverImage: "",
});

export const mapPublicPost = (post: PublicPostRecord, includeContent = false) => {
  const excerpt = post.subtitle?.trim() || post.metaDescription?.trim() || stripHtml(post.contentHtml).slice(0, 180);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt,
    ...(includeContent ? { content: post.contentHtml, contentCss: post.contentCss || "" } : {}),
    category: mapCategory(post.category),
    tags: post.tags.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
    author: {
      id: post.author.id,
      name: post.author.name,
      slug: post.author.username || post.author.id,
      avatar: post.author.avatarUrl || "",
      bio: post.author.bio || "",
      role: post.author.role.toLowerCase(),
      social: {},
    },
    publishedAt: (post.publishedAt || post.createdAt).toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingTime: post.readingTime,
    featuredImage: getOptimizedCloudinaryUrl(post.coverImageUrl, includeContent ? "cover" : "card") || post.coverImageUrl || "",
    featuredImageAlt: post.title,
    isFeatured: post.isFeatured || post.isEditorPick,
    isTrending: post.isTrending,
    isThought: post.category?.slug === "thoughts",
    views: post.views,
    likes: 0,
    shares: post.shares,
    commentCount: post._count.comments,
    seo: {
      metaTitle: post.metaTitle || post.title,
      metaDescription: post.metaDescription || excerpt,
      keywords: post.tags.map((tag) => tag.name),
    },
  };
};

const publishedWhere: Prisma.PostWhereInput = {
  status: PostStatus.PUBLISHED,
  deletedAt: null,
};

const normalizePagination = (pageInput?: string, limitInput?: string) => {
  const page = Math.max(Number(pageInput) || 1, 1);
  const limit = Math.min(Math.max(Number(limitInput) || 12, 1), 50);
  return { page, limit };
};

const listPublished = async (where: Prisma.PostWhereInput, pageInput?: string, limitInput?: string) => {
  const { page, limit } = normalizePagination(pageInput, limitInput);
  const combinedWhere: Prisma.PostWhereInput = { AND: [publishedWhere, where] };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: combinedWhere,
      include: publicPostInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where: combinedWhere }),
  ]);
  return {
    items: posts.map((post) => mapPublicPost(post)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNext: page * limit < total,
    },
  };
};

export const getFeaturedPostsService = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = await prisma.post.findMany({
    where: { AND: [publishedWhere, { publishedAt: { gte: thirtyDaysAgo } }] },
    include: publicPostInclude,
    orderBy: { publishedAt: "desc" },
    take: 12,
  });

  const selected = [...recent];
  if (selected.length < 3) {
    selected.push(
      ...(await prisma.post.findMany({
        where: { AND: [publishedWhere, { id: { notIn: selected.map((post) => post.id) } }] },
        include: publicPostInclude,
        orderBy: { publishedAt: "desc" },
        take: 12,
      }))
    );
  }

  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  return selected
    .map((post) => ({
      post,
      order: crypto.createHash("sha256").update(`${bucket}:${post.id}`).digest("hex"),
    }))
    .sort((a, b) => a.order.localeCompare(b.order))
    .slice(0, 3)
    .map(({ post }) => mapPublicPost(post));
};

export const getLatestPostsService = (page?: string, limit?: string) => listPublished({}, page, limit);
export const getThoughtPostsService = (page?: string, limit?: string) =>
  listPublished({ category: { slug: "thoughts" } }, page, limit);
export const getCategoryPostsService = (slug: string, page?: string, limit?: string) =>
  listPublished({ category: { slug } }, page, limit);
export const getSearchPostsService = (query: string, page?: string, limit?: string) =>
  listPublished(
    query.trim()
      ? {
          OR: [
            { title: { contains: query.trim(), mode: "insensitive" } },
            { subtitle: { contains: query.trim(), mode: "insensitive" } },
            { category: { name: { contains: query.trim(), mode: "insensitive" } } },
            { tags: { some: { name: { contains: query.trim(), mode: "insensitive" } } } },
          ],
        }
      : {},
    page,
    limit
  );

export const getTrendingPostsService = async (pageInput?: string, limitInput?: string) => {
  const { page, limit } = normalizePagination(pageInput, limitInput);
  const posts = await prisma.post.findMany({
    where: publishedWhere,
    include: publicPostInclude,
    orderBy: { publishedAt: "desc" },
    take: 250,
  });
  const now = Date.now();
  const ranked = posts
    .map((post) => {
      const ageDays = Math.max((now - (post.publishedAt || post.createdAt).getTime()) / 86400000, 0);
      const recentBoost = Math.max(30 - ageDays, 0) * 20;
      return { post, score: post.views + post._count.comments * 5 + post.shares * 3 + recentBoost };
    })
    .sort((a, b) => b.score - a.score);
  return {
    items: ranked.slice((page - 1) * limit, page * limit).map(({ post }) => mapPublicPost(post)),
    pagination: {
      page,
      limit,
      total: ranked.length,
      totalPages: Math.max(Math.ceil(ranked.length / limit), 1),
      hasNext: page * limit < ranked.length,
    },
  };
};

export const getPublicPostBySlugService = async (slug: string) => {
  const post = await prisma.post.findFirst({
    where: { AND: [publishedWhere, { slug }] },
    include: publicPostInclude,
  });
  return post ? mapPublicPost(post, true) : null;
};

export const recordPostViewService = async (slug: string, visitorKey: string) => {
  const post = await prisma.post.findFirst({
    where: { AND: [publishedWhere, { slug }] },
    select: { id: true },
  });
  if (!post) return null;
  const bucket = new Date().toISOString().slice(0, 13);
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.postView.create({ data: { postId: post.id, visitorKey, bucket } });
      return tx.post.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
    });
    return { views: updated.views, counted: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const current = await prisma.post.findUnique({ where: { id: post.id }, select: { views: true } });
      return { views: current?.views || 0, counted: false };
    }
    throw error;
  }
};

export const recordPostShareService = async (slug: string) =>
  prisma.post.update({
    where: { slug },
    data: { shares: { increment: 1 } },
    select: { shares: true },
  });
