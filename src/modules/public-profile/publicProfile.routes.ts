import { Router } from "express";
import { getPublicProfile, getPublicSocials } from "./publicProfile.controller";

const router = Router();
router.get("/", getPublicProfile);
router.get("/socials", getPublicSocials);
export default router;
