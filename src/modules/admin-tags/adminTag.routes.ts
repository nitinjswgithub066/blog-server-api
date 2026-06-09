import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import { createAdminTag, getAdminTags } from "./adminTag.controller";

const router = Router();

router.use(verifyAdminToken);

router.get("/", getAdminTags);
router.post("/", createAdminTag);

export default router;
