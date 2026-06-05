"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommentAlertTemplate = void 0;
const baseEmail_template_1 = require("./baseEmail.template");
const buildCommentAlertTemplate = (data) => {
    const content = `
    <h2>New Comment Alert</h2>
    <p>A new comment was posted on your article: <strong>${data.postTitle}</strong></p>
    <p><strong>From:</strong> ${data.authorName}</p>
    <p><strong>Comment:</strong><br/>${data.commentContent}</p>
    <br/>
    <a href="#" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Comment</a>
  `;
    return {
        subject: `New Comment on: ${data.postTitle}`,
        html: (0, baseEmail_template_1.baseEmailTemplate)(content),
        text: `New Comment by ${data.authorName} on ${data.postTitle}: ${data.commentContent}`,
    };
};
exports.buildCommentAlertTemplate = buildCommentAlertTemplate;
//# sourceMappingURL=commentAlert.template.js.map