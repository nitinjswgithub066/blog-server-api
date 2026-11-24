import { NextFunction, Response, Router } from "express";
import multer from "multer";
import { AuthRequest, verifyAdminToken } from "../../middlewares/auth.middleware";
import { sendError } from "../../utils/apiResponse";
import {
  getProfile,
  getProfileStats,
  getSocials,
  updateProfile,
  updateSocials,
  uploadAvatar,
} from "./profile.controller";

const router = Router();
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Unsupported image file type."));
      return;
    }
    callback(null, true);
  },
});
const handleAvatarUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Profile image must be 5 MB or smaller."
        : error.message || "Profile image upload failed.";
    sendError(res, 400, message);
  });
};

router.use(verifyAdminToken);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/avatar", handleAvatarUpload, uploadAvatar);
router.get("/stats", getProfileStats);
router.get("/socials", getSocials);
router.patch("/socials", updateSocials);

export default router;
