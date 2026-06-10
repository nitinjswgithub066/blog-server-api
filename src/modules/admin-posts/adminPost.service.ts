import { ContentSource, ConversionStatus, MediaUsage, PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinaryImageUrl";
import { slugify } from "../../utils/slugify";
import { calculateReadingTime } from "../../utils/calculateReadingTime";
import { sanitizePostHtml } from "../../utils/sanitizePostHtml";

type RecentStatusFilter = "all" | "published" | "draft" | "scheduled" | "archive";
type PostsStatusFilter = "all" | "published" | "draft" | "scheduled" | "archived";
type PostsSort =
  | "newest"
  | "oldest"
  | "most_views"
  | "least_views"
  | "title_az"
  | "title_za"
  | "updated_desc"
  | "updated_asc";

export interface PostMutationPayload {
  title?: string;
  subtitle?: string;
  contentHtml?: string;
  contentCss?: string | null;
  contentJson?: unknown;
  categoryId?: string | null;
  tags?: string[];
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  sourceType?: ContentSource | keyof typeof ContentSource;
  originalDocumentUrl?: string | null;
  originalDocumentPublicId?: string | null;
  conversionStatus?: ConversionStatus | keyof typeof ConversionStatus;
  scheduledAt?: string | null;
}

const STATUS_FILTER_MAP: Record<Exclude<RecentStatusFilter, "all" | "archive">, PostStatus> = {
  published: PostStatus.PUBLISHED,
  draft: PostStatus.DRAFT,
  scheduled: PostStatus.SCHEDULED,
};

const POSTS_STATUS_FILTER_MAP: Record<Exclude<PostsStatusFilter, "all">, PostStatus> = {
  published: PostStatus.PUBLISHED,
  draft: PostStatus.DRAFT,
  scheduled: PostStatus.SCHEDULED,
  archived: PostStatus.ARCHIVED,
};

const ALL_VISIBLE_STATUSES = [
  PostStatus.PUBLISHED,
  PostStatus.DRAFT,
  PostStatus.SCHEDULED,
  PostStatus.ARCHIVED,
];

const ARCHIVED_TAB_STATUSES = [PostStatus.ARCHIVED, PostStatus.DELETED];

const normalizeStatus = (status: PostStatus) => status.toLowerCase();

const safeJsonStringify = (value: unknown) => {
  if (typeof value === "string") {
    return value || "{}";
  }
  return JSON.stringify(value ?? {});
};

const safeJsonParse = (value: string | null | undefined) => {
  if (!value) return null;
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

const mapPost = (post: PostWithRelations, variant: "card" | "cover" | "thumbnail" = "card") => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  subtitle: post.subtitle,
  category: post.category
    ? { id: post.category.id, name: post.category.name, slug: post.category.slug }
    : null,
  categoryId: post.categoryId,
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
  optimizedCoverUrl: getOptimizedCloudinaryUrl(post.coverImageUrl, variant),
  optimizedCardUrl: getOptimizedCloudinaryUrl(post.coverImageUrl, "card"),
  optimizedThumbnailUrl: getOptimizedCloudinaryUrl(post.coverImageUrl, "thumbnail"),
  contentPreview: toTextPreview(post.contentHtml),
  author: {
    id: post.author.id,
    name: post.author.name,
    email: post.author.email,
    avatarUrl: post.author.avatarUrl,
  },
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
  publishedAt: post.publishedAt?.toISOString() ?? null,
  scheduledAt: post.scheduledAt?.toISOString() ?? null,
  deletedAt: post.deletedAt?.toISOString() ?? null,
});

const buildSlug = async (title: string, existingPostId?: string) => {
  const base = slugify(title) || "untitled-blog-document";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        slug: candidate,
        ...(existingPostId ? { id: { not: existingPostId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    candidate = `${base}-${suffix++}`;
  }
};

const resolveTags = (tags: string[] = []) => {
  const normalized = Array.from(
    new Map(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => [tag.toLowerCase(), tag])
    ).values()
  );

  if (normalized.length > 10) {
    throw new Error("Maximum 10 tags are allowed.");
  }

  return normalized.map((name) => ({
    where: { name },
    create: { name, slug: slugify(name) || name.toLowerCase() },
  }));
};

const validateSubtitle = (subtitle?: string | null) => {
  if ((subtitle || "").length > 450) {
    throw new Error("Subheading cannot exceed 450 characters.");
  }
};

const buildPostData = async (
  payload: PostMutationPayload,
  existingPostId?: string,
  status?: PostStatus
): Promise<any> => {
  validateSubtitle(payload.subtitle);

  const title = (payload.title || "Untitled Blog Document").trim() || "Untitled Blog Document";
  const contentHtml = sanitizePostHtml(payload.contentHtml || "");
  const tags = resolveTags(payload.tags);
  const slug = await buildSlug(title, existingPostId);
  const tagMutation = existingPostId ? { set: [], connectOrCreate: tags } : { connectOrCreate: tags };
  const categoryMutation = payload.categoryId
    ? { category: { connect: { id: payload.categoryId } } }
    : existingPostId && payload.categoryId === null
      ? { category: { disconnect: true } }
      : {};

  return {
    title,
    slug,
    subtitle: payload.subtitle || "",
    contentHtml,
    contentCss: payload.contentCss || "",
    contentJson: safeJsonStringify(payload.contentJson),
    coverImageUrl: payload.coverImageUrl || null,
    coverImagePublicId: payload.coverImagePublicId || null,
    sourceType: (payload.sourceType as ContentSource) || ContentSource.TEXT_EDITOR,
    conversionStatus: (payload.conversionStatus as ConversionStatus) || ConversionStatus.NONE,
    originalDocumentUrl: payload.originalDocumentUrl || null,
    originalDocumentPublicId: payload.originalDocumentPublicId || null,
    readingTime: calculateReadingTime(contentHtml),
    ...(status ? { status } : {}),
    ...categoryMutation,
    tags: tagMutation,
    deletedAt: null,
  };
};

const getPostOrNull = (id: string) =>
  prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });

const attachUploadedMediaToPost = async (postId: string, payload: PostMutationPayload) => {
  const publicIds = [
    payload.coverImagePublicId,
    payload.originalDocumentPublicId,
  ].filter(Boolean) as string[];

  if (publicIds.length === 0) return;

  await prisma.media.updateMany({
    where: {
      publicId: { in: publicIds },
      postId: null,
    },
    data: { postId },
  });
};

const escapeHtml = (value: string | null | undefined) =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeIds = (ids: unknown) => {
  if (!Array.isArray(ids)) return [];
  return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))));
};

const validatePublishablePost = (post: Pick<PostWithRelations, "id" | "title" | "contentHtml" | "categoryId">) => {
  const missing: string[] = [];
  if (!post.title?.trim()) missing.push("title");
  if (!post.contentHtml?.trim()) missing.push("content");
  if (!post.categoryId) missing.push("category");
  return missing;
};

const mapExportPost = (post: PostWithRelations) => ({
  title: post.title,
  slug: post.slug,
  subtitle: post.subtitle || "",
  contentHtml: post.contentHtml,
  category: post.category?.name || "Uncategorized",
  tags: post.tags.map((tag) => tag.name),
  status: post.status,
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
});

const buildExportHtml = (posts: PostWithRelations[]) => `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Exported Posts</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe3f4;
        --soft: #f3f6ff;
        --brand: #6d5df6;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        background: #f8fafc;
        line-height: 1.7;
      }
      .export-shell {
        width: min(980px, calc(100% - 32px));
        margin: 40px auto;
      }
      .export-header {
        border-bottom: 1px solid var(--line);
        padding-bottom: 24px;
        margin-bottom: 28px;
      }
      .brand {
        color: var(--brand);
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      h1, h2, h3 { line-height: 1.15; letter-spacing: 0; }
      .export-title {
        margin: 10px 0 8px;
        font-size: 42px;
      }
      .export-meta,
      .post-meta {
        color: var(--muted);
        font-size: 14px;
      }
      article {
        background: white;
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: clamp(24px, 5vw, 48px);
        margin-bottom: 28px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
      }
      .post-kicker {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        color: var(--brand);
        font-weight: 800;
        text-transform: uppercase;
        font-size: 13px;
      }
      .post-title {
        margin: 12px 0;
        font-size: clamp(32px, 6vw, 64px);
      }
      .post-subtitle {
        color: var(--muted);
        font-size: 20px;
        margin: 0 0 18px;
      }
      .post-content {
        margin-top: 32px;
        padding-top: 28px;
        border-top: 1px solid var(--line);
      }
      .post-content img {
        max-width: 100%;
        border-radius: 14px;
      }
      .tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
      .tag {
        background: var(--soft);
        border: 1px solid var(--line);
        border-radius: 999px;
        color: var(--muted);
        padding: 4px 10px;
        font-size: 12px;
      }
      @media print {
        body { background: white; }
        article { box-shadow: none; break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <main class="export-shell">
      <header class="export-header">
        <div class="brand">VEXIRAHUB</div>
        <h1 class="export-title">Exported Posts</h1>
        <div class="export-meta">${posts.length} post${posts.length === 1 ? "" : "s"} exported on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
      </header>
${posts
  .map(
    (post) => `    <article>
      <div class="post-kicker">${escapeHtml(post.category?.name || "Uncategorized")} <span>/</span> ${post.status}</div>
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      ${post.subtitle ? `<p class="post-subtitle">${escapeHtml(post.subtitle)}</p>` : ""}
      <div class="post-meta">By VEXIRAHUB / Updated ${post.updatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
      ${post.tags.length > 0 ? `<div class="tag-row">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag.name)}</span>`).join("")}</div>` : ""}
      <div class="post-content">${post.contentHtml}</div>
    </article>`
  )
  .join("\n")}
    </main>
  </body>
</html>`;

const getSortOrder = (sort: string | undefined): Prisma.PostOrderByWithRelationInput[] => {
  const normalized = (sort || "updated_desc") as PostsSort;

  switch (normalized) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "most_views":
      return [{ views: "desc" }, { updatedAt: "desc" }];
    case "least_views":
      return [{ views: "asc" }, { updatedAt: "desc" }];
    case "title_az":
      return [{ title: "asc" }];
    case "title_za":
      return [{ title: "desc" }];
    case "updated_asc":
      return [{ updatedAt: "asc" }];
    case "updated_desc":
    default:
      return [{ updatedAt: "desc" }];
  }
};

export const getAdminPostsSummaryService = async () => {
  const [totalPosts, published, drafts, scheduled, archived] = await Promise.all([
    prisma.post.count({ where: { status: { in: [...ALL_VISIBLE_STATUSES, PostStatus.DELETED] } } }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.post.count({ where: { status: PostStatus.SCHEDULED } }),
    prisma.post.count({ where: { status: { in: ARCHIVED_TAB_STATUSES } } }),
  ]);

  return {
    totalPosts,
    published,
    drafts,
    scheduled,
    archived,
  };
};

export const getAdminPostsService = async (query: {
  status?: string | undefined;
  search?: string | undefined;
  categoryId?: string | undefined;
  sort?: string | undefined;
  page?: string | undefined;
  limit?: string | undefined;
}) => {
  const status = (query.status || "all").toLowerCase() as PostsStatusFilter;
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const search = query.search?.trim();

  const where: Prisma.PostWhereInput = {
    status:
      status === "all"
        ? { in: ALL_VISIBLE_STATUSES }
        : status === "archived"
          ? { in: ARCHIVED_TAB_STATUSES }
        : POSTS_STATUS_FILTER_MAP[status]
          ? POSTS_STATUS_FILTER_MAP[status]
          : { in: ALL_VISIBLE_STATUSES },
  };

  if (query.categoryId && query.categoryId !== "all") {
    where.categoryId = query.categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { subtitle: { contains: search, mode: "insensitive" } },
      { author: { name: { contains: search, mode: "insensitive" } } },
      { category: { name: { contains: search, mode: "insensitive" } } },
      { tags: { some: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: getSortOrder(query.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items: items.map((post) => mapPost(post, "thumbnail")),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
};

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

  if (filter === "archive") {
    delete where.createdAt;
    where.status = { in: [PostStatus.ARCHIVED, PostStatus.DELETED] };
  } else if (filter !== "all" && STATUS_FILTER_MAP[filter]) {
    where.status = STATUS_FILTER_MAP[filter];
  }

  const posts = await prisma.post.findMany({
    where,
    include: postInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return posts.map((post) => mapPost(post));
};

export const getAdminPostByIdService = async (id: string) => {
  const post = await getPostOrNull(id);
  if (!post) return null;

  return {
    ...mapPost(post, "cover"),
    contentHtml: post.contentHtml,
    contentCss: post.contentCss,
    contentJson: safeJsonParse(post.contentJson),
    sourceType: post.sourceType,
    conversionStatus: post.conversionStatus,
    author: post.author,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    canonicalUrl: post.canonicalUrl,
    isFeatured: post.isFeatured,
    isTrending: post.isTrending,
    isEditorPick: post.isEditorPick,
  };
};

export const getAdminPostPreviewService = async (id: string) => {
  const post = await getPostOrNull(id);
  if (!post) return null;

  return {
    ...mapPost(post, "cover"),
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
  };
};

export const createDraftPostService = async (payload: PostMutationPayload, adminId: string) => {
  const data = await buildPostData(payload, undefined, PostStatus.DRAFT);

  const post = await prisma.post.create({
    data: {
      ...data,
      author: { connect: { id: adminId } },
      scheduledAt: null,
      publishedAt: null,
    },
    include: postInclude,
  });

  await attachUploadedMediaToPost(post.id, payload);

  return mapPost(post, "cover");
};

export const updatePostService = async (id: string, payload: PostMutationPayload, status?: PostStatus) => {
  const existing = await getPostOrNull(id);
  if (!existing) return null;

  const data = await buildPostData(payload, id, status);

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...data,
      ...(status === PostStatus.DRAFT ? { publishedAt: null, scheduledAt: null } : {}),
    },
    include: postInclude,
  });

  await attachUploadedMediaToPost(post.id, payload);

  return mapPost(post, "cover");
};

export const publishPostService = async (id: string, payload: PostMutationPayload) => {
  if (!payload.title?.trim()) throw new Error("Title required.");
  if (!payload.contentHtml?.trim() && !payload.contentJson) throw new Error("Content required.");
  if (!payload.categoryId) throw new Error("Category required.");

  const data = await buildPostData(payload, id, PostStatus.PUBLISHED);

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...data,
      publishedAt: new Date(),
      scheduledAt: null,
      deletedAt: null,
    },
    include: postInclude,
  });

  await attachUploadedMediaToPost(post.id, payload);

  return mapPost(post, "cover");
};

export const schedulePostService = async (id: string, payload: PostMutationPayload) => {
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    throw new Error("Schedule time must be in future.");
  }
  if (!payload.title?.trim()) throw new Error("Title required.");
  if (!payload.contentHtml?.trim() && !payload.contentJson) throw new Error("Content required.");
  if (!payload.categoryId) throw new Error("Category required.");

  const data = await buildPostData(payload, id, PostStatus.SCHEDULED);

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...data,
      scheduledAt,
      publishedAt: null,
      deletedAt: null,
    },
    include: postInclude,
  });

  await attachUploadedMediaToPost(post.id, payload);

  return mapPost(post, "cover");
};

export const duplicatePostService = async (id: string) => {
  const existing = await getPostOrNull(id);
  if (!existing) return null;

  const title = `${existing.title} Copy`;
  const slug = await buildSlug(title);
  const post = await prisma.post.create({
    data: {
      title,
      slug,
      subtitle: existing.subtitle,
      contentHtml: existing.contentHtml,
      contentCss: existing.contentCss,
      contentJson: existing.contentJson,
      coverImageUrl: existing.coverImageUrl,
      coverImagePublicId: existing.coverImagePublicId,
      sourceType: existing.sourceType,
      conversionStatus: existing.conversionStatus,
      originalDocumentUrl: existing.originalDocumentUrl,
      originalDocumentPublicId: existing.originalDocumentPublicId,
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
      canonicalUrl: existing.canonicalUrl,
      readingTime: existing.readingTime,
      status: PostStatus.DRAFT,
      views: 0,
      clicks: 0,
      shares: 0,
      publishedAt: null,
      scheduledAt: null,
      deletedAt: null,
      author: { connect: { id: existing.authorId } },
      ...(existing.categoryId ? { category: { connect: { id: existing.categoryId } } } : {}),
      tags: { connect: existing.tags.map((tag) => ({ id: tag.id })) },
    },
    include: postInclude,
  });

  return mapPost(post, "thumbnail");
};

export const movePostToDraftService = async (id: string) => {
  const existing = await getPostOrNull(id);
  if (!existing || existing.status === PostStatus.DELETED) return null;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.DRAFT,
      publishedAt: null,
      scheduledAt: null,
      deletedAt: null,
    },
    include: postInclude,
  });

  return mapPost(post);
};

export const softDeleteAdminPostService = async (id: string) => {
  const existing = await getPostOrNull(id);
  if (!existing) return null;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.DELETED,
      deletedAt: new Date(),
      scheduledAt: null,
    },
    include: postInclude,
  });

  return mapPost(post);
};

export const archivePostService = async (id: string) => {
  const post = await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.ARCHIVED,
      deletedAt: null,
      scheduledAt: null,
    },
    include: postInclude,
  });
  return mapPost(post);
};

export const restorePostService = async (id: string) => {
  const post = await prisma.post.update({
    where: { id },
    data: {
      status: PostStatus.DRAFT,
      deletedAt: null,
      scheduledAt: null,
    },
    include: postInclude,
  });
  return mapPost(post);
};

export const bulkPublishPostsService = async (idsInput: unknown) => {
  const ids = normalizeIds(idsInput);
  const failed: { id: string; reason: string }[] = [];
  let updated = 0;

  const posts = await prisma.post.findMany({
    where: { id: { in: ids }, status: { not: PostStatus.DELETED } },
    include: postInclude,
  });
  const foundIds = new Set(posts.map((post) => post.id));

  for (const id of ids) {
    if (!foundIds.has(id)) failed.push({ id, reason: "Post not found." });
  }

  for (const post of posts) {
    const missing = validatePublishablePost(post);
    if (missing.length > 0) {
      failed.push({ id: post.id, reason: `Missing ${missing.join(", ")}.` });
      continue;
    }

    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        scheduledAt: null,
        deletedAt: null,
      },
    });
    updated++;
  }

  return { updated, failed };
};

export const bulkMovePostsToDraftService = async (idsInput: unknown) => {
  const ids = normalizeIds(idsInput);
  const result = await prisma.post.updateMany({
    where: { id: { in: ids }, status: { not: PostStatus.DELETED } },
    data: {
      status: PostStatus.DRAFT,
      publishedAt: null,
      scheduledAt: null,
      deletedAt: null,
    },
  });

  return { updated: result.count, failed: [] };
};

export const bulkArchivePostsService = async (idsInput: unknown) => {
  const ids = normalizeIds(idsInput);
  const result = await prisma.post.updateMany({
    where: { id: { in: ids }, status: { not: PostStatus.DELETED } },
    data: {
      status: PostStatus.ARCHIVED,
      scheduledAt: null,
      deletedAt: null,
    },
  });

  return { updated: result.count, failed: [] };
};

export const bulkDeletePostsService = async (idsInput: unknown) => {
  const ids = normalizeIds(idsInput);
  const result = await prisma.post.updateMany({
    where: { id: { in: ids }, status: { not: PostStatus.DELETED } },
    data: {
      status: PostStatus.DELETED,
      scheduledAt: null,
      deletedAt: new Date(),
    },
  });

  return { updated: result.count, failed: [] };
};

export const bulkExportPostsService = async (idsInput: unknown, formatInput: unknown) => {
  const ids = normalizeIds(idsInput);
  const format = typeof formatInput === "string" ? formatInput.toLowerCase() : "json";

  if (!["json", "html", "docx"].includes(format)) {
    throw new Error("Unsupported export format.");
  }

  if (format === "docx") {
    throw new Error("DOCX export will be available after Word export package is configured.");
  }

  const posts = await prisma.post.findMany({
    where: {
      id: { in: ids },
    },
    include: postInclude,
    orderBy: { updatedAt: "desc" },
  });

  if (format === "html") {
    return {
      format,
      fileName: "exported-posts.html",
      content: buildExportHtml(posts),
    };
  }

  return {
    format,
    fileName: "exported-posts.json",
    content: posts.map(mapExportPost),
  };
};

export const createMediaRecord = async (payload: {
  url: string;
  publicId: string;
  folder: string;
  resourceType?: string;
  mimeType?: string | undefined;
  format?: string | undefined;
  bytes?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  usedFor: MediaUsage;
  uploadedById?: string | undefined;
}) => {
  const data: Prisma.MediaUncheckedCreateInput = {
    url: payload.url,
    publicId: payload.publicId,
    folder: payload.folder,
    resourceType: payload.resourceType ?? null,
    mimeType: payload.mimeType ?? null,
    format: payload.format ?? null,
    bytes: payload.bytes ?? null,
    width: payload.width ?? null,
    height: payload.height ?? null,
    usedFor: payload.usedFor,
    uploadedById: payload.uploadedById ?? null,
  };

  return prisma.media.create({ data });
};
