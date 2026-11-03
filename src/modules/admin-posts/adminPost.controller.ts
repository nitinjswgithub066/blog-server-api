import { Request, Response } from "express";
import { MediaUsage, PostStatus } from "@prisma/client";
import mammoth from "mammoth";
import {
  archivePostService,
  bulkArchivePostsService,
  bulkDeletePostsService,
  bulkExportPostsService,
  bulkMovePostsToDraftService,
  bulkPublishPostsService,
  createDraftPostService,
  createMediaRecord,
  duplicatePostService,
  getAdminPostByIdService,
  getAdminPostPreviewService,
  getAdminPostsService,
  getAdminPostsSummaryService,
  getRecentAdminPostsService,
  movePostToDraftService,
  publishPostService,
  restorePostService,
  schedulePostService,
  softDeleteAdminPostService,
  updatePostService,
} from "./adminPost.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { uploadBufferToCloudinary } from "../../services/cloudinary.service";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinaryImageUrl";
import { sanitizePostHtml } from "../../utils/sanitizePostHtml";

const getIdParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const sendControllerError = (res: Response, error: any, fallback = "Internal server error") => {
  const message = error?.message || fallback;
  const status = [
    "Title required.",
    "Content required.",
    "Category required.",
    "Maximum 10 tags are allowed.",
    "Subheading cannot exceed 450 characters.",
    "Schedule time must be in future.",
    "Unsupported file type.",
    "File too large.",
    "Unsupported export format.",
  ].includes(message)
    ? 400
    : message === "DOCX export will be available after Word export package is configured."
      ? 501
    : 500;

  res.status(status).json({ success: false, message });
};

const requireAdminId = (req: AuthRequest, res: Response) => {
  if (!req.adminId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.adminId;
};

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

const validateImageFile = (file?: Express.Multer.File) => {
  if (!file) throw new Error("Image file is required.");
  const hasValidExtension = imageExtensions.some((ext) => file.originalname.toLowerCase().endsWith(ext));
  if (!imageMimeTypes.has(file.mimetype) && !hasValidExtension) throw new Error("Unsupported file type.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File too large.");
};

const validateDocumentFile = (file?: Express.Multer.File) => {
  if (!file) throw new Error("Document file is required.");
  const name = file.originalname.toLowerCase();
  const valid = name.endsWith(".docx") || name.endsWith(".html") || name.endsWith(".htm") || name.endsWith(".doc");
  if (!valid) throw new Error("Unsupported file type.");
  if (file.size > 10 * 1024 * 1024) throw new Error("File too large.");
};

export const getRecentAdminPosts = async (req: Request, res: Response) => {
  try {
    const data = await getRecentAdminPostsService(
      req.query.status as string | undefined,
      req.query.limit as string | undefined
    );
    res.json({ success: true, message: "Recent posts fetched successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching recent posts:", error);
    sendControllerError(res, error);
  }
};

export const getAdminPosts = async (req: Request, res: Response) => {
  try {
    const data = await getAdminPostsService({
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      sort: req.query.sort as string | undefined,
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
    });
    res.json({ success: true, message: "Posts fetched successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching posts:", error);
    sendControllerError(res, error);
  }
};

export const getAdminPostsSummary = async (_req: Request, res: Response) => {
  try {
    const data = await getAdminPostsSummaryService();
    res.json({ success: true, message: "Post summary fetched successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching post summary:", error);
    sendControllerError(res, error);
  }
};

export const getAdminPostById = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await getAdminPostByIdService(id);
    if (!data) return res.status(404).json({ success: false, message: "Post not found." });

    res.json({ success: true, message: "Post fetched successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching post:", error);
    sendControllerError(res, error);
  }
};

export const getAdminPostPreview = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await getAdminPostPreviewService(id);
    if (!data) return res.status(404).json({ success: false, message: "Post not found." });

    res.json({ success: true, message: "Post preview fetched successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error fetching post preview:", error);
    sendControllerError(res, error);
  }
};

export const createDraftPost = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;

    const data = await createDraftPostService(req.body, adminId);
    res.status(201).json({ success: true, message: "Draft saved successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error creating draft:", error);
    sendControllerError(res, error);
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const nextStatus = req.body.status === "draft" || req.body.status === "DRAFT" ? PostStatus.DRAFT : undefined;
    const data = await updatePostService(id, req.body, nextStatus);
    if (!data) return res.status(404).json({ success: false, message: "Post not found." });

    res.json({ success: true, message: "Post updated successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error updating post:", error);
    sendControllerError(res, error);
  }
};

export const publishPost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await publishPostService(id, req.body);
    res.json({ success: true, message: "Post published successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error publishing post:", error);
    sendControllerError(res, error);
  }
};

export const duplicatePost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await duplicatePostService(id);
    if (!data) return res.status(404).json({ success: false, message: "Post not found." });

    res.status(201).json({ success: true, message: "Post duplicated as draft successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error duplicating post:", error);
    sendControllerError(res, error);
  }
};

export const movePostToDraft = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await movePostToDraftService(id);
    if (!data) return res.status(404).json({ success: false, message: "Post not found." });

    res.json({ success: true, message: "Post moved to draft successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error moving post to draft:", error);
    sendControllerError(res, error);
  }
};

export const schedulePost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await schedulePostService(id, req.body);
    res.json({ success: true, message: "Post scheduled successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error scheduling post:", error);
    sendControllerError(res, error);
  }
};

export const deleteAdminPost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });

    const data = await softDeleteAdminPostService(id);
    if (!data) return res.status(404).json({ success: false, message: "Post not found." });

    res.json({
      success: true,
      message: "Post moved to archive for 14 days.",
      data,
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error deleting post:", error);
    sendControllerError(res, error);
  }
};

export const archivePost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });
    const data = await archivePostService(id);
    res.json({ success: true, message: "Post archived successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error archiving post:", error);
    sendControllerError(res, error);
  }
};

export const restorePost = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Post id is required." });
    const data = await restorePostService(id);
    res.json({ success: true, message: "Post restored as draft successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error restoring post:", error);
    sendControllerError(res, error);
  }
};

export const bulkPublishPosts = async (req: Request, res: Response) => {
  try {
    const data = await bulkPublishPostsService(req.body.ids);
    res.json({ success: true, message: "Bulk publish completed.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error bulk publishing posts:", error);
    sendControllerError(res, error);
  }
};

export const bulkMovePostsToDraft = async (req: Request, res: Response) => {
  try {
    const data = await bulkMovePostsToDraftService(req.body.ids);
    res.json({ success: true, message: "Bulk move to draft completed.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error bulk moving posts to draft:", error);
    sendControllerError(res, error);
  }
};

export const bulkArchivePosts = async (req: Request, res: Response) => {
  try {
    const data = await bulkArchivePostsService(req.body.ids);
    res.json({ success: true, message: "Bulk archive completed.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error bulk archiving posts:", error);
    sendControllerError(res, error);
  }
};

export const bulkDeletePosts = async (req: Request, res: Response) => {
  try {
    const data = await bulkDeletePostsService(req.body.ids);
    res.json({ success: true, message: "Bulk delete completed. Posts moved to archive for 14 days.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error bulk deleting posts:", error);
    sendControllerError(res, error);
  }
};

export const bulkExportPosts = async (req: Request, res: Response) => {
  try {
    const data = await bulkExportPostsService(req.body.ids, req.body.format);
    res.json({ success: true, message: "Posts exported successfully.", data });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error bulk exporting posts:", error);
    sendControllerError(res, error);
  }
};

export const uploadCoverImage = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    validateImageFile(req.file);

    const upload = await uploadBufferToCloudinary(req.file!.buffer, {
      folder: "blog-platform/posts/covers",
      resourceType: "image",
      originalFilename: req.file!.originalname,
    });

    await createMediaRecord({
      url: upload.url,
      publicId: upload.publicId,
      folder: "blog-platform/posts/covers",
      resourceType: upload.resourceType,
      mimeType: req.file!.mimetype,
      format: upload.format,
      bytes: upload.bytes,
      width: upload.width,
      height: upload.height,
      usedFor: MediaUsage.COVER_IMAGE,
      uploadedById: adminId,
    });

    res.json({
      success: true,
      message: "Cover image uploaded successfully.",
      data: {
        url: upload.url,
        publicId: upload.publicId,
        optimizedCoverUrl: getOptimizedCloudinaryUrl(upload.url, "cover"),
        optimizedCardUrl: getOptimizedCloudinaryUrl(upload.url, "card"),
        optimizedThumbnailUrl: getOptimizedCloudinaryUrl(upload.url, "thumbnail"),
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error uploading cover image:", error);
    sendControllerError(res, error, "Upload failed");
  }
};

export const uploadInlineImage = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    validateImageFile(req.file);

    const upload = await uploadBufferToCloudinary(req.file!.buffer, {
      folder: "blog-platform/posts/inline",
      resourceType: "image",
      originalFilename: req.file!.originalname,
    });

    await createMediaRecord({
      url: upload.url,
      publicId: upload.publicId,
      folder: "blog-platform/posts/inline",
      resourceType: upload.resourceType,
      mimeType: req.file!.mimetype,
      format: upload.format,
      bytes: upload.bytes,
      width: upload.width,
      height: upload.height,
      usedFor: MediaUsage.INLINE_IMAGE,
      uploadedById: adminId,
    });

    res.json({
      success: true,
      message: "Inline image uploaded successfully.",
      data: {
        url: getOptimizedCloudinaryUrl(upload.url, "inline"),
        originalUrl: upload.url,
        publicId: upload.publicId,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error uploading inline image:", error);
    sendControllerError(res, error, "Upload failed");
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = requireAdminId(req, res);
    if (!adminId) return;
    validateDocumentFile(req.file);

    const file = req.file!;
    const fileName = file.originalname;
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith(".doc")) {
      return res.status(400).json({
        success: false,
        message: ".doc files are not supported in V1. Export as .docx or .html.",
      });
    }

    const originalUpload = await uploadBufferToCloudinary(file.buffer, {
      folder: "blog-platform/temp",
      resourceType: "raw",
      originalFilename: file.originalname,
    });

    await createMediaRecord({
      url: originalUpload.url,
      publicId: originalUpload.publicId,
      folder: "blog-platform/temp",
      resourceType: originalUpload.resourceType,
      mimeType: file.mimetype,
      format: originalUpload.format,
      bytes: originalUpload.bytes,
      usedFor: MediaUsage.TEMP,
      uploadedById: adminId,
    });

    let contentHtml = "";
    if (lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
      contentHtml = sanitizePostHtml(file.buffer.toString("utf8"));
    } else {
      const conversion = await mammoth.convertToHtml(
        { buffer: file.buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const imageBuffer = Buffer.from(await image.read("base64"), "base64");
            const upload = await uploadBufferToCloudinary(imageBuffer, {
              folder: "blog-platform/posts/inline",
              resourceType: "image",
            });

            await createMediaRecord({
              url: upload.url,
              publicId: upload.publicId,
              folder: "blog-platform/posts/inline",
              resourceType: upload.resourceType,
              format: upload.format,
              bytes: upload.bytes,
              width: upload.width,
              height: upload.height,
              usedFor: MediaUsage.INLINE_IMAGE,
              uploadedById: adminId,
            });

            return {
              src: getOptimizedCloudinaryUrl(upload.url, "inline") || upload.url,
              alt: "",
            };
          }),
        }
      );
      contentHtml = sanitizePostHtml(conversion.value);
    }

    const titleMatch = contentHtml.match(/<h1[^>]*>(.*?)<\/h1>/i) || contentHtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const title = titleMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || fileName.replace(/\.[^.]+$/, "");

    res.json({
      success: true,
      message: "Document converted successfully.",
      data: {
        fileName,
        title,
        contentHtml,
        contentCss: "",
        sourceType: "DOC_UPLOAD",
        conversionStatus: "COMPLETED",
        originalDocumentUrl: originalUpload.url,
        originalDocumentPublicId: originalUpload.publicId,
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_POSTS] Error uploading document:", error);
    sendControllerError(res, error, "Upload failed");
  }
};
