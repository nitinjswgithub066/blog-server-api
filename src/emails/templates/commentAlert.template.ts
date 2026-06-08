import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate, detailRows, emailButton, escapeHtml } from "./baseEmail.template";

export const buildCommentAlertTemplate = (data: {
  postTitle: string;
  authorName: string;
  authorEmail?: string;
  commentContent: string;
  reviewUrl?: string;
}): EmailTemplateResult => {
  const content = `
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">New comment alert</h1>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">A new comment was posted and may need review.</p>
    ${detailRows([
      ["Post", data.postTitle],
      ["Author", data.authorName],
      ["Author email", data.authorEmail || "Not provided"],
    ])}
    <div style="background:#111827;border:1px solid #273244;border-radius:14px;padding:16px;margin:20px 0;color:#e5e7eb;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(data.commentContent)}</div>
    ${data.reviewUrl ? `<div style="margin-top:24px;">${emailButton(data.reviewUrl, "Review Comment")}</div>` : ""}
  `;

  return {
    subject: `New Comment on: ${data.postTitle}`,
    html: baseEmailTemplate(content),
    text: `New Comment by ${data.authorName} on ${data.postTitle}: ${data.commentContent}`,
  };
};
