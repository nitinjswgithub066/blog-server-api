import { PostStatus, Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { prisma } from "../../config/prisma";

type StatisticsRange = "daily" | "weekly" | "monthly";
type StatisticsSort = "most_viewed" | "most_shared";
type Trend = "up" | "down" | "stable";
export type StatisticsExportFormat = "csv" | "excel" | "pdf" | "google_sheet";

type StatisticsQuery = {
  range?: string | undefined;
  categoryId?: string | undefined;
  sort?: string | undefined;
  page?: string | undefined;
  limit?: string | undefined;
};

type StatisticsExportSections = {
  overview?: boolean | undefined;
  trafficTrend?: boolean | undefined;
  categoryPerformance?: boolean | undefined;
  topPosts?: boolean | undefined;
  charts?: boolean | undefined;
};

export type StatisticsExportPayload = {
  range?: string | undefined;
  categoryId?: string | undefined;
  sort?: string | undefined;
  format?: string | undefined;
  sections?: StatisticsExportSections | undefined;
};

export class GoogleSheetExportNotConfiguredError extends Error {
  constructor() {
    super("Google Sheet export is not configured yet.");
  }
}

const visiblePostStatuses = [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.SCHEDULED, PostStatus.ARCHIVED];

const normalizeRange = (range?: string): StatisticsRange =>
  range === "weekly" || range === "monthly" ? range : "daily";

const normalizeSort = (sort?: string): StatisticsSort => (sort === "most_shared" ? "most_shared" : "most_viewed");

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const startOfWeek = (date: Date) => {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(start, diff);
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getPeriod = (range: StatisticsRange) => {
  const now = new Date();

  if (range === "weekly") {
    const start = startOfWeek(now);
    const end = addDays(start, 7);
    return { start, end, previousStart: addDays(start, -7), previousEnd: start };
  }

  if (range === "monthly") {
    const start = startOfMonth(now);
    const end = addMonths(start, 1);
    return { start, end, previousStart: addMonths(start, -1), previousEnd: start };
  }

  const start = startOfDay(now);
  const end = addDays(start, 1);
  return { start, end, previousStart: addDays(start, -1), previousEnd: start };
};

const analyticsWhere = (
  start: Date,
  end: Date,
  categoryId?: string
): Prisma.AnalyticsWhereInput => ({
  date: {
    gte: start,
    lt: end,
  },
  ...(categoryId && categoryId !== "all"
    ? {
        OR: [
          { categoryId },
          { post: { categoryId } },
        ],
      }
    : {}),
});

const postWhere = (categoryId?: string, start?: Date, end?: Date): Prisma.PostWhereInput => ({
  status: { in: visiblePostStatuses },
  ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
  ...(start && end
    ? {
        updatedAt: {
          gte: start,
          lt: end,
        },
      }
    : {}),
});

const growth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const trend = (value: number): Trend => {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "stable";
};

const overviewMetric = (value: number, label: string, previous: number, unit?: string) => {
  const metricGrowth = growth(value, previous);
  return {
    value,
    ...(unit ? { unit } : {}),
    label,
    growth: metricGrowth,
    trend: trend(metricGrowth),
  };
};

const sumAnalytics = async (start: Date, end: Date, categoryId?: string) =>
  prisma.analytics.aggregate({
    where: analyticsWhere(start, end, categoryId),
    _sum: {
      clicks: true,
      views: true,
      shares: true,
      readingTime: true,
    },
    _count: {
      _all: true,
    },
  });

const sumPosts = async (categoryId?: string, start?: Date, end?: Date) =>
  prisma.post.aggregate({
    where: postWhere(categoryId, start, end),
    _sum: {
      clicks: true,
      views: true,
      shares: true,
      readingTime: true,
    },
    _count: {
      _all: true,
    },
  });

const labelForRange = (range: StatisticsRange, metric: "clicks" | "views" | "readingTime" | "shares") => {
  const prefix = range === "daily" ? "Daily" : range === "weekly" ? "Weekly" : "Monthly";
  if (metric === "clicks") return `${prefix} Clicks`;
  if (metric === "readingTime") return "Reading Time";
  if (metric === "shares") return "Shares";
  return "Views";
};

export const getStatisticsOverviewService = async (query: StatisticsQuery) => {
  const range = normalizeRange(query.range);
  const { start, end, previousStart, previousEnd } = getPeriod(range);
  const categoryId = query.categoryId;

  const [currentAnalytics, previousAnalytics] = await Promise.all([
    sumAnalytics(start, end, categoryId),
    sumAnalytics(previousStart, previousEnd, categoryId),
  ]);

  const useAnalytics = currentAnalytics._count._all > 0 || previousAnalytics._count._all > 0;

  const [current, previous] = useAnalytics
    ? [currentAnalytics, previousAnalytics]
    : await Promise.all([
        sumPosts(categoryId, start, end),
        sumPosts(categoryId, previousStart, previousEnd),
      ]);

  const currentReadingCount = Math.max(current._count._all, 1);
  const previousReadingCount = Math.max(previous._count._all, 1);
  const currentReadingTime = Math.round((current._sum.readingTime || 0) / currentReadingCount);
  const previousReadingTime = Math.round((previous._sum.readingTime || 0) / previousReadingCount);

  return {
    clicks: overviewMetric(current._sum.clicks || 0, labelForRange(range, "clicks"), previous._sum.clicks || 0),
    views: overviewMetric(current._sum.views || 0, labelForRange(range, "views"), previous._sum.views || 0),
    readingTime: overviewMetric(currentReadingTime, labelForRange(range, "readingTime"), previousReadingTime, "min"),
    shares: overviewMetric(current._sum.shares || 0, labelForRange(range, "shares"), previous._sum.shares || 0),
  };
};

const buildTrendBuckets = (range: StatisticsRange, start: Date) => {
  if (range === "daily") {
    return Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour),
      label: `${hour}:00`,
      start: new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour),
      end: new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour + 1),
    }));
  }

  if (range === "weekly") {
    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = addDays(start, index);
      const bucketEnd = addDays(bucketStart, 1);
      return {
        key: bucketStart.toISOString().slice(0, 10),
        label: bucketStart.toLocaleDateString("en-US", { weekday: "short" }),
        start: bucketStart,
        end: bucketEnd,
      };
    });
  }

  const monthEnd = addMonths(start, 1);
  const days = Math.ceil((monthEnd.getTime() - start.getTime()) / 86400000);
  return Array.from({ length: days }, (_, index) => {
    const bucketStart = addDays(start, index);
    const bucketEnd = addDays(bucketStart, 1);
    return {
      key: bucketStart.toISOString().slice(0, 10),
      label: String(index + 1),
      start: bucketStart,
      end: bucketEnd,
    };
  });
};

export const getTrafficTrendService = async (query: StatisticsQuery) => {
  const range = normalizeRange(query.range);
  const { start, end } = getPeriod(range);
  const categoryId = query.categoryId;
  const buckets = buildTrendBuckets(range, start);

  const analytics = await prisma.analytics.findMany({
    where: analyticsWhere(start, end, categoryId),
    select: {
      date: true,
      hour: true,
      views: true,
      clicks: true,
    },
  });

  const posts = analytics.length > 0
    ? []
    : await prisma.post.findMany({
        where: postWhere(categoryId, start, end),
        select: {
          updatedAt: true,
          views: true,
          clicks: true,
        },
      });

  const series = buckets.map((bucket) => {
    const analyticsItems = analytics.filter((item) => {
      if (range === "daily") return (item.hour ?? item.date.getHours()) === Number(bucket.key);
      return item.date >= bucket.start && item.date < bucket.end;
    });
    const postItems = posts.filter((post) => post.updatedAt >= bucket.start && post.updatedAt < bucket.end);

    return {
      label: bucket.label,
      views: analyticsItems.length > 0
        ? analyticsItems.reduce((sum, item) => sum + item.views, 0)
        : postItems.reduce((sum, post) => sum + post.views, 0),
      clicks: analyticsItems.length > 0
        ? analyticsItems.reduce((sum, item) => sum + item.clicks, 0)
        : postItems.reduce((sum, post) => sum + post.clicks, 0),
    };
  });

  return { range, series };
};

export const getCategoryPerformanceService = async (query: StatisticsQuery) => {
  const range = normalizeRange(query.range);
  const sort = normalizeSort(query.sort);
  const { start, end, previousStart, previousEnd } = getPeriod(range);
  const categoryId = query.categoryId;

  const [categories, currentPosts, previousPosts] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.post.findMany({
      where: postWhere(categoryId === "all" ? undefined : categoryId),
      include: { category: true },
    }),
    prisma.post.findMany({
      where: postWhere(categoryId === "all" ? undefined : categoryId, previousStart, previousEnd),
      include: { category: true },
    }),
  ]);

  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const previousByCategory = new Map<string, number>();

  for (const post of previousPosts) {
    const id = post.categoryId || "uncategorized";
    const score = sort === "most_shared" ? post.shares : post.views;
    previousByCategory.set(id, (previousByCategory.get(id) || 0) + score);
  }

  const grouped = new Map<string, {
    categoryId: string;
    category: string;
    views: number;
    clicks: number;
    shares: number;
  }>();

  for (const post of currentPosts) {
    const id = post.categoryId || "uncategorized";
    const item = grouped.get(id) || {
      categoryId: id,
      category: post.category?.name || categoryMap.get(id) || "Uncategorized",
      views: 0,
      clicks: 0,
      shares: 0,
    };
    item.views += post.views;
    item.clicks += post.clicks;
    item.shares += post.shares;
    grouped.set(id, item);
  }

  return Array.from(grouped.values())
    .map((item) => {
      const currentScore = sort === "most_shared" ? item.shares : item.views;
      const metricGrowth = growth(currentScore, previousByCategory.get(item.categoryId) || 0);
      return {
        ...item,
        growth: metricGrowth,
        trend: trend(metricGrowth),
      };
    })
    .sort((a, b) => {
      const scoreA = sort === "most_shared" ? a.shares : a.views;
      const scoreB = sort === "most_shared" ? b.shares : b.views;
      return scoreB - scoreA;
    })
    .slice(0, 8);
};

export const getTopPostPerformanceService = async (query: StatisticsQuery) => {
  const range = normalizeRange(query.range);
  const sort = normalizeSort(query.sort);
  const { previousStart, previousEnd } = getPeriod(range);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 50);
  const where = postWhere(query.categoryId === "all" ? undefined : query.categoryId);
  const orderBy: Prisma.PostOrderByWithRelationInput[] = sort === "most_shared"
    ? [{ shares: "desc" }, { views: "desc" }]
    : [{ views: "desc" }, { shares: "desc" }];

  const [posts, total, previousPosts] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
    prisma.post.findMany({
      where: postWhere(query.categoryId === "all" ? undefined : query.categoryId, previousStart, previousEnd),
      select: { id: true, views: true, shares: true },
    }),
  ]);

  const previousByPost = new Map(previousPosts.map((post) => [post.id, sort === "most_shared" ? post.shares : post.views]));

  return {
    items: posts.map((post, index) => {
      const currentScore = sort === "most_shared" ? post.shares : post.views;
      const metricGrowth = growth(currentScore, previousByPost.get(post.id) || 0);
      return {
        rank: (page - 1) * limit + index + 1,
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category?.name || "Uncategorized",
        status: post.status,
        views: post.views,
        clicks: post.clicks,
        readingTime: post.readingTime,
        shares: post.shares,
        growth: metricGrowth,
        trend: trend(metricGrowth),
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasMore: page * limit < total,
    },
  };
};

export const getStatisticsService = async (query: StatisticsQuery) => {
  const [overview, trafficTrend, categoryPerformance, topPosts] = await Promise.all([
    getStatisticsOverviewService(query),
    getTrafficTrendService(query),
    getCategoryPerformanceService(query),
    getTopPostPerformanceService(query),
  ]);

  return {
    overview,
    trafficTrend,
    categoryPerformance,
    topPosts,
  };
};

const exportSectionDefaults = {
  overview: true,
  trafficTrend: true,
  categoryPerformance: true,
  topPosts: true,
  charts: true,
};

const normalizeExportFormat = (format?: string): StatisticsExportFormat => {
  if (format === "excel" || format === "pdf" || format === "google_sheet") return format;
  return "csv";
};

const formatDateTime = (date: Date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const rangeLabel = (range: StatisticsRange) => {
  if (range === "weekly") return "Weekly";
  if (range === "monthly") return "Monthly";
  return "Daily";
};

const sortLabel = (sort: StatisticsSort) => (sort === "most_shared" ? "Most Shared" : "Most Viewed");

const escapeCsvCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (values: Array<string | number | null | undefined>) => values.map(escapeCsvCell).join(",");

const addWorksheetRows = (
  sheet: ExcelJS.Worksheet,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) => {
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column) => {
    column.width = Math.max(
      14,
      ...((column.values || [])
        .slice(1)
        .map((value) => String(value ?? "").length + 2))
    );
  });
};

const drawPdfTable = (
  doc: PDFKit.PDFDocument,
  title: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) => {
  doc.moveDown(1);
  doc.fontSize(14).fillColor("#111827").text(title);
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor("#475569").text(headers.join(" | "));
  doc.moveDown(0.25);

  rows.forEach((row) => {
    if (doc.y > 720) doc.addPage();
    doc.fillColor("#0f172a").text(row.map((value) => String(value ?? "")).join(" | "), {
      width: 500,
    });
  });
};

const buildExportRows = async (payload: StatisticsExportPayload, adminId?: string) => {
  const range = normalizeRange(payload.range);
  const sort = normalizeSort(payload.sort);
  const categoryId = payload.categoryId || "all";
  const sections = { ...exportSectionDefaults, ...(payload.sections || {}) };
  const generatedAt = new Date();

  const [statistics, category, admin] = await Promise.all([
    getStatisticsService({ range, categoryId, sort, page: "1", limit: "50" }),
    categoryId !== "all"
      ? prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } })
      : Promise.resolve(null),
    adminId
      ? prisma.adminUser.findUnique({ where: { id: adminId }, select: { name: true, email: true } })
      : Promise.resolve(null),
  ]);

  return {
    metadata: {
      site: "VEXIRAHUB",
      report: "Statistics Report",
      generatedAt,
      generatedAtLabel: formatDateTime(generatedAt),
      generatedBy: admin?.name || admin?.email || "Admin",
      range: rangeLabel(range),
      category: category?.name || "All Categories",
      sort: sortLabel(sort),
      includesChartVisuals: sections.charts ? "Yes" : "No",
    },
    sections,
    statistics,
  };
};

const buildCsvExport = async (payload: StatisticsExportPayload, adminId?: string) => {
  const { metadata, sections, statistics } = await buildExportRows(payload, adminId);
  const lines: string[] = [];

  lines.push(csvRow(["VEXIRAHUB Statistics Report"]));
  lines.push(csvRow(["Generated At", metadata.generatedAtLabel]));
  lines.push(csvRow(["Generated By", metadata.generatedBy]));
  lines.push(csvRow(["Range", metadata.range]));
  lines.push(csvRow(["Category", metadata.category]));
  lines.push(csvRow(["Sort", metadata.sort]));
  lines.push(csvRow(["Include Chart Visuals", metadata.includesChartVisuals]));
  lines.push("");

  if (sections.overview) {
    lines.push(csvRow(["Overview Summary"]));
    lines.push(csvRow(["Metric", "Value", "Unit", "Growth", "Trend"]));
    Object.values(statistics.overview).forEach((metric) => {
      lines.push(csvRow([metric.label, metric.value, metric.unit || "", `${metric.growth}%`, metric.trend]));
    });
    lines.push("");
  }

  if (sections.trafficTrend) {
    lines.push(csvRow(["Traffic Trend"]));
    lines.push(csvRow(["Label", "Views", "Clicks"]));
    statistics.trafficTrend.series.forEach((point) => {
      lines.push(csvRow([point.label, point.views, point.clicks]));
    });
    lines.push("");
  }

  if (sections.categoryPerformance) {
    lines.push(csvRow(["Category Performance"]));
    lines.push(csvRow(["Category", "Views", "Clicks", "Shares", "Growth", "Trend"]));
    statistics.categoryPerformance.forEach((category) => {
      lines.push(csvRow([
        category.category,
        category.views,
        category.clicks,
        category.shares,
        `${category.growth}%`,
        category.trend,
      ]));
    });
    lines.push("");
  }

  if (sections.topPosts) {
    lines.push(csvRow(["Top Post Performance"]));
    lines.push(csvRow(["Rank", "Title", "Category", "Status", "Views", "Clicks", "Reading Time", "Shares", "Growth", "Trend"]));
    statistics.topPosts.items.forEach((post) => {
      lines.push(csvRow([
        post.rank,
        post.title,
        post.category,
        post.status,
        post.views,
        post.clicks,
        post.readingTime,
        post.shares,
        `${post.growth}%`,
        post.trend,
      ]));
    });
  }

  return Buffer.from(lines.join("\n"), "utf8");
};

const buildExcelExport = async (payload: StatisticsExportPayload, adminId?: string) => {
  const { metadata, sections, statistics } = await buildExportRows(payload, adminId);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "VEXIRAHUB";
  workbook.created = metadata.generatedAt;

  addWorksheetRows(workbook.addWorksheet("Report Info"), ["Field", "Value"], [
    ["Site", metadata.site],
    ["Report", metadata.report],
    ["Generated At", metadata.generatedAtLabel],
    ["Generated By", metadata.generatedBy],
    ["Range", metadata.range],
    ["Category", metadata.category],
    ["Sort", metadata.sort],
    ["Include Chart Visuals", metadata.includesChartVisuals],
  ]);

  if (sections.overview) {
    addWorksheetRows(workbook.addWorksheet("Overview"), ["Metric", "Value", "Unit", "Growth", "Trend"], Object.values(statistics.overview).map((metric) => [
      metric.label,
      metric.value,
      metric.unit || "",
      `${metric.growth}%`,
      metric.trend,
    ]));
  }

  if (sections.trafficTrend) {
    addWorksheetRows(workbook.addWorksheet("Traffic Trend"), ["Label", "Views", "Clicks"], statistics.trafficTrend.series.map((point) => [
      point.label,
      point.views,
      point.clicks,
    ]));
  }

  if (sections.categoryPerformance) {
    addWorksheetRows(workbook.addWorksheet("Category Performance"), ["Category", "Views", "Clicks", "Shares", "Growth", "Trend"], statistics.categoryPerformance.map((category) => [
      category.category,
      category.views,
      category.clicks,
      category.shares,
      `${category.growth}%`,
      category.trend,
    ]));
  }

  if (sections.topPosts) {
    addWorksheetRows(workbook.addWorksheet("Top Posts"), ["Rank", "Title", "Category", "Status", "Views", "Clicks", "Reading Time", "Shares", "Growth", "Trend"], statistics.topPosts.items.map((post) => [
      post.rank,
      post.title,
      post.category,
      post.status,
      post.views,
      post.clicks,
      post.readingTime,
      post.shares,
      `${post.growth}%`,
      post.trend,
    ]));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const buildPdfExport = async (payload: StatisticsExportPayload, adminId?: string) => {
  const { metadata, sections, statistics } = await buildExportRows(payload, adminId);
  const doc = new PDFDocument({ margin: 42, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const complete = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(22).fillColor("#111827").text("VEXIRAHUB Statistics Report");
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#475569").text(`Generated At: ${metadata.generatedAtLabel}`);
  doc.text(`Generated By: ${metadata.generatedBy}`);
  doc.text(`Range: ${metadata.range}`);
  doc.text(`Category: ${metadata.category}`);
  doc.text(`Sort: ${metadata.sort}`);
  doc.text(`Include Chart Visuals: ${metadata.includesChartVisuals}`);

  if (sections.overview) {
    drawPdfTable(doc, "Overview Summary", ["Metric", "Value", "Unit", "Growth", "Trend"], Object.values(statistics.overview).map((metric) => [
      metric.label,
      metric.value,
      metric.unit || "",
      `${metric.growth}%`,
      metric.trend,
    ]));
  }

  if (sections.trafficTrend) {
    drawPdfTable(doc, "Traffic Trend", ["Label", "Views", "Clicks"], statistics.trafficTrend.series.map((point) => [
      point.label,
      point.views,
      point.clicks,
    ]));
  }

  if (sections.categoryPerformance) {
    drawPdfTable(doc, "Category Performance", ["Category", "Views", "Clicks", "Shares", "Growth", "Trend"], statistics.categoryPerformance.map((category) => [
      category.category,
      category.views,
      category.clicks,
      category.shares,
      `${category.growth}%`,
      category.trend,
    ]));
  }

  if (sections.topPosts) {
    drawPdfTable(doc, "Top Post Performance", ["Rank", "Title", "Category", "Status", "Views", "Clicks", "Reading", "Shares", "Growth"], statistics.topPosts.items.map((post) => [
      post.rank,
      post.title,
      post.category,
      post.status,
      post.views,
      post.clicks,
      `${post.readingTime} min`,
      post.shares,
      `${post.growth}%`,
    ]));
  }

  doc.end();
  return complete;
};

const isGoogleSheetConfigured = () =>
  Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GOOGLE_SHEETS_FOLDER_ID
  );

export const exportStatisticsReportService = async (payload: StatisticsExportPayload, adminId?: string) => {
  const format = normalizeExportFormat(payload.format);
  const range = normalizeRange(payload.range);
  const generatedStamp = new Date().toISOString().slice(0, 10);
  const baseFileName = `vexirahub-statistics-${range}-${generatedStamp}`;

  if (format === "google_sheet") {
    if (!isGoogleSheetConfigured()) throw new GoogleSheetExportNotConfiguredError();
    throw new GoogleSheetExportNotConfiguredError();
  }

  if (format === "excel") {
    return {
      buffer: await buildExcelExport(payload, adminId),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: `${baseFileName}.xlsx`,
    };
  }

  if (format === "pdf") {
    return {
      buffer: await buildPdfExport(payload, adminId),
      contentType: "application/pdf",
      fileName: `${baseFileName}.pdf`,
    };
  }

  return {
    buffer: await buildCsvExport(payload, adminId),
    contentType: "text/csv; charset=utf-8",
    fileName: `${baseFileName}.csv`,
  };
};
