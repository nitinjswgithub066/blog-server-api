"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNewsletterWelcomeTemplate = void 0;
const baseEmail_template_1 = require("./baseEmail.template");
const buildNewsletterWelcomeTemplate = (data) => {
    const content = `
    <h2>Welcome to the Newsletter! 🎉</h2>
    <p>Thank you for subscribing. You'll now receive our best articles on Technology, AI, Startups, and more.</p>
    <br/>
    <a href="#" style="background: #6d5df6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read Latest Posts</a>
    <br/><br/>
    <p style="font-size: 12px; color: #888;">To unsubscribe at any time, click <a href="${data.unsubscribeLink}">here</a>.</p>
  `;
    return {
        subject: "Welcome to our Newsletter!",
        html: (0, baseEmail_template_1.baseEmailTemplate)(content),
        text: `Welcome to our Newsletter! You can unsubscribe at any time using this link: ${data.unsubscribeLink}`,
    };
};
exports.buildNewsletterWelcomeTemplate = buildNewsletterWelcomeTemplate;
//# sourceMappingURL=newsletterWelcome.template.js.map