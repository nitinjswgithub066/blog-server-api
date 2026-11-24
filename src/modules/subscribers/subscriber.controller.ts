import { Request, Response } from "express";
import { getSubscribersService, subscribeService } from "./subscriber.service";

const sendSubscriberError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = message.includes("required") || message.includes("valid") ? 400 : 500;
  res.status(status).json({ success: false, message });
};

export const subscribe = async (req: Request, res: Response) => {
  try {
    const data = await subscribeService(req.body);
    res.status(data.alreadySubscribed ? 200 : 201).json({
      success: true,
      message: data.alreadySubscribed ? "This email is already subscribed." : "Subscription saved successfully.",
      data,
    });
  } catch (error) {
    console.error("[SUBSCRIBERS] Error subscribing:", error);
    sendSubscriberError(res, error);
  }
};

export const getSubscribers = async (_req: Request, res: Response) => {
  try {
    const data = await getSubscribersService();
    res.json({ success: true, message: "Subscribers fetched successfully.", data });
  } catch (error) {
    console.error("[SUBSCRIBERS] Error fetching subscribers:", error);
    sendSubscriberError(res, error);
  }
};
