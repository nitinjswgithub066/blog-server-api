import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate, emailButton, escapeHtml } from "./baseEmail.template";

export const buildNewsletterWelcomeTemplate = (data: {
  unsubscribeLink: string;
  latestPostsUrl?: string;
}): EmailTemplateResult => {
  const latestPostsUrl = data.latestPostsUrl || "#";
  const content = `
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">Welcome to the newsletter</h1>
    <p style="margin:0 0 18px;color:#cbd5e1;font-size:15px;line-height:1.7;">Thanks for subscribing. You will receive selected stories across technology, AI, startups, and practical web development.</p>
    <div style="margin:24px 0;">${emailButton(latestPostsUrl, "Read Latest Posts")}</div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">You can unsubscribe anytime using this link:</p>
    <p style="margin:8px 0 0;color:#a78bfa;font-size:13px;line-height:1.6;word-break:break-all;">${escapeHtml(data.unsubscribeLink)}</p>
  `;

  return {
    subject: "Welcome to the Fullstack Blog newsletter",
    html: baseEmailTemplate(content),
    text: `Welcome to the Fullstack Blog newsletter. You can unsubscribe at any time using this link: ${data.unsubscribeLink}`,
  };
};
