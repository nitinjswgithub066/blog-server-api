import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate, emailButton, escapeHtml } from "./baseEmail.template";

export const buildNewPostPublishedTemplate = (data: {
  postTitle: string;
  postUrl: string;
  excerpt: string;
}): EmailTemplateResult => {
  const content = `
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">New article published</h1>
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:20px;line-height:1.35;">${escapeHtml(data.postTitle)}</h2>
    <p style="margin:0 0 22px;color:#cbd5e1;font-size:15px;line-height:1.7;">${escapeHtml(data.excerpt)}</p>
    ${emailButton(data.postUrl, "Read Article")}
  `;

  return {
    subject: `New Post: ${data.postTitle}`,
    html: baseEmailTemplate(content),
    text: `New article published! ${data.postTitle}\nRead it here: ${data.postUrl}`,
  };
};
