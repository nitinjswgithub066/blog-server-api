import { Router } from "express";
import { verifyAdminToken } from "../../middlewares/auth.middleware";
import { getSubscribers, subscribe } from "./subscriber.controller";

export const publicSubscriberRouter = Router();
publicSubscriberRouter.post("/", subscribe);

const adminSubscriberRouter = Router();
adminSubscriberRouter.use(verifyAdminToken);
adminSubscriberRouter.get("/", getSubscribers);

export default adminSubscriberRouter;
