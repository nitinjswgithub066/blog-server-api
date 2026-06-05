"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNewPostPublishedTemplate = void 0;
const baseEmail_template_1 = require("./baseEmail.template");
const buildNewPostPublishedTemplate = (data) => {
    const content = `
    <h2>New Article Published!</h2>
    <h3>${data.postTitle}</h3>
    <p>${data.excerpt}</p>
    <br/>
    <a href="${data.postUrl}" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read Article</a>
  `;
    return {
        subject: `New Post: ${data.postTitle}`,
        html: (0, baseEmail_template_1.baseEmailTemplate)(content),
        text: `New article published! ${data.postTitle}\
Read it here: ${data.postUrl}`,
    };
};
exports.buildNewPostPublishedTemplate = buildNewPostPublishedTemplate;
//# sourceMappingURL=newPostPublished.template.js.map