import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate } from "./baseEmail.template";

export const buildNewPostPublishedTemplate = (data: { postTitle: string; postUrl: string; excerpt: string; }): EmailTemplateResult => {
  const content = `
    <h2>New Article Published!</h2>
    <h3>${data.postTitle}</h3>
    <p>${data.excerpt}</p>
    <br/>
    <a href="${data.postUrl}" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read Article</a>
  `;

  return {
    subject: `New Post: ${data.postTitle}`,
    html: baseEmailTemplate(content),
    text: `New article published! ${data.postTitle}\
Read it here: ${data.postUrl}`,
  };
};
