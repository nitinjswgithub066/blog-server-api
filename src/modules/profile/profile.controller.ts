import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { profileService } from "./profile.service";
import { validateProfileUpdate, validateSocialUpdate } from "./profile.validation";

const requireAdminId = (req: AuthRequest, res: Response) => {
  if (!req.adminId) {
    sendError(res, 401, "Unauthorized");
    return null;
  }
  return req.adminId;
};

const handleError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  const clientError =
    message.includes("required") ||
    message.includes("valid") ||
    message.includes("cannot exceed") ||
    message.includes("already in use") ||
    message.includes("Unsupported") ||
    message.includes("too large");
  return sendError(res, clientError ? 400 : 500, message);
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    return sendSuccess(res, 200, "Profile retrieved successfully.", await profileService.getProfile(adminId));
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    const input = validateProfileUpdate(req.body);
    return sendSuccess(res, 200, "Profile updated successfully.", await profileService.updateProfile(adminId, input));
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    if (!req.file) return sendError(res, 400, "Image file is required.");
    return sendSuccess(res, 200, "Profile image updated successfully.", await profileService.uploadAvatar(adminId, req.file));
  } catch (error) {
    return handleError(res, error);
  }
};

export const getProfileStats = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    return sendSuccess(res, 200, "Profile stats retrieved successfully.", await profileService.getStats(adminId));
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSocials = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    return sendSuccess(res, 200, "Social profiles retrieved successfully.", await profileService.getSocials(adminId));
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateSocials = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    const input = validateSocialUpdate(req.body);
    return sendSuccess(res, 200, "Social profiles updated successfully.", await profileService.updateSocials(adminId, input));
  } catch (error) {
    return handleError(res, error);
  }
};
