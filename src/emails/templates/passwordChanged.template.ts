import { baseEmailTemplate, detailRows, escapeHtml, securityNote } from "./baseEmail.template";

export const getPasswordChangedTemplate = (data: {
  name: string;
  time: string;
}) => {
  return baseEmailTemplate(`
    <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;line-height:1.25;">Your password was changed</h1>
    <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">Hello ${escapeHtml(data.name)}, this confirms your admin password was changed.</p>
    ${detailRows([["Changed at", data.time]])}
    ${securityNote("If this was not you, reset your password immediately and review your account access.")}
  `);
};
