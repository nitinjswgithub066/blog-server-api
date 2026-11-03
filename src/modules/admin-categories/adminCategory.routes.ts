import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
} from "./adminCategory.controller";

const router = Router();

router.use(verifyAdminToken);

router.get("/", getAdminCategories);
router.post("/", createAdminCategory);
router.delete("/:id", deleteAdminCategory);

export default router;
