import { PostStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { getCategoryPostsService } from "../public-posts/publicPost.service";

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

const mapCategory = (category: { id: string; name: string; slug: string; _count: { posts: number } }) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: `Explore published ${category.name} articles, guides, and insights.`,
  icon: iconBySlug[category.slug] || "FiBookOpen",
  accentColor: accentBySlug[category.slug] || "var(--accent-primary)",
  coverImage: "",
  postCount: category._count.posts,
});

export const getActiveCategoriesService = async () => {
  const categories = await prisma.category.findMany({
    where: { posts: { some: { status: PostStatus.PUBLISHED, deletedAt: null } } },
    include: {
      _count: {
        select: { posts: { where: { status: PostStatus.PUBLISHED, deletedAt: null } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return categories.map(mapCategory);
};

export const getCategoryWithPostsService = async (slug: string, page?: string, limit?: string) => {
  const category = await prisma.category.findFirst({
    where: { slug, posts: { some: { status: PostStatus.PUBLISHED, deletedAt: null } } },
    include: {
      _count: {
        select: { posts: { where: { status: PostStatus.PUBLISHED, deletedAt: null } } },
      },
    },
  });
  if (!category) return null;
  return {
    category: mapCategory(category),
    ...(await getCategoryPostsService(slug, page, limit)),
  };
};
