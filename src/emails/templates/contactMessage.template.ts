import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate, detailRows, emailButton, escapeHtml } from "./baseEmail.template";

export const buildContactMessageTemplate = (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  dashboardUrl?: string;
}): EmailTemplateResult => {
  const content = `
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">New contact message</h1>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">A visitor sent a message from the blog contact form.</p>
    ${detailRows([
      ["Name", data.name],
      ["Email", data.email],
      ["Subject", data.subject],
    ])}
    <div style="background:#111827;border:1px solid #273244;border-radius:14px;padding:16px;margin:20px 0;color:#e5e7eb;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(data.message)}</div>
    ${data.dashboardUrl ? `<div style="margin-top:24px;">${emailButton(data.dashboardUrl, "Open Dashboard")}</div>` : ""}
  `;

  return {
    subject: `New Contact Form Submission: ${data.subject}`,
    html: baseEmailTemplate(content),
    text: `New Contact Message\nName: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\nMessage: ${data.message}`,
  };
};
