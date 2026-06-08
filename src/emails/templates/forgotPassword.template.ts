import { baseEmailTemplate, emailButton, escapeHtml, securityNote } from "./baseEmail.template";

export const getForgotPasswordTemplate = (data: {
  resetUrl: string;
  expiresInMinutes?: number;
}) => {
  const expires = data.expiresInMinutes || 15;

  return baseEmailTemplate(`
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">Reset your admin password</h1>
    <p style="margin:0 0 18px;color:#cbd5e1;font-size:15px;line-height:1.7;">We received a request to reset your admin password. Use the button below to create a new password.</p>
    <div style="margin:24px 0;">${emailButton(data.resetUrl, "Reset Password")}</div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">This link expires in ${expires} minutes. You will also need your Admin Registration Code to complete the reset.</p>
    <div style="background:#111827;border:1px solid #273244;border-radius:12px;padding:12px;margin-top:18px;color:#cbd5e1;font-size:13px;line-height:1.6;word-break:break-all;">
      ${escapeHtml(data.resetUrl)}
    </div>
    ${securityNote("If you did not request a password reset, ignore this email and keep your Admin Registration Code private.")}
  `);
};
