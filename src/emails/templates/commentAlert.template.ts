import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate } from "./baseEmail.template";

export const buildCommentAlertTemplate = (data: { postTitle: string; authorName: string; commentContent: string; }): EmailTemplateResult => {
  const content = `
    <h2>New Comment Alert</h2>
    <p>A new comment was posted on your article: <strong>${data.postTitle}</strong></p>
    <p><strong>From:</strong> ${data.authorName}</p>
    <p><strong>Comment:</strong><br/>${data.commentContent}</p>
    <br/>
    <a href="#" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Comment</a>
  `;

  return {
    subject: `New Comment on: ${data.postTitle}`,
    html: baseEmailTemplate(content),
    text: `New Comment by ${data.authorName} on ${data.postTitle}: ${data.commentContent}`,
  };
};
