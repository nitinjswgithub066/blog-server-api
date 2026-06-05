"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSystemAlertTemplate = void 0;
const baseEmail_template_1 = require("./baseEmail.template");
const buildSystemAlertTemplate = (data) => {
    const content = `
    <h2>System Alert: ${data.title}</h2>
    <p>Please review the following system notification:</p>
    <div style="background: #fdf2f2; border: 1px solid #f8b4b4; padding: 15px; border-radius: 5px; color: #c81e1e;">
      <p style="margin: 0; font-family: monospace;">${data.details}</p>
    </div>
  `;
    return {
        subject: `[SYSTEM ALERT] ${data.title}`,
        html: (0, baseEmail_template_1.baseEmailTemplate)(content),
        text: `SYSTEM ALERT: ${data.title}\
\
${data.details}`,
    };
};
exports.buildSystemAlertTemplate = buildSystemAlertTemplate;
//# sourceMappingURL=systemAlert.template.js.map