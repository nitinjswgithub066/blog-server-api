import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  exportStatisticsReportService,
  GoogleSheetExportNotConfiguredError,
  getCategoryPerformanceService,
  getStatisticsOverviewService,
  getStatisticsService,
  getTopPostPerformanceService,
  getTrafficTrendService,
} from "./adminStatistics.service";

const sendStatisticsError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ success: false, message });
};

export const getStatistics = async (req: Request, res: Response) => {
  try {
    const data = await getStatisticsService(req.query);
    res.json({ success: true, message: "Statistics fetched successfully.", data });
  } catch (error) {
    console.error("[ADMIN_STATISTICS] Error fetching statistics:", error);
    sendStatisticsError(res, error);
  }
};

export const exportStatisticsReport = async (req: Request, res: Response) => {
  try {
    const adminReq = req as AuthRequest;
    const file = await exportStatisticsReportService(req.body, adminReq.adminId);

    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  } catch (error) {
    if (error instanceof GoogleSheetExportNotConfiguredError) {
      res.status(501).json({ success: false, message: "Google Sheet export is not configured yet." });
      return;
    }

    console.error("[ADMIN_STATISTICS] Error exporting statistics report:", error);
    sendStatisticsError(res, error);
  }
};

export const getStatisticsOverview = async (req: Request, res: Response) => {
  try {
    const data = await getStatisticsOverviewService(req.query);
    res.json({ success: true, message: "Statistics overview fetched successfully.", data });
  } catch (error) {
    console.error("[ADMIN_STATISTICS] Error fetching overview:", error);
    sendStatisticsError(res, error);
  }
};

export const getTrafficTrend = async (req: Request, res: Response) => {
  try {
    const data = await getTrafficTrendService(req.query);
    res.json({ success: true, message: "Traffic trend fetched successfully.", data });
  } catch (error) {
    console.error("[ADMIN_STATISTICS] Error fetching traffic trend:", error);
    sendStatisticsError(res, error);
  }
};

export const getCategoryPerformance = async (req: Request, res: Response) => {
  try {
    const data = await getCategoryPerformanceService(req.query);
    res.json({ success: true, message: "Category performance fetched successfully.", data });
  } catch (error) {
    console.error("[ADMIN_STATISTICS] Error fetching category performance:", error);
    sendStatisticsError(res, error);
  }
};

export const getTopPostPerformance = async (req: Request, res: Response) => {
  try {
    const data = await getTopPostPerformanceService(req.query);
    res.json({ success: true, message: "Top post performance fetched successfully.", data });
  } catch (error) {
    console.error("[ADMIN_STATISTICS] Error fetching top posts:", error);
    sendStatisticsError(res, error);
  }
};
