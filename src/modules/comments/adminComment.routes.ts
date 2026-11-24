import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import { deleteAdminComment, getAdminComments, updateAdminComment } from "./adminComment.controller";

const router = Router();
router.use(verifyAdminToken);
router.get("/", getAdminComments);
router.patch("/:id", updateAdminComment);
router.delete("/:id", deleteAdminComment);
export default router;
