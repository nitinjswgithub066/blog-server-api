import { baseEmailTemplate, detailRows, emailButton, escapeHtml, securityNote } from "./baseEmail.template";

export const getAdminAccountCreatedTemplate = (data: {
  name: string;
  email: string;
  username: string;
  adminRegistrationCode: string;
  loginUrl: string;
}) => {
  return baseEmailTemplate(`
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">Your admin account is ready</h1>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">Hello ${escapeHtml(data.name)}, your admin account has been created successfully.</p>
    ${detailRows([
      ["Admin name", data.name],
      ["Email", data.email],
      ["Username", data.username],
      ["Admin Registration Code", data.adminRegistrationCode],
    ])}
    ${securityNote("Save this Admin Registration Code securely. It is required during password reset. This code will not be shown again.")}
    <div style="margin-top:24px;">${emailButton(data.loginUrl, "Login to Dashboard")}</div>
  `);
};
