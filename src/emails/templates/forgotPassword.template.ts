import { EmailTemplateResult } from "../email.types";
import { baseEmailTemplate } from "./baseEmail.template";

export const buildForgotPasswordTemplate = (data: { resetLink: string; }): EmailTemplateResult => {
  const content = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the button below to set a new password. If you didn't request this, you can safely ignore this email.</p>
    <br/>
    <a href="${data.resetLink}" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
  `;

  return {
    subject: "Reset your password",
    html: baseEmailTemplate(content),
    text: `Reset your password using this link: ${data.resetLink}`,
  };
};
