export const escapeHtml = (value: string | number | null | undefined) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const emailButton = (href: string, label: string) => `
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:10px;box-shadow:0 12px 28px rgba(124,58,237,0.28);">
    ${escapeHtml(label)}
  </a>
`;

export const detailRows = (rows: Array<[string, string | number | null | undefined]>) => `
  <div style="background:#111827;border:1px solid #273244;border-radius:14px;padding:16px;margin:20px 0;">
    ${rows.map(([label, value], index) => `
      <div style="padding:8px 0;${index < rows.length - 1 ? "border-bottom:1px solid #202b3d;" : ""}">
        <div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">${escapeHtml(label)}</div>
        <div style="font-size:15px;color:#f8fafc;font-weight:650;word-break:break-word;">${escapeHtml(value)}</div>
      </div>
    `).join("")}
  </div>
`;

export const securityNote = (message: string) => `
  <div style="background:#1f1635;border:1px solid rgba(168,85,247,0.35);border-radius:14px;padding:14px 16px;color:#ddd6fe;font-size:14px;line-height:1.6;margin:22px 0;">
    <strong style="color:#ffffff;">Security note:</strong> ${escapeHtml(message)}
  </div>
`;

export const baseEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fullstack Blog and News Platform</title>
</head>
<body style="margin:0;padding:0;background:#050712;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Fullstack Blog and News Platform notification.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050712;padding:32px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
          <tr>
            <td style="text-align:center;padding:10px 0 24px;">
              <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#a78bfa;font-weight:800;">Fullstack Blog</div>
              <div style="font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;margin-top:6px;">Fullstack Blog and News Platform</div>
            </td>
          </tr>
          <tr>
            <td style="background:#0b1020;border:1px solid #1f2a44;border-radius:22px;padding:30px;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="text-align:center;color:#8b95a7;font-size:12px;line-height:1.6;padding:22px 12px 0;">
              This is an automated email. Do not share sensitive codes or reset links.<br/>
              &copy; ${new Date().getFullYear()} Fullstack Blog and News Platform.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
