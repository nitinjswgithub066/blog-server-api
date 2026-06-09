import { prisma, runPrismaWithRetry } from "../../config/prisma";
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
  const snapshots = await prisma.trendSnapshot.findMany({
    orderBy: [
      { snapshotDate: "desc" },
      { score: "desc" },
    ],
    take: 100,
  });

  const latestByCategory = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    if (!latestByCategory.has(snapshot.category)) {
      latestByCategory.set(snapshot.category, snapshot);
    }
  }

  const latestSnapshots = Array.from(latestByCategory.values())
    .filter(snapshot => snapshot.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

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
        title: topCategory.category === secondCategory?.category 
          ? topCategory.category 
          : `${topCategory?.category} ${secondCategory?.category ? `/ ${secondCategory.category}` : ''}`.trim(),
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
      title: `${topCategory?.category} / ${secondCategory?.category || ''}`.trim().replace(' /', ''),
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

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 7);
  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - 14);
  const postIds = rankedPosts.map(post => post.id);

  const analyticsRows = await prisma.analytics.findMany({
    where: {
      postId: { in: postIds },
      date: {
        gte: previousStart,
        lte: now,
      },
    },
    select: {
      postId: true,
      date: true,
      views: true,
      clicks: true,
      shares: true,
    },
  });

  const currentScores = new Map<string, number>();
  const previousScores = new Map<string, number>();

  for (const row of analyticsRows) {
    if (!row.postId) continue;

    const score = row.views + (row.clicks * 2) + (row.shares * 3);
    const bucket = row.date >= currentStart ? currentScores : previousScores;
    bucket.set(row.postId, (bucket.get(row.postId) || 0) + score);
  }

  return rankedPosts.map((post, idx) => ({
    ...(() => {
      const currentScore = currentScores.get(post.id) || 0;
      const previousScore = previousScores.get(post.id) || 0;
      const growth = previousScore > 0
        ? ((currentScore - previousScore) / previousScore) * 100
        : currentScore > 0 ? 100 : 0;

      return {
        rank: idx + 1,
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category?.name || "Uncategorized",
        views: post.views,
        clicks: post.clicks,
        shares: post.shares,
        growth: Number(growth.toFixed(1)),
        isTrending: post.isTrending || growth >= 10,
      };
    })()
  }));
};

export const getBlogPerformanceService = async (range: string, dateStr: string | undefined, source: string = 'internal') => {
  // Logic for blog performance
  // 1. Determine start and end date boundaries
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  let startDate = new Date(targetDate);
  let endDate = new Date(targetDate);

  // Define period boundaries
  if (range === 'daily') {
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'weekly') {
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startDate = new Date(startDate.setDate(diff));
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'monthly') {
    startDate.setDate(1);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === 'yearly') {
    startDate.setMonth(0, 1);
    endDate = new Date(startDate.getFullYear(), 11, 31);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Default fallback to daily
    endDate.setHours(23, 59, 59, 999);
  }

  // 2. Fetch data from Analytics table
  const analyticsData = await prisma.analytics.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // 3. Process into series based on range
  let series: any[] = [];
  
  if (range === 'daily') {
    // Return empty 24-hour block for structural integrity
    series = Array.from({ length: 24 }).map((_, i) => ({
      label: i.toString().padStart(2, '0') + ':00',
      clicks: 0,
      traffic: 0,
      hour: i
    }));

    // Fill actual data
    analyticsData.forEach(row => {
      if (row.hour !== null && row.hour !== undefined && series[row.hour]) {
        series[row.hour].traffic += row.views;
        series[row.hour].clicks += row.clicks;
      }
    });

  } else if (range === 'weekly') {
    // 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    series = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return {
        label: days[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        clicks: 0,
        traffic: 0,
      };
    });

    analyticsData.forEach(row => {
      const dStr = new Date(row.date).toISOString().split('T')[0];
      const match = series.find(s => s.dateStr === dStr);
      if (match) {
        match.traffic += row.views;
        match.clicks += row.clicks;
      }
    });
  } else if (range === 'monthly') {
    // Days in month
    const daysInMonth = endDate.getDate();
    series = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(i + 1);
      return {
        label: (i + 1).toString(),
        dateStr: d.toISOString().split('T')[0],
        clicks: 0,
        traffic: 0,
      };
    });

    analyticsData.forEach(row => {
      const dStr = new Date(row.date).toISOString().split('T')[0];
      const match = series.find(s => s.dateStr === dStr);
      if (match) {
        match.traffic += row.views;
        match.clicks += row.clicks;
      }
    });
  } else if (range === 'yearly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    series = Array.from({ length: 12 }).map((_, i) => ({
      label: months[i],
      monthIdx: i,
      clicks: 0,
      traffic: 0,
    }));

    analyticsData.forEach(row => {
      const mIdx = new Date(row.date).getMonth();
      if (series[mIdx]) {
        series[mIdx].traffic += row.views;
        series[mIdx].clicks += row.clicks;
      }
    });
  }

  // Summary
  const totalTraffic = analyticsData.reduce((sum, row) => sum + row.views, 0);
  const totalClicks = analyticsData.reduce((sum, row) => sum + row.clicks, 0);
  const averageReadingTime = analyticsData.length > 0 
    ? Math.round(analyticsData.reduce((sum, row) => sum + row.readingTime, 0) / analyticsData.length)
    : 0;

  // Next/Prev date calculation
  const prevDate = new Date(startDate);
  let nextDateObj = new Date(endDate);

  if (range === 'daily') {
    prevDate.setDate(startDate.getDate() - 1);
    nextDateObj.setDate(startDate.getDate() + 1);
  } else if (range === 'weekly') {
    prevDate.setDate(startDate.getDate() - 7);
    nextDateObj.setDate(endDate.getDate() + 1);
  } else if (range === 'monthly') {
    prevDate.setMonth(startDate.getMonth() - 1);
    nextDateObj.setDate(endDate.getDate() + 1);
  } else if (range === 'yearly') {
    prevDate.setFullYear(startDate.getFullYear() - 1);
    nextDateObj.setFullYear(startDate.getFullYear() + 1);
  }

  const nextDate = nextDateObj > new Date() ? null : nextDateObj.toISOString().split('T')[0];

  let currentLabel = 'Today';
  if (range === 'daily') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (diff === 0) currentLabel = 'Today';
    else if (diff === 1) currentLabel = 'Yesterday';
    else currentLabel = diff + ' days ago';
  } else if (range === 'weekly') {
    currentLabel = 'Week of ' + startDate.toISOString().split('T')[0];
  } else if (range === 'monthly') {
    currentLabel = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (range === 'yearly') {
    currentLabel = startDate.getFullYear().toString();
  }

  return {
    range,
    source: 'INTERNAL_ANALYTICS',
    currentLabel,
    navigation: {
      previousDate: prevDate.toISOString().split('T')[0],
      nextDate
    },
    series,
    summary: {
      totalClicks,
      totalTraffic,
      averageReadingTime,
      growth: 0
    }
  };
};

export const getTopicNotesService = async () => {
  return await runPrismaWithRetry(() => prisma.topicNote.findMany({
    orderBy: [
      { isCompleted: 'asc' },
      { createdAt: 'desc' }
    ],
    include: {
      category: {
        select: { name: true }
      }
    }
  }));
};

export const createTopicNoteService = async (title: string, categoryId?: string, adminId?: string) => {
  const activeCount = await runPrismaWithRetry(() => prisma.topicNote.count({
    where: { isCompleted: false }
  }));

  if (activeCount >= 5) {
    throw new Error('You can save only 5 active topic ideas. Complete or delete one before adding a new topic.');
  }

  let finalCategoryId = null;

  // Try to find the category by ID, or by name if categoryId was actually the name
  if (categoryId) {
    const cat = await runPrismaWithRetry(() => prisma.category.findFirst({
      where: {
        OR: [
          { id: categoryId },
          { name: categoryId }
        ]
      }
    }));
    
    if (cat) {
      finalCategoryId = cat.id;
    }
  }

  return await runPrismaWithRetry(() => prisma.topicNote.create({
    data: {
      title,
      categoryId: finalCategoryId,
      adminId: adminId ?? null
    },
    include: {
      category: {
        select: { name: true }
      }
    }
  }));
};

export const updateTopicNoteService = async (id: string, isCompleted: boolean) => {
  return await runPrismaWithRetry(() => prisma.topicNote.update({
    where: { id },
    data: { isCompleted },
    include: {
      category: {
        select: { name: true }
      }
    }
  }));
};

export const deleteTopicNoteService = async (id: string) => {
  return await runPrismaWithRetry(() => prisma.topicNote.delete({
    where: { id }
  }));
};
