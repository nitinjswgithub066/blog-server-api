import { EmailType, SubscriberStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { emailService } from "../../emails/email.service";
import { createNotificationService } from "../notifications/notification.service";

type SubscribePayload = {
  email?: string;
  name?: string;
  source?: string;
};

const getAdminAlertEmail = () =>
  process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER;

export const subscribeService = async (payload: SubscribePayload) => {
  const email = payload.email?.trim().toLowerCase();
  if (!email) throw new Error("Email is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required.");
  const name = payload.name?.trim();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  const alreadySubscribed = existing?.status === SubscriberStatus.ACTIVE;
  const updateData: {
    status: SubscriberStatus;
    name?: string;
    source?: string;
    unsubscribedAt: null;
  } = {
    status: SubscriberStatus.ACTIVE,
    unsubscribedAt: null,
  };

  if (name) updateData.name = name;
  if (payload.source) updateData.source = payload.source;

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: updateData,
    create: {
      email,
      name: name || null,
      source: payload.source || null,
    },
  });

  if (!alreadySubscribed) {
    await createNotificationService({
      type: "subscriber",
      title: "New subscriber joined",
      message: `${email} subscribed to VEXIRAHUB.`,
      metadata: { subscriberId: subscriber.id, email },
    });
  }

  const adminEmail = getAdminAlertEmail();
  if (adminEmail && !alreadySubscribed) {
    await emailService.queueEmail({
      to: adminEmail,
      subject: "New subscriber joined",
      html: `<h2>New subscriber joined</h2><p>${email} subscribed to VEXIRAHUB.</p>`,
      text: `New subscriber joined\n\n${email} subscribed to VEXIRAHUB.`,
      type: EmailType.NEWSLETTER_WELCOME,
    });
  }

  return { subscriber, alreadySubscribed };
};

export const getSubscribersService = async () =>
  prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
