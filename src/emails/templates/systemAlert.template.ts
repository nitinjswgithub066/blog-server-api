import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate } from "./baseEmail.template";

export const buildSystemAlertTemplate = (data: { title: string; details: string; }): EmailTemplateResult => {
  const content = `
    <h2>System Alert: ${data.title}</h2>
    <p>Please review the following system notification:</p>
    <div style="background: #fdf2f2; border: 1px solid #f8b4b4; padding: 15px; border-radius: 5px; color: #c81e1e;">
      <p style="margin: 0; font-family: monospace;">${data.details}</p>
    </div>
  `;

  return {
    subject: `[SYSTEM ALERT] ${data.title}`,
    html: baseEmailTemplate(content),
    text: `SYSTEM ALERT: ${data.title}\
\
${data.details}`,
  };
};
