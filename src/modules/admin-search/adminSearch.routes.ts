import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import { globalSearch } from "./adminSearch.controller";

const router = Router();

router.use(verifyAdminToken);
router.get("/", globalSearch);

export default router;
