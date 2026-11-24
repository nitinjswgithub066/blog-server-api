import { Request, Response } from "express";
import { getPublicProfileService } from "./publicProfile.service";

export const getPublicProfile = async (_req: Request, res: Response) => {
  try {
    const profile = await getPublicProfileService();
    if (!profile) return res.status(404).json({ success: false, message: "Author profile not found." });
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error("[PUBLIC_PROFILE]", error);
    res.status(500).json({ success: false, message: "Unable to load author profile." });
  }
};

export const getPublicSocials = async (_req: Request, res: Response) => {
  try {
    const profile = await getPublicProfileService();
    if (!profile) return res.status(404).json({ success: false, message: "Author profile not found." });
    res.json({ success: true, data: profile.socialLinks });
  } catch (error) {
    console.error("[PUBLIC_PROFILE]", error);
    res.status(500).json({ success: false, message: "Unable to load social profiles." });
  }
};
