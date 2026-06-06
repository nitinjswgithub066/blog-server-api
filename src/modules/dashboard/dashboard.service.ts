import { prisma } from "../../config/prisma";
import { DashboardSearchTrendsResponse, TopPerformingPost } from "./dashboard.types";

const getCleanLabel = (category: string): string => {
  if (!category) return "";
  const labelMap: Record<string, string> = {
    "Artificial Intelligence": "AI",
    "Web Development": "Web Dev",
    "Technology": "Tech",
    "Programming": "Programming",
    "Startups": "Startups",
  };
  return labelMap[category] || (category.split(" ")[0] || category).slice(0, 10);
};

export const getSearchTrendsService = async (): Promise<DashboardSearchTrendsResponse | null> => {
  // First try to fetch the latest TrendSnapshot
  const latestSnapshots = await prisma.trendSnapshot.findMany({
    orderBy: { score: "desc" },
    take: 10,
  });

  if (latestSnapshots.length > 0) {
    const chart = latestSnapshots.map(s => ({
      category: s.category,
      label: s.label || getCleanLabel(s.category),
      score: s.score,
      growth: s.growth,
    }));

    const topCategory = chart[0]!;
    const fastestGrowing = [...chart].sort((a, b) => b.growth - a.growth)[0]!;
    const secondCategory = chart[1];

    const topSnapshot = latestSnapshots[0]!;

    return {
      source: topSnapshot.source,
      lastUpdated: topSnapshot.snapshotDate,
      chart,
      topCategory: {
        category: topCategory.category,
        score: topCategory.score,
      },
      fastestGrowing: {
        category: fastestGrowing.category,
        growth: fastestGrowing.growth,
      },
      suggestedNext: {
        title: `\${topCategory?.category} / \${secondCategory?.category || ''}`.trim().replace(' /', ''),
        reason: "High score and strong recent growth",
      },
    };
  }

  // Fallback if no snapshots exist yet
  const categories = await prisma.category.findMany({
    include: {
      posts: {
        select: { views: true, clicks: true, shares: true },
      },
    },
  });

  if (categories.length === 0) {
    return null;
  }

  const chart = categories.map(cat => {
    const score = cat.posts.reduce((sum, post) => sum + post.views + (post.clicks * 2) + (post.shares * 3), 0);
    return {
      category: cat.name,
      label: getCleanLabel(cat.name),
      score,
      growth: 0,
    };
  }).filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);

  if (chart.length === 0) return null;

  const topCategory = chart[0]!;
  const secondCategory = chart[1];

  return {
    source: "INTERNAL_ANALYTICS_FALLBACK",
    lastUpdated: new Date(),
    chart,
    topCategory: {
      category: topCategory.category,
      score: topCategory.score,
    },
    fastestGrowing: {
      category: topCategory.category,
      growth: 0,
    },
    suggestedNext: {
      title: `\${topCategory?.category} / \${secondCategory?.category || ''}`.trim().replace(' /', ''),
      reason: "Based on all-time high engagement",
    },
  };
};

export const getTopPerformingPostsService = async (): Promise<TopPerformingPost[]> => {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
  });

  const rankedPosts = posts.map(post => {
    // V1 formula
    const score = post.views + post.clicks;
    return { ...post, score };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  if (rankedPosts.length === 0) return [];

  // Determine highest growth for trending badge
  // As a fallback (if growth is 0), mark the #1 post
  return rankedPosts.map((post, idx) => ({
    rank: idx + 1,
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category?.name || "Uncategorized",
    views: post.views,
    clicks: post.clicks,
    shares: post.shares,
    growth: 0, // Fallback, could be calculated from analytics
    isTrending: idx === 0, // Mark rank #1 if no actual growth diff
  }));
};
